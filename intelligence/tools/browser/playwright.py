"""Playwright browser provider with process isolation and bounded lifecycle.
Guarantees clean OS process termination on Windows, eliminates thread deadlocks,
and enforces strict timeout budgets.
"""

import asyncio
import logging
import subprocess
import sys
from intelligence.tools.browser.base import BrowserProvider
from backend.config.config import settings

log = logging.getLogger(__name__)


def _run_worker_sync(cmd: list[str], timeout_sec: float) -> tuple[int, bytes, bytes]:
    """Execute the browser worker process in a standard OS process thread.
    Bypasses Windows asyncio event loop limitations (e.g. SelectorEventLoop NotImplementedError).
    """
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    try:
        stdout, stderr = proc.communicate(timeout=timeout_sec + 2.0)
        return proc.returncode, stdout, stderr
    except subprocess.TimeoutExpired:
        log.warning("Playwright worker process timed out. Terminating.")
        try:
            if sys.platform == "win32" and proc.pid:
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    capture_output=True,
                    timeout=5,
                )
            else:
                proc.kill()
            proc.communicate(timeout=2)
        except Exception:
            pass
        raise TimeoutError(f"Playwright rendering timed out after {timeout_sec}s")


class PlaywrightBrowserProvider(BrowserProvider):
    """Isolated process Playwright browser provider."""

    def __init__(self):
        # Enforce serialized browser access so at most 1 Chromium instance runs concurrently
        self._lock = asyncio.Lock()

    async def fetch_rendered(self, url: str) -> str:
        if not settings.playwright_enabled:
            raise RuntimeError("Playwright provider is disabled in settings.")

        # Hard ceiling: never allow browser rendering to exceed 15 seconds
        timeout_sec = min(float(settings.browser_timeout), 15.0)
        timeout_ms = int(timeout_sec * 1000)

        async with self._lock:
            cmd = [
                sys.executable,
                "-m",
                "intelligence.tools.browser.worker",
                url,
                str(timeout_ms),
            ]
            try:
                # First attempt async subprocess; if current event loop does not support
                # subprocess transports (e.g. SelectorEventLoop on Windows), fall back to thread-pool Popen
                use_async_proc = True
                try:
                    proc = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                except NotImplementedError:
                    use_async_proc = False

                if use_async_proc:
                    try:
                        stdout, stderr = await asyncio.wait_for(
                            proc.communicate(),
                            timeout=timeout_sec + 2.0,
                        )
                    except (asyncio.TimeoutError, TimeoutError):
                        log.warning("Playwright worker process timed out for %s. Terminating.", url)
                        try:
                            if sys.platform == "win32" and proc.pid:
                                subprocess.run(
                                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                                    capture_output=True,
                                    timeout=5,
                                )
                            else:
                                proc.kill()
                            await proc.wait()
                        except Exception:
                            pass
                        raise TimeoutError(f"Playwright rendering timed out after {timeout_sec}s")

                    returncode = proc.returncode
                else:
                    returncode, stdout, stderr = await asyncio.to_thread(
                        _run_worker_sync, cmd, timeout_sec
                    )

                if returncode != 0:
                    err_msg = stderr.decode("utf-8", errors="replace").strip()
                    raise RuntimeError(f"Playwright worker failed (code {returncode}): {err_msg}")

                content = stdout.decode("utf-8", errors="replace")
                if not content.strip():
                    raise RuntimeError("Playwright returned empty content.")
                return content

            except Exception as exc:
                log.warning("PlaywrightBrowserProvider failed for %s: %s", url, exc)
                raise RuntimeError(f"Playwright rendering failed: {exc}")
