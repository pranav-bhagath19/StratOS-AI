import os
import sys

def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    timeout_sec = int(sys.argv[2]) if len(sys.argv) > 2 else 15

    from playwright.sync_api import sync_playwright
    p = sync_playwright().start()
    try:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_sec * 1000)
            content = page.content()
            sys.stdout.write(f"SUCCESS: {len(content)} chars")
            sys.stdout.flush()
        finally:
            browser.close()
    finally:
        # Explicitly terminate the driver subprocess to prevent hanging
        try:
            p._transport._proc.kill()
        except Exception:
            pass

if __name__ == "__main__":
    main()
