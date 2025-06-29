# app/api/hello.py
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response_data = {'message': 'Hello from Vercel Python API!'}
        self.wfile.write(json.dumps(response_data).encode('utf-8'))