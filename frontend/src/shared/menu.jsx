import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Clock3,
  FileText,
  Settings,
  TriangleAlert,
  Briefcase,
  Building2,
  User,
  CalendarDays,
  ShieldCheck,
  DatabaseBackup,
  ClipboardList,
} from "lucide-react";

const SECCIONES = {
  GENERAL: {
    section: "GENERAL",
    accordion: true,
    items: [
      { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> }
    ]
  },
  PERSONAL: {
    section: "GESTIÓN DE PERSONAL",
    items: [
      { label: "Personal", path: "/personal", icon: <Users size={18} /> },
      { label: "Asistencia", path: "/asistencia", icon: <ClipboardCheck size={18} /> },
      { label: "Seguimiento de Asistencia", path: "/seguimiento", icon: <ClipboardList size={18} /> },
      { label: "Horarios", path: "/horarios", icon: <Clock3 size={18} /> },
      { label: "Incidencias", path: "/incidencias", icon: <TriangleAlert size={18} /> },
      { label: "Novedades Laborales", path: "/novedades", icon: <CalendarDays size={18} /> }
    ]
  },
  MANTENIMIENTO: {
    section: "GESTIÓN DE MANTENIMIENTO",
    items: [
      { label: "Cargos", path: "/cargos", icon: <Briefcase size={18} /> },
      { label: "Áreas", path: "/areas", icon: <Building2 size={18} /> },
      { label: "Festivos", path: "/festivos", icon: <CalendarDays size={18} /> }
    ]
  },
  REPORTES: {
    section: "GESTIÓN DE REPORTES",
    accordion: true,
    items: [
      { label: "Reportes", path: "/reportes", icon: <FileText size={18} /> }
    ]
  },
  SISTEMA: {
    section: "GESTIÓN DEL SISTEMA",
    items: [
      { label: "Roles", path: "/roles", icon: <ShieldCheck size={18} /> },
      { label: "Configuración", path: "/configuracion", icon: <Settings size={18} /> },
      { label: "Copias de Seguridad", path: "/copias-seguridad", icon: <DatabaseBackup size={18} /> }
    ]
  },
  MI_CUENTA: {
    section: "MI CUENTA",
    accordion: true,
    items: [
      { label: "Mi perfil", path: "/perfil", icon: <User size={18} /> }
    ]
  }
};

export const menuPorRol = {
  admin: [
    SECCIONES.GENERAL,
    SECCIONES.PERSONAL,
    SECCIONES.MANTENIMIENTO,
    SECCIONES.REPORTES,
    SECCIONES.SISTEMA,
    SECCIONES.MI_CUENTA
  ],
  talento_humano: [
    SECCIONES.GENERAL,
    SECCIONES.PERSONAL,
    SECCIONES.MANTENIMIENTO,
    SECCIONES.REPORTES,
    SECCIONES.MI_CUENTA
  ],
  empleado: [
    {
      section: "GENERAL",
      items: [
        { label: "Inicio", path: "/dashboard", icon: <LayoutDashboard size={18} /> }
      ]
    },
    {
      section: "OPERACIÓN",
      items: [
        { label: "Mi asistencia", path: "/mi-asistencia", icon: <ClipboardCheck size={18} /> },
        { label: "Reportar incidencia", path: "/reportar-incidencia", icon: <TriangleAlert size={18} /> },
        { label: "Mis solicitudes", path: "/mis-solicitudes", icon: <FileText size={18} /> }
      ]
    },
    SECCIONES.MI_CUENTA
  ]
};