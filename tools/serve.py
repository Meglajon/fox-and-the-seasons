"""Local dev server for the game with caching turned off, so edits show up on reload.

Usage:  python tools/serve.py [port] [--shots DIR]

With --shots, the page may POST a PNG data URL to /__shot?name=foo and it is saved as DIR/foo.png
(handy for grabbing screenshots or trailer frames while testing).
"""
import base64
import http.server
import os
import re
import sys
from urllib.parse import urlparse, parse_qs

SHOTS = None


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_POST(self):
        url = urlparse(self.path)
        if SHOTS is not None and url.path == "/__save":
            # Raw file upload (e.g. a recorded trailer): /__save?name=trailer.mp4
            raw = parse_qs(url.query).get("name", ["upload.bin"])[0]
            name = re.sub(r"[^a-zA-Z0-9_.-]", "", raw).lstrip(".") or "upload.bin"
            if not re.search(r"\.(mp4|webm|png|jpg|wav)$", name):
                self.send_error(400, "unsupported file type")
                return
            data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            os.makedirs(SHOTS, exist_ok=True)
            with open(os.path.join(SHOTS, name), "wb") as f:
                f.write(data)
            self.send_response(204)
            self.end_headers()
            return
        if SHOTS is None or url.path != "/__shot":
            self.send_error(404)
            return
        name = re.sub(r"[^a-zA-Z0-9_-]", "", parse_qs(url.query).get("name", ["shot"])[0]) or "shot"
        body = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("ascii", "ignore")
        data = base64.b64decode(body.split(",", 1)[-1])
        os.makedirs(SHOTS, exist_ok=True)
        with open(os.path.join(SHOTS, name + ".png"), "wb") as f:
            f.write(data)
        self.send_response(204)
        self.end_headers()


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--shots" in args:
        i = args.index("--shots")
        SHOTS = os.path.abspath(args[i + 1])
        del args[i:i + 2]
    port = int(args[0]) if args else 8080
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler) as httpd:
        print(f"Fox & the Seasons running at http://localhost:{port}")
        httpd.serve_forever()
