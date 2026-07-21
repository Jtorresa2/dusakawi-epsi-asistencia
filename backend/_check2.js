const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
(async () => {
  const conn = await mysql.createConnection({ host:'127.0.0.1', port:3306, user:'root', password:'Admin1234', database:'dusakawi_asistencia' });
  const [users] = await conn.query('SELECT username, password_hash FROM usuarios');
  for (const u of users) {
    const match = await bcrypt.compare('123456', u.password_hash);
    console.log(`${u.username}: hash=${u.password_hash.substring(0,20)}... match_123456=${match}`);
  }
  await conn.end();
})();
