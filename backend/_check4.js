const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host:'127.0.0.1', port:3306, user:'root', password:'Admin1234', database:'dusakawi_asistencia' });
  const [tables] = await conn.query('SHOW TABLES');
  console.log('TABLAS:', tables.map(t => Object.values(t)[0]).join(', '));
  await conn.end();
})();
