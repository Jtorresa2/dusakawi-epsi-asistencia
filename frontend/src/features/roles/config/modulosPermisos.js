export const ACCIONES = ["ver", "crear", "editar", "eliminar", "aprobar", "exportar"];

export const MODULOS_PERMISOS = [
  {
    id: "general",
    titulo: "General",
    modulos: [{ clave: "dashboard", nombre: "Dashboard" }],
  },
  {
    id: "personal",
    titulo: "Personal",
    modulos: [
      { clave: "personal", nombre: "Personal" },
      { clave: "asistencia", nombre: "Asistencia" },
      { clave: "horarios", nombre: "Horarios" },
      { clave: "incidencias", nombre: "Incidencias" },
      { clave: "novedades", nombre: "Novedades Laborales" },
    ],
  },
  {
    id: "mantenimiento",
    titulo: "Mantenimiento",
    modulos: [
      { clave: "cargos", nombre: "Cargos" },
      { clave: "areas", nombre: "Áreas" },
      { clave: "turnos", nombre: "Turnos" },
      { clave: "festivos", nombre: "Festivos" },
      { clave: "tipos_incidencia", nombre: "Tipos de Incidencia" },
      { clave: "dispositivos", nombre: "Dispositivos Biométricos" },
    ],
  },
  {
    id: "reportes",
    titulo: "Reportes",
    modulos: [{ clave: "reportes", nombre: "Reportes" }],
  },
  {
    id: "sistema",
    titulo: "Sistema",
    modulos: [
      { clave: "roles", nombre: "Roles" },
      { clave: "configuracion", nombre: "Configuración" },
      { clave: "copias_seguridad", nombre: "Copias de Seguridad" },
    ],
  },
  {
    id: "mi_cuenta",
    titulo: "Mi Cuenta",
    modulos: [{ clave: "perfil", nombre: "Mi Perfil" }],
  },
];

export function obtenerPermisosIniciales() {
  return MODULOS_PERMISOS.flatMap((seccion) =>
    seccion.modulos.flatMap((m) => ACCIONES.map((a) => `${m.clave}.${a}`))
  );
}
