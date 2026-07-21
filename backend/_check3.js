const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
(async () => {
  const conn = await mysql.createConnection({ host:'127.0.0.1', port:3306, user:'root', password:'Admin1234', database:'dusakawi_asistencia' });
  const [users] = await conn.query('SELECT username, password_hash FROM usuarios');
  const passwords = ['Admin123', 'admin123', 'Admin1234', 'password', 'admin', '123456', 'Dusakawi2026'];
  for (const u of users) {
    for (const pw of passwords) {
      const match = await bcrypt.compare(pw, u.password_hash);
      if (match) console.log(`${u.username} => password: "${pw}"`);
    }
  }
  await conn.end();
})();
