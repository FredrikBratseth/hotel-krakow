// Hotel Kraków – liten relé-server. Én telefon/PC er vert og styrer spillet;
// serveren videresender bare "presence" (posisjon + vertens spilltilstand) mellom alle i samme rom.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };

const srv = http.createServer((req, res) => {
  const u = (req.url || '/').split('?')[0];
  if (u === '/health') { res.end('ok'); return; }
  const file = u === '/' ? 'index.html' : u.replace(/^\/+/, '');
  if (!/^[a-z0-9._-]+$/i.test(file)) { res.writeHead(404); res.end(); return; }
  fs.readFile(path.join(PUB, file), (err, buf) => {
    if (err) { res.writeHead(404); res.end('Ikke funnet'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(buf);
  });
});

// Compression: game state is JSON and very repetitive, so this cuts data traffic ~50x (Render's free plan only includes 5 GB/month)
const wss = new WebSocketServer({ server: srv, path: '/ws', maxPayload: 512 * 1024,
  perMessageDeflate: { threshold: 128, zlibDeflateOptions: { level: 4 }, clientNoContextTakeover: true } });
const rooms = new Map(); // navn -> { peers: Map(id -> {ws, pres, dirty}), gone: [] }
let seq = 0;
const newId = () => Math.random().toString(36).slice(2, 9) + (++seq).toString(36);

wss.on('connection', ws => {
  let r = null, id = null, rn = null;
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', buf => {
    let m; try { m = JSON.parse(buf); } catch { return; }
    if (m.t === 'join' && !r && typeof m.room === 'string' && m.room.length < 40) {
      rn = m.room; r = rooms.get(rn);
      if (!r) { r = { peers: new Map(), gone: [] }; rooms.set(rn, r); }
      if (r.peers.size >= 60) { ws.send(JSON.stringify({ t: 'full' })); ws.close(); r = null; return; }
      id = (typeof m.id === 'string' && /^[a-z0-9]{4,20}$/.test(m.id) && !r.peers.has(m.id)) ? m.id : newId();
      r.peers.set(id, { ws, pres: null, dirty: false });
      ws.send(JSON.stringify({ t: 'hi', id, peers: [...r.peers].filter(([, v]) => v.pres).map(([k, v]) => [k, v.pres]) }));
    } else if (m.t === 'p' && r) {
      const pe = r.peers.get(id);
      if (pe && pe.ws === ws && m.d && typeof m.d === 'object') { pe.pres = m.d; pe.dirty = true; }
    }
  });
  ws.on('close', () => {
    if (!r || !id) return;
    const pe = r.peers.get(id);
    if (pe && pe.ws === ws) { r.peers.delete(id); r.gone.push(id); }
    if (!r.peers.size) rooms.delete(rn);
  });
});

// ~10 ganger i sekundet: send endringer til alle i rommet
setInterval(() => {
  for (const r of rooms.values()) {
    const u = [];
    for (const [k, v] of r.peers) if (v.dirty) { v.dirty = false; u.push([k, v.pres]); }
    if (!u.length && !r.gone.length) continue;
    const msg = JSON.stringify({ t: 'd', u, g: r.gone }); r.gone = [];
    for (const v of r.peers.values()) if (v.ws.readyState === 1 && v.ws.bufferedAmount < 2e6) v.ws.send(msg);
  }
}, 100);

// fjern døde tilkoblinger
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 15000);

srv.listen(PORT, () => console.log('Hotel Kraków kjører på port ' + PORT));
