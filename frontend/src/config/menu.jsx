import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Clock3,
  BarChart3,
  FileText,
  Settings,
  Link2,
  ShieldCheck,
  User,
  CalendarClock,
  TriangleAlert,
  Briefcase
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
      section: "GESTIÓN",
      items: [
        {
          label: "Empleados",
          path: "/empleados",
          icon: <Users size={18} />
        },
        {
          label: "Cargos",
          path: "/cargos",
          icon: <Briefcase size={18} />
        },
        {
          label: "Horarios",
          path: "/horarios",
          icon: <Clock3 size={18} />
        }
      ]
    },

    {
      section: "OPERACIÓN",
      items: [
        {
          label: "Asistencia",
          path: "/asistencia",
          icon: <ClipboardCheck size={18} />
        },
        {
          label: "Indicadores",
          path: "/indicadores",
          icon: <BarChart3 size={18} />
        },
        {
          label: "Reportes",
          path: "/reportes",
          icon: <FileText size={18} />
        }
      ]
    },

    {
      section: "ADMINISTRACIÓN",
      items: [
        {
          label: "Integraciones",
          path: "/integraciones",
          icon: <Link2 size={18} />
        },
        {
          label: "Configuración",
          path: "/configuracion",
          icon: <Settings size={18} />
        },
        {
          label: "Auditoría",
          path: "/auditoria",
          icon: <ShieldCheck size={18} />
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
      section: "GESTIÓN",
      items: [
        {
          label: "Empleados",
          path: "/empleados",
          icon: <Users size={18} />
        },
        {
          label: "Incidencias",
          path: "/incidencias",
          icon: <TriangleAlert size={18} />
        }
      ]
    },

    {
      section: "OPERACIÓN",
      items: [
        {
          label: "Asistencia",
          path: "/asistencia",
          icon: <ClipboardCheck size={18} />
        },
        {
          label: "Indicadores",
          path: "/indicadores",
          icon: <BarChart3 size={18} />
        },
        {
          label: "Reportes",
          path: "/reportes",
          icon: <FileText size={18} />
        }
      ]
    }
  ],

  empleado: [
    {
      section: "MI ESPACIO",
      items: [
        {
          label: "Inicio",
          path: "/dashboard",
          icon: <LayoutDashboard size={18} />
        },
        {
          label: "Mi asistencia",
          path: "/mi-asistencia",
          icon: <ClipboardCheck size={18} />
        },
        {
          label: "Mi horario",
          path: "/mi-horario",
          icon: <CalendarClock size={18} />
        },
        {
          label: "Reportar incidencia",
          path: "/reportar-incidencia",
          icon: <TriangleAlert size={18} />
        },
        {
          label: "Mi perfil",
          path: "/perfil",
          icon: <User size={18} />
        }
      ]
    }
  ]
};