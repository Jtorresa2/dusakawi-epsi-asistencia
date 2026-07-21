const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host:'127.0.0.1', port:3306, user:'root', password:'Admin1234', database:'dusakawi_asistencia' });
  const [users] = await conn.query('SELECT u.id, u.username, u.activo, r.nombre AS rol FROM usuarios u JOIN roles r ON u.rol_id=r.id');
  console.log('USUARIOS:', JSON.stringify(users, null, 2));
  const [roles] = await conn.query('SELECT * FROM roles');
  console.log('ROLES:', JSON.stringify(roles, null, 2));
  await conn.end();
})();
