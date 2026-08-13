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
  CalendarCheck,
  CalendarDays,
  CalendarClock,
  ShieldCheck,
  DatabaseBackup,
} from "lucide-react";

export const menuPorRol = {
  admin: [
    {
      section: "GENERAL",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: <LayoutDashboard size={18} />
        }
      ]
    },

    {
      section: "GESTIÓN DE PERSONAL",
      items: [
        {
          label: "Personal",
          path: "/personal",
          icon: <Users size={18} />
        },
        {
          label: "Asistencia",
          path: "/asistencia",
          icon: <ClipboardCheck size={18} />
        },
        {
          label: "Horarios",
          path: "/horarios",
          icon: <Clock3 size={18} />
        },
        {
          label: "Incidencias",
          path: "/incidencias",
          icon: <TriangleAlert size={18} />
        },
        {
          label: "Novedades Laborales",
          path: "/novedades",
          icon: <CalendarCheck size={18} />
        }
      ]
    },

    {
      section: "GESTIÓN DE MANTENIMIENTO",
      items: [
        {
          label: "Cargos",
          path: "/cargos",
          icon: <Briefcase size={18} />
        },
        {
          label: "Áreas",
          path: "/areas",
          icon: <Building2 size={18} />
        },
        {
          label: "Festivos",
          path: "/festivos",
          icon: <CalendarDays size={18} />
        }
      ]
    },

    {
      section: "GESTIÓN DE REPORTES",
      accordion: true,
      items: [
        {
          label: "Reportes",
          path: "/reportes",
          icon: <FileText size={18} />
        }
      ]
    },

    {
      section: "GESTIÓN DEL SISTEMA",
      items: [
        {
          label: "Roles",
          path: "/roles",
          icon: <ShieldCheck size={18} />
        },
        {
          label: "Configuración",
          path: "/configuracion",
          icon: <Settings size={18} />
        },
        {
          label: "Copias de Seguridad",
          path: "/copias-seguridad",
          icon: <DatabaseBackup size={18} />
        }
      ]
    },

    {
      section: "MI CUENTA",
      items: [
        {
          label: "Mi perfil",
          path: "/perfil",
          icon: <User size={18} />
        }
      ]
    }
  ],

  talento_humano: [
    {
      section: "GENERAL",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: <LayoutDashboard size={18} />
        }
      ]
    },

    {
      section: "GESTIÓN DE PERSONAL",
      items: [
        {
          label: "Personal",
          path: "/personal",
          icon: <Users size={18} />
        },
        {
          label: "Asistencia",
          path: "/asistencia",
          icon: <ClipboardCheck size={18} />
        },
        {
          label: "Horarios",
          path: "/horarios",
          icon: <CalendarClock size={18} />
        },
        {
          label: "Incidencias",
          path: "/incidencias",
          icon: <TriangleAlert size={18} />
        },
        {
          label: "Novedades Laborales",
          path: "/novedades",
          icon: <CalendarCheck size={18} />
        }
      ]
    },

    {
      section: "GESTIÓN DE MANTENIMIENTO",
      items: [
        {
          label: "Cargos",
          path: "/cargos",
          icon: <Briefcase size={18} />
        },
        {
          label: "Áreas",
          path: "/areas",
          icon: <Building2 size={18} />
        },
        {
          label: "Festivos",
          path: "/festivos",
          icon: <CalendarDays size={18} />
        }
      ]
    },

    {
      section: "GESTIÓN DE REPORTES",
      accordion: true,
      items: [
        {
          label: "Reportes",
          path: "/reportes",
          icon: <FileText size={18} />
        }
      ]
    },

    {
      section: "MI CUENTA",
      items: [
        {
          label: "Mi perfil",
          path: "/perfil",
          icon: <User size={18} />
        }
      ]
    }
  ],

  empleado: [
    {
      section: "GENERAL",
      items: [
        {
          label: "Inicio",
          path: "/dashboard",
          icon: <LayoutDashboard size={18} />
        },
      ]
    },
    {
      section: "OPERACIÓN",
      items: [
        {
          label: "Mi asistencia",
          path: "/mi-asistencia",
          icon: <ClipboardCheck size={18} />
        },
        {
          label: "Reportar incidencia",
          path: "/reportar-incidencia",
          icon: <TriangleAlert size={18} />
        },
        {
          label: "Mis solicitudes",
          path: "/mis-solicitudes",
          icon: <FileText size={18} />
        },
      ]
    },
    {
      section: "MI CUENTA",
      items: [
        {
          label: "Mi perfil",
          path: "/perfil",
          icon: <User size={18} />
        },
      ]
    }
  ]
}
