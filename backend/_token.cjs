const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const t = jwt.sign(
  { id: '837694a5-0dd2-460a-bd6d-5abfed123406', rol: 'Administrador', roles: ['Administrador'] },
  process.env.JWT_SECRET,
  { expiresIn: '2h' }
);
fs.writeFileSync(path.join(os.tmpdir(), 'opencode', 'inc_token.txt'), t);
console.log('token refreshed, len', t.length);
