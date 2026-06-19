/**
 * server.js — Proxy Server Sederhana
 * Tujuan: menghindari CORS saat browser memanggil NVIDIA/OpenAI API
 * Jalankan: node server.js
 * Buka:     http://localhost:8000
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// ── MIME types ────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  // ── CORS headers untuk semua response ────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Proxy ke NVIDIA / OpenAI-compatible API ───────────────────
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch (e) {
        res.writeHead(400); res.end('Bad JSON'); return;
      }

      const { targetUrl, headers: fwdHeaders, payload } = parsed;
      const target = new url.URL(targetUrl);

      const options = {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fwdHeaders,
        },
      };

      const upstream = https.request(options, (upRes) => {
        res.writeHead(upRes.statusCode, {
          'Content-Type': upRes.headers['content-type'] || 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        upRes.pipe(res);
      });

      upstream.on('error', (err) => {
        console.error('[Proxy Error]', err.message);
        res.writeHead(502);
        res.end(JSON.stringify({ error: err.message }));
      });

      upstream.write(JSON.stringify(payload));
      upstream.end();
    });
    return;
  }

  // ── Static file serving ───────────────────────────────────────
  // Strip query string (e.g. ?v=2) sebelum resolve ke filesystem
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './') filePath = './index.html';

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✦ Aether server running at http://localhost:${PORT}`);
  console.log(`✦ Proxy aktif — NVIDIA/OpenAI API calls akan diteruskan lewat server ini`);
});
