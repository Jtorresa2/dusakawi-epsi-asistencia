const R = {
  ADMIN: "admin",
  TH: "talento_humano",
};

const NOVEDADES = {
  empleados: {
    ver: [R.ADMIN, R.TH],
    crear: [R.ADMIN, R.TH],
    editar: [R.ADMIN, R.TH],
    eliminar: [R.ADMIN],
  },
  cargos: {
    ver: [R.ADMIN, R.TH],
    crear: [R.ADMIN, R.TH],
    editar: [R.ADMIN, R.TH],
    eliminar: [R.ADMIN],
  },
  horarios: {
    ver: [R.ADMIN],
    crear: [R.ADMIN],
    editar: [R.ADMIN],
    eliminar: [R.ADMIN],
  },
  incidencias: {
    ver: [R.ADMIN, R.TH],
    crear: [R.ADMIN, R.TH],
    editar: [R.ADMIN, R.TH],
    eliminar: [R.ADMIN],
    aprobar: [R.ADMIN, R.TH],
  },
  asistencia: {
    ver: [R.ADMIN, R.TH],
    registrar: [R.ADMIN, R.TH],
  },
  indicadores: {
    ver: [R.ADMIN, R.TH],
  },
  reportes: {
    ver: [R.ADMIN, R.TH],
  },
  usuarios: {
    ver: [R.ADMIN],
    crear: [R.ADMIN],
    editar: [R.ADMIN],
    eliminar: [R.ADMIN],
  },
  configuracion: {
    ver: [R.ADMIN],
  },
  dashboard: {
    ver: [R.ADMIN, R.TH],
  },
  areas: {
    ver: [R.ADMIN, R.TH],
    crear: [R.ADMIN],
    editar: [R.ADMIN],
    eliminar: [R.ADMIN],
  },
  perfil: {
    ver: [R.ADMIN, R.TH],
  },
};

export function puede(rol, modulo, accion = "ver") {
  const permiso = NOVEDADES[modulo]?.[accion];
  if (!permiso) return false;
  return permiso.includes(rol);
}

export default NOVEDADES;
