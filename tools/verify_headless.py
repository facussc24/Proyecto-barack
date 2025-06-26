import subprocess
import requests
import time
from playwright.sync_api import sync_playwright

server = subprocess.Popen(["python", "server.py"])

for _ in range(10):
    try:
        requests.get("http://localhost:5000/health").raise_for_status()
        break
    except Exception:
        time.sleep(1)
else:
    server.kill()
    raise RuntimeError("server not responding")

# prepare data
requests.post("http://localhost:5000/api/data", json={})
requests.post(
    "http://localhost:5000/api/clientes",
    json={"codigo": "C1", "nombre": "Test", "user": "admin"},
)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5000/login.html")
    with page.expect_navigation():
        page.click("#adminBtn")
    page.goto("http://localhost:5000/history.html")
    page.wait_for_selector("#historyTable tbody tr")

    bg = page.evaluate(
        "getComputedStyle(document.querySelector('.tabla-contenedor')).backgroundColor"
    )
    assert "255, 255, 255" in bg

    rows = page.locator("#historyTable tbody tr")
    assert rows.count() >= 1

    cache = requests.get("http://localhost:5000/index.html")
    assert cache.headers.get("Cache-Control") == "no-store"

    # verify reconnect handler defined in history.js
    with open("docs/js/history.js", "r", encoding="utf-8") as f:
        js_content = f.read()
    assert "socket.on('reconnect'" in js_content

    browser.close()

server.terminate()
server.wait()
print("Headless verification passed")
