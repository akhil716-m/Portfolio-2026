# Local preview server that resolves clean URLs like Cloudflare does: /work-hypersense-v3 -> work-hypersense-v3.html
import http.server, os, sys

root = sys.argv[1]
port = int(sys.argv[2])

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=root, **k)

    def end_headers(self):
        # always serve the latest files while previewing
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p) and os.path.exists(p + '.html'):
            return p + '.html'
        return p

http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
