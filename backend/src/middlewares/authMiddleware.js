const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dusakawi_jwt_secret_2024');
    const rawRol = (decoded.rol || (decoded.roles && decoded.roles[0]) || '').toLowerCase();
    
    // Normalizar rol para soportar convenciones legacy y nuevas
    let rolNormalizado = rawRol;
    if (rawRol.includes('admin')) {
      rolNormalizado = 'admin';
    } else if (rawRol.includes('talento')) {
      rolNormalizado = 'talento_humano';
    } else if (rawRol.includes('empleado')) {
      rolNormalizado = 'empleado';
    }

    req.user = {
      ...decoded,
      id: decoded.id || decoded.userId,
      empleado_id: decoded.id || decoded.userId,
      rol: rolNormalizado,
      rol_original: decoded.rol,
      roles: decoded.roles || []
    };
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};