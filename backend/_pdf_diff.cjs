const http = require('http');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const os = require('os');

const fetch1 = () => new Promise((resolve) => {
  http.get({ hostname: 'localhost', port: 5000, path: '/api/pdf/asistencia' }, (res) => {
    const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks)));
  });
});

function extractText(buf) {
  const s = buf.toString('latin1');
  const out = [];
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(s))) {
    const start = m.index + m[0].length;
    const end = s.indexOf('endstream', start);
    if (end < 0) break;
    const raw = buf.subarray(start, end);
    try {
      const inf = zlib.inflateSync(raw).toString('latin1');
      const tj = inf.match(/\((?:[^()\\]|\\.)*\)/g) || [];
      tj.forEach(t => out.push(t));
    } catch {}
    re.lastIndex = end;
  }
  return out;
}

(async () => {
  const a = await fetch1();
  await new Promise(r => setTimeout(r, 2500));
  const b = await fetch1();
  const dir = path.join(os.tmpdir(), 'opencode');
  fs.writeFileSync(path.join(dir, 'probe_a.pdf'), a);
  fs.writeFileSync(path.join(dir, 'probe_b.pdf'), b);
  const ta = extractText(a), tb = extractText(b);
  console.log('text ops:', ta.length, tb.length);
  let diffs = 0;
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
    if (ta[i] !== tb[i]) {
      diffs++;
      if (diffs <= 12) console.log(`[${i}] A=${ta[i]} | B=${tb[i]}`);
    }
  }
  console.log('total differing text ops:', diffs, '/', ta.length);
  console.log('bytes:', a.length, b.length);
})();
