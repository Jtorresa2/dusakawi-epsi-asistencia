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

// `modulo` maps each item to a catalogue module in the backend `actions`
// table (module.action). The Sidebar only shows items whose `<modulo>.ver`
// permission the user actually has.
const SECCIONES = {
  GENERAL: {
    section: "GENERAL",
    accordion: true,
    items: [
      { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} />, modulo: "dashboard" }
    ]
  },
  PERSONAL: {
    section: "GESTIÓN DE PERSONAL",
    items: [
      { label: "Personal", path: "/personal", icon: <Users size={18} />, modulo: "personal" },
      { label: "Asistencia", path: "/asistencia", icon: <ClipboardCheck size={18} />, modulo: "asistencia" },
      { label: "Seguimiento de Asistencia", path: "/seguimiento", icon: <ClipboardList size={18} />, modulo: "seguimiento" },
      { label: "Horarios", path: "/horarios", icon: <Clock3 size={18} />, modulo: "horarios" },
      { label: "Incidencias", path: "/incidencias", icon: <TriangleAlert size={18} />, modulo: "incidencias" },
      { label: "Novedades Laborales", path: "/novedades", icon: <CalendarDays size={18} />, modulo: "novedades" }
    ]
  },
  MANTENIMIENTO: {
    section: "GESTIÓN DE MANTENIMIENTO",
    items: [
      { label: "Cargos", path: "/cargos", icon: <Briefcase size={18} />, modulo: "cargos" },
      { label: "Áreas", path: "/areas", icon: <Building2 size={18} />, modulo: "areas" },
      { label: "Festivos", path: "/festivos", icon: <CalendarDays size={18} />, modulo: "festivos" }
    ]
  },
  REPORTES: {
    section: "GESTIÓN DE REPORTES",
    accordion: true,
    items: [
      { label: "Reportes", path: "/reportes", icon: <FileText size={18} />, modulo: "reportes" }
    ]
  },
  SISTEMA: {
    section: "GESTIÓN DEL SISTEMA",
    items: [
      { label: "Roles", path: "/roles", icon: <ShieldCheck size={18} />, modulo: "roles" },
      { label: "Configuración", path: "/configuracion", icon: <Settings size={18} />, modulo: "configuracion" },
      { label: "Copias de Seguridad", path: "/copias-seguridad", icon: <DatabaseBackup size={18} />, modulo: "copias_seguridad" }
    ]
  },
  MI_CUENTA: {
    section: "MI CUENTA",
    accordion: true,
    items: [
      { label: "Mi perfil", path: "/perfil", icon: <User size={18} />, modulo: "perfil" }
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
    SECCIONES.MI_CUENTA,
  ],
  talento_humano: [
    SECCIONES.GENERAL,
    SECCIONES.PERSONAL,
    SECCIONES.MANTENIMIENTO,
    SECCIONES.REPORTES,
    SECCIONES.MI_CUENTA,
  ],
};
