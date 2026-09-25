const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

const token = fs.readFileSync(path.join(os.tmpdir(), 'opencode', 'inc_token.txt'), 'utf8').trim();
const OUT = path.join(os.tmpdir(), 'opencode', 'unit12_baseline');
fs.mkdirSync(OUT, { recursive: true });
const p = new Pool({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, options: '-c search_path=asistencia' });

const req = (method, urlPath, body) => new Promise((resolve) => {
  const data = body ? JSON.stringify(body) : null;
  const r = http.request({ hostname: 'localhost', port: 5000, path: urlPath, method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) } },
    (res) => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })); });
  r.on('error', (e) => resolve({ status: 0, headers: {}, body: Buffer.from(String(e)) }));
  if (data) r.write(data);
  r.end();
});

const normPdf = (buf) => {
  let s = buf.toString('latin1');
  s = s.replace(/\/CreationDate \(D:\d{14}[^)]*\)/g, '/CreationDate (NORM)');
  s = s.replace(/\/ModDate \(D:\d{14}[^)]*\)/g, '/ModDate (NORM)');
  return Buffer.from(s, 'latin1');
};
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
const pages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

(async () => {
  const results = {};

  // ---------- REPORTES (JSON) ----------
  const repGets = ['diario', 'mensual', 'indicadores', 'tendencia', 'asistencia', 'incidencias',
    'tardanzas', 'ausencias', 'por-empleado', 'por-areas', 'empleados', 'marcaciones', 'historial'];
  for (const ep of repGets) {
    const r = await req('GET', `/api/reportes/${ep}`);
    results[`rep_${ep}`] = r;
    fs.writeFileSync(path.join(OUT, `rep_${ep}.json`), JSON.stringify({ status: r.status, body: r.body.toString('utf8') }, null, 1));
  }
  // param variant
  const pv = await req('GET', '/api/reportes/asistencia?fecha_inicio=2026-09-01&fecha_fin=2026-09-25');
  results['rep_asistencia_params'] = pv;
  fs.writeFileSync(path.join(OUT, 'rep_asistencia_params.json'), JSON.stringify({ status: pv.status, body: pv.body.toString('utf8') }, null, 1));

  // POST /historial flow + compensation
  const before = await req('GET', '/api/reportes/historial');
  const beforeRows = JSON.parse(before.body.toString('utf8')).historial;
  const beforeIds = beforeRows.map(r => r.id);
  const post = await req('POST', '/api/reportes/historial', { tipo_reporte: 'General', formato: 'PDF', filtros: { origen: 'baseline' }, total_registros: 5 });
  results['rep_post_historial'] = post;
  fs.writeFileSync(path.join(OUT, 'rep_post_historial.json'), JSON.stringify({ status: post.status, body: post.body.toString('utf8') }, null, 1));
  const after = await req('GET', '/api/reportes/historial');
  const afterRows = JSON.parse(after.body.toString('utf8')).historial;
  const newRow = afterRows.find(r => !beforeIds.includes(r.id));
  results['rep_historial_tras_post'] = { status: after.status, body: after.body.toString('utf8') };
  fs.writeFileSync(path.join(OUT, 'rep_historial_tras_post.json'), JSON.stringify({ status: after.status, body: after.body.toString('utf8') }, null, 1));
  if (newRow) {
    await p.query('DELETE FROM asistencia.report_history WHERE id = $1', [newRow.id]);
    console.log('compensated report_history row', newRow.id);
  }
  const restore = await req('GET', '/api/reportes/historial');
  const restored = restore.body.toString('utf8') === before.body.toString('utf8') && restore.status === before.status;
  console.log('report_history RESTORED:', restored);

  // ---------- PDF ----------
  // determinism probe: same endpoint twice, compare normalized hashes
  const det1 = await req('GET', '/api/pdf/asistencia');
  const det2 = await req('GET', '/api/pdf/asistencia');
  const detHash1 = sha(normPdf(det1.body)), detHash2 = sha(normPdf(det2.body));
  console.log(`PDF determinism probe: ${detHash1} vs ${detHash2} -> ${detHash1 === detHash2 ? 'DETERMINISTIC' : 'NON-DETERMINISTIC (need structural compare)'}`);

  // real incidencia id?
  let incId = null;
  try {
    const q = await p.query('SELECT id FROM asistencia.incidents ORDER BY created_at LIMIT 1');
    if (q.rows.length) incId = q.rows[0].id;
  } catch {}
  console.log('incidencia id for plantilla:', incId);

  const pdfGets = [
    ['test', '/api/pdf/test', null],
    ['asistencia', '/api/pdf/asistencia', null],
    ['asistencia_preview', '/api/pdf/asistencia?preview=1', null],
    ['incidencias', '/api/pdf/incidencias', null],
    ['dashboard', '/api/pdf/dashboard', null],
    ['tardanzas', '/api/pdf/tardanzas', null],
    ['ausencias', '/api/pdf/ausencias', null],
    ['empleados', '/api/pdf/empleados', null],
    ['marcaciones', '/api/pdf/marcaciones', null],
    ['por-areas', '/api/pdf/por-areas', null],
    ['por-empleado', '/api/pdf/por-empleado', null],
    ['seguimiento', '/api/pdf/seguimiento', 'auth'],
    ['plantilla', incId ? `/api/pdf/incidencias/${incId}/plantilla` : '/api/pdf/incidencias/00000000-0000-0000-0000-000000000000/plantilla', null],
  ];
  const pdfMeta = {};
  for (const [name, urlPath, mode] of pdfGets) {
    const r = mode === 'auth' ? await new Promise((resolve) => {
      const rr = http.request({ hostname: 'localhost', port: 5000, path: urlPath, method: 'GET', headers: { Authorization: 'Bearer ' + token } },
        (res) => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })); });
      rr.on('error', (e) => resolve({ status: 0, headers: {}, body: Buffer.from(String(e)) }));
      rr.end();
    }) : await req('GET', urlPath);
    const isPdf = (r.headers['content-type'] || '').includes('pdf');
    fs.writeFileSync(path.join(OUT, `pdf_${name}${isPdf ? '.pdf' : '.bin'}`), r.body);
    pdfMeta[name] = {
      status: r.status,
      contentType: r.headers['content-type'] || null,
      disposition: r.headers['content-disposition'] || null,
      bytes: r.body.length,
      isPdf,
      normSha: isPdf ? sha(normPdf(r.body)) : null,
      pages: isPdf ? pages(r.body) : null,
    };
    console.log(`pdf_${name}: ${r.status} ${pdfMeta[name].contentType} ${r.body.length}B pages=${pdfMeta[name].pages} sha=${pdfMeta[name].normSha}`);
  }
  fs.writeFileSync(path.join(OUT, 'pdf_meta.json'), JSON.stringify(pdfMeta, null, 2));

  // statuses summary for reportes
  for (const [k, v] of Object.entries(results)) console.log(`${k}: ${v.status}`);
  console.log('Saved to', OUT);
  await p.end();
})().catch(e => { console.error(e); process.exit(1); });
