module.exports = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }

    const norm = (str) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_-]+/g, '');
    const userRole = norm(req.user.rol);
    const userRoles = (Array.isArray(req.user.roles) ? req.user.roles : []).map(norm);
    if (userRole) userRoles.push(userRole);

    const allowed = rolesPermitidos.map(norm);

    const match = allowed.some((target) => {
      if (target.includes('admin')) {
        return userRoles.some((r) => r.includes('admin'));
      }
      if (target.includes('talento')) {
        return userRoles.some((r) => r.includes('talento'));
      }
      if (target.includes('empleado')) {
        return userRoles.some((r) => r.includes('empleado'));
      }
      return userRoles.includes(target);
    });

    if (!match) {
      return res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
    }
    next();
  };
};