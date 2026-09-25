const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

const dir = path.join(os.tmpdir(), 'opencode');
const a = fs.readFileSync(path.join(dir, 'probe_a.pdf'));
const b = fs.readFileSync(path.join(dir, 'probe_b.pdf'));

console.log('sizes:', a.length, b.length);
const s = a.toString('latin1');
console.log('filters:', [...new Set(s.match(/\/Filter\s*\[[^\]]*\]|\/Filter\s*\/\w+/g) || [])]);
console.log('has ObjStm:', s.includes('/ObjStm'), '| xref stream:', s.includes('/XRef'));

// byte-level diff positions
const diffs = [];
for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) diffs.push(i);
console.log('diff bytes:', diffs.length, 'first:', diffs.slice(0, 10));
if (diffs.length) {
  const i0 = diffs[0];
  console.log('A ctx:', JSON.stringify(a.subarray(Math.max(0, i0 - 60), i0 + 60).toString('latin1')));
  console.log('B ctx:', JSON.stringify(b.subarray(Math.max(0, i0 - 60), i0 + 60).toString('latin1')));
}

// find all stream boundaries + try inflate each on A
let idx = 0, n = 0, ok = 0;
const re = /stream\r?\n/g;
let m;
while ((m = re.exec(s))) {
  n++;
  const start = m.index + m[0].length;
  const end = s.indexOf('endstream', start);
  if (end < 0) break;
  const raw = a.subarray(start, end);
  try { zlib.inflateSync(raw); ok++; } catch {}
  re.lastIndex = end;
}
console.log('streams:', n, 'inflateable:', ok);
