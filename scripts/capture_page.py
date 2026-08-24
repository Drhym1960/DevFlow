#!/usr/bin/env python3
"""Capture a live webpage at an iPhone viewport via Chrome DevTools."""

from __future__ import annotations

import argparse
import base64
import json
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websocket

CHROME = "google-chrome"


class Cdp:
    def __init__(self, url: str, timeout: int = 90) -> None:
        self.ws = websocket.create_connection(url, timeout=timeout)
        self._id = 0

    def call(self, method: str, params: dict | None = None) -> dict:
        self._id += 1
        msg_id = self._id
        payload: dict = {"id": msg_id, "method": method}
        if params:
            payload["params"] = params
        self.ws.send(json.dumps(payload))
        while True:
            data = json.loads(self.ws.recv())
            if data.get("id") != msg_id:
                continue
            if "error" in data:
                raise RuntimeError(f"{method}: {data['error']}")
            return data.get("result") or {}

    def close(self) -> None:
        self.ws.close()


def chrome_ready(port: int) -> bool:
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=1).read()
        return True
    except Exception:
        return False


def start_chrome(port: int) -> subprocess.Popen | None:
    if chrome_ready(port):
        return None
    profile = tempfile.mkdtemp(prefix="chrome-cdp-")
    proc = subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            f"--remote-debugging-port={port}",
            "--remote-allow-origins=*",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--hide-scrollbars",
            "--mute-audio",
            f"--user-data-dir={profile}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(80):
        if chrome_ready(port):
            return proc
        if proc.poll() is not None:
            raise RuntimeError("Chrome exited before the debugger came up.")
        time.sleep(0.25)
    raise RuntimeError("Chrome debugger did not start.")


def page_ws_url(port: int) -> str:
    pages = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=5).read())
    page = next((p for p in pages if p.get("type") == "page" and p.get("webSocketDebuggerUrl")), None)
    if page:
        return page["webSocketDebuggerUrl"]
    info = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=5).read())
    url = info.get("webSocketDebuggerUrl")
    if not url:
        raise RuntimeError("Chrome did not expose a debugger websocket.")
    return url


def capture(args: argparse.Namespace) -> None:
    proc = start_chrome(args.port)
    cdp = None
    try:
        cdp = Cdp(page_ws_url(args.port))
        cdp.call("Page.enable")
        cdp.call("Runtime.enable")
        cdp.call(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": args.width,
                "height": args.height,
                "deviceScaleFactor": args.scale,
                "mobile": True,
                "screenWidth": args.width,
                "screenHeight": args.height,
            },
        )
        cdp.call(
            "Emulation.setUserAgentOverride",
            {
                "userAgent": (
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
                ),
                "platform": "iPhone",
            },
        )
        cdp.call("Page.navigate", {"url": args.url})
        deadline = time.time() + args.wait
        found = not bool(args.wait_for)
        needle = (args.wait_for or "").strip()
        while time.time() < deadline:
            time.sleep(0.7)
            if not needle:
                if time.time() > deadline - (args.wait - 5):
                    break
                continue
            result = cdp.call(
                "Runtime.evaluate",
                {
                    "expression": (
                        "!!(document.body && document.body.innerText && "
                        f"document.body.innerText.includes({json.dumps(needle)}))"
                    ),
                    "returnByValue": True,
                },
            )
            if result.get("result", {}).get("value") is True:
                found = True
                time.sleep(1.4)
                break
        cdp.call(
            "Runtime.evaluate",
            {
                "expression": """
(() => {
  const hide = (el) => { if (el) el.style.setProperty('display','none','important'); };
  document.querySelectorAll(
    '[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i]'
  ).forEach(hide);
})()
"""
            },
        )
        shot = cdp.call("Page.captureScreenshot", {"format": "png", "fromSurface": True})
        data = shot.get("data")
        if not data:
            raise RuntimeError("Chrome returned an empty screenshot.")
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(base64.b64decode(data))
        if needle and not found:
            raise SystemExit(f"Captured {out} but never saw {needle!r} on the page.")
    finally:
        if cdp is not None:
            cdp.close()
        if proc is not None and not args.keep:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--url", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--width", type=int, default=393)
    p.add_argument("--height", type=int, default=852)
    p.add_argument("--scale", type=float, default=3)
    p.add_argument("--wait", type=int, default=18)
    p.add_argument("--wait-for", default="")
    p.add_argument("--port", type=int, default=9333)
    p.add_argument("--keep", action="store_true")
    args = p.parse_args()
    capture(args)


if __name__ == "__main__":
    main()
