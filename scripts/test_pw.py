import time
from playwright.sync_api import sync_playwright

t0 = time.time()
print("Starting sync_playwright...")
try:
    with sync_playwright() as p:
        print(f"Driver started in {time.time() - t0:.2f}s. Launching chromium...")
        t1 = time.time()
        browser = p.chromium.launch(headless=True)
        print(f"Chromium launched in {time.time() - t1:.2f}s. Creating page...")
        page = browser.new_page()
        print("Navigating to https://example.com...")
        t2 = time.time()
        page.goto("https://example.com", timeout=10000)
        print(f"Navigated in {time.time() - t2:.2f}s. Title: {page.title()}")
        browser.close()
    print(f"Total time: {time.time() - t0:.2f}s")
except Exception as e:
    print(f"FAILED: {e}")
