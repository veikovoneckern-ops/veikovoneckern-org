#!/usr/bin/env node
// Vorschau auf dem eigenen Rechner: baut die Seite und liefert _site/ so aus
// wie GitHub Pages (Adressen ohne .html, /ordner/ -> index.html, 404.html).
// Aufruf: node vorschau.js   -> http://localhost:4180
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const WURZEL = path.join(__dirname, '_site');
const PORT = Number(process.env.PORT) || 4180;
const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
function bauen() { execFileSync(process.execPath, [path.join(__dirname, 'bauen.js')], { stdio: 'inherit' }); }
bauen();
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (!path.extname(p) || p.endsWith('.html')) bauen(); // jede Seite frisch bauen
  const kand = [p, p + '.html', path.posix.join(p, 'index.html')];
  for (const k of kand) {
    const f = path.join(WURZEL, k);
    if (f.startsWith(WURZEL) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
      return fs.createReadStream(f).pipe(res);
    }
  }
  res.writeHead(404, { 'Content-Type': TYPEN['.html'] });
  fs.createReadStream(path.join(WURZEL, '404.html')).pipe(res);
}).listen(PORT, () => console.log('Vorschau: http://localhost:' + PORT));
