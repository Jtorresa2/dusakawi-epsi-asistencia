export const ACCIONES = ["ver", "crear", "editar", "eliminar", "exportar"];

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
      { clave: "seguimiento", nombre: "Seguimiento de Asistencia" },
      { clave: "horarios", nombre: "Horarios" },
      { clave: "novedades", nombre: "Novedades Laborales" },
    ],
  },
  {
    id: "mantenimiento",
    titulo: "Mantenimiento",
    modulos: [
      { clave: "cargos", nombre: "Cargos" },
      { clave: "areas", nombre: "Áreas" },
      { clave: "festivos", nombre: "Festivos" },
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
    modulos: [
      { clave: "perfil", nombre: "Mi Perfil" },
    ],
  },
];
