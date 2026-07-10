import { Box, Paper, Typography, Avatar, Chip, Grid, Divider } from "@mui/material";
import { User, Calendar, Briefcase, Clock3, MapPin, ShieldCheck } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";

const MOCK = {
  nombre: "Carlos Andrés Martínez",
  cedula: "1.234.567.890",
  correo: "carlos.martinez@dusakawi.com",
  telefono: "300 123 4567",
  area: "SIAU",
  cargo: "Analista de sistemas",
  piso: 2,
  rol: "Talento Humano",
  fecha_ingreso: "2022-03-15",
  estado: "Activo",
};

const infoRows = [
  { label: "Cédula", value: MOCK.cedula, icon: <User size={16} /> },
  { label: "Correo", value: MOCK.correo, icon: <User size={16} /> },
  { label: "Teléfono", value: MOCK.telefono, icon: <User size={16} /> },
  { label: "Fecha ingreso", value: new Date(MOCK.fecha_ingreso).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }), icon: <Calendar size={16} /> },
];

export default function MiPerfilPage() {
  const initials = MOCK.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <PageContainer>
      <PageHeader titulo="Mi perfil" subtitulo="Información personal del empleado" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        {/* Info personal */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "#E8F5E9", color: "#1B5E20", fontSize: 22, fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{MOCK.nombre}</Typography>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{MOCK.cargo}</Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <Chip label={MOCK.area} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: "#E8F5E9", color: "#1B5E20" }} />
                <Chip label={`Piso ${MOCK.piso}`} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: "#F3F4F6", color: "#6B7280" }} />
              </Box>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {infoRows.map((r, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                  {r.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>{r.label}</Typography>
                  <Typography sx={{ fontSize: 14, color: "#111827" }}>{r.value}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Info laboral */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 2 }}>Información laboral</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { label: "Rol en sistema", value: MOCK.rol, icon: <ShieldCheck size={16} />, chip: true },
              { label: "Estado", value: MOCK.estado, icon: <ShieldCheck size={16} />, chip: true },
              { label: "Cargo", value: MOCK.cargo, icon: <Briefcase size={16} /> },
              { label: "Área", value: `${MOCK.area} · Piso ${MOCK.piso}`, icon: <MapPin size={16} /> },
              { label: "Horario", value: "Lunes a Jueves 07:00-12:00, 14:00-18:00 | Viernes 07:00-12:00, 14:00-17:00", icon: <Clock3 size={16} /> },
            ].map((r, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                  {r.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>{r.label}</Typography>
                  {r.chip ? (
                    <Chip label={r.value} size="small" sx={{ borderRadius: "8px", fontSize: 12, fontWeight: 600, mt: 0.3, bgcolor: r.value === "Activo" ? "#D1FAE5" : "#F3F4F6", color: r.value === "Activo" ? "#065F46" : "#374151" }} />
                  ) : (
                    <Typography sx={{ fontSize: 14, color: "#111827" }}>{r.value}</Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </PageContainer>
  );
}