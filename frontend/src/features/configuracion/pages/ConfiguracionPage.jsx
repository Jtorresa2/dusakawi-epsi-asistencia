import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, Divider, Chip,
  Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { Building2, Save, Download, Clock, Shield, CheckCircle2 } from "lucide-react";
import { obtenerConfig, actualizarConfig, respaldarBD } from "../config.api";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [snack, setSnack] = useState(null);
  const [backupData, setBackupData] = useState(null);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await obtenerConfig();
      setConfig(data);
      setOriginal(data);
    } catch {
      setSnack({ type: "error", msg: "Error al cargar configuración" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (clave, valor) => {
    setConfig((prev) => ({ ...prev, [clave]: valor }));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarConfig(config);
      setOriginal({ ...config });
      setSnack({ type: "success", msg: "Configuración guardada" });
    } catch {
      setSnack({ type: "error", msg: "Error al guardar" });
    } finally {
      setGuardando(false);
    }
  };

  const handleBackup = async () => {
    try {
      const data = await respaldarBD();
      setBackupData(data);
      setSnack({ type: "success", msg: "Respaldo generado" });
    } catch {
      setSnack({ type: "error", msg: "Error al generar respaldo" });
    }
  };

  const hayCambios = JSON.stringify(config) !== JSON.stringify(original);

  const inputSx = { borderRadius: "10px", fontSize: 14, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } };
  const sectionTitle = (icon, text) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
      {icon}
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{text}</Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", pt: 6, color: "#9CA3AF", fontSize: 14 }}>
        Cargando configuración...
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#F5F7F8", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Administración / Configuración</Typography>
        <Button variant="contained" startIcon={<Save size={16} />} onClick={guardar}
          disabled={guardando || !hayCambios}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 42, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" }, "&.Mui-disabled": { bgcolor: "#E5E7EB" } }}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* EMPRESA */}
        <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 3 }}>
          {sectionTitle(<Building2 size={20} color="#1B5E20" />, "Datos de la empresa")}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
            <TextField label="Nombre de la empresa" value={config.empresa_nombre || ""}
              onChange={(e) => handleChange("empresa_nombre", e.target.value)}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: inputSx } }} />
            <TextField label="NIT" value={config.empresa_nit || ""}
              onChange={(e) => handleChange("empresa_nit", e.target.value)}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: inputSx } }} />
            <TextField label="Dirección" value={config.empresa_direccion || ""}
              onChange={(e) => handleChange("empresa_direccion", e.target.value)}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: inputSx } }} />
            <TextField label="Teléfono" value={config.empresa_telefono || ""}
              onChange={(e) => handleChange("empresa_telefono", e.target.value)}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: inputSx } }} />
            <TextField label="Correo electrónico" value={config.empresa_email || ""}
              onChange={(e) => handleChange("empresa_email", e.target.value)}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: inputSx } }}
              sx={{ gridColumn: "span 2" }} />
          </Box>
        </Paper>

        {/* GENERAL */}
        <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 3 }}>
          {sectionTitle(<Clock size={20} color="#D97706" />, "Configuración general")}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, maxWidth: 400 }}>
            <TextField label="Tolerancia por defecto (min)" type="number" value={config.tolerancia_default || ""}
              onChange={(e) => handleChange("tolerancia_default", e.target.value)}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: inputSx } }} />
          </Box>
        </Paper>

        {/* RESPALDO */}
        <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 3 }}>
          {sectionTitle(<Shield size={20} color="#7C3AED" />, "Respaldo de base de datos")}
          <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 2 }}>
            Genera un respaldo completo de todas las tablas del sistema en formato JSON.
          </Typography>
          <Button variant="outlined" startIcon={<Download size={16} />} onClick={handleBackup}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 42, px: 3, color: "#7C3AED", borderColor: "#DDD6FE", "&:hover": { borderColor: "#7C3AED", bgcolor: "#F5F3FF" } }}>
            Generar respaldo
          </Button>

          {backupData && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 1.5 }}>
                Tablas respaldadas ({Object.keys(backupData).length})
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "12px", border: "1px solid #ECECEC" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "#6B7280" }}>Tabla</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "#6B7280" }}>Registros</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "#6B7280" }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(backupData).map(([table, rows]) => (
                      <TableRow key={table}>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{table}</TableCell>
                        <TableCell>
                          <Chip label={rows.length} size="small"
                            sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: "#F3F4F6", color: "#6B7280" }} />
                        </TableCell>
                        <TableCell>
                          <Button size="small"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = `${table}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 600, color: "#1B5E20", minWidth: 0, px: 1.5 }}>
                            <Download size={14} style={{ marginRight: 4 }} /> Exportar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack ? <Alert severity={snack.type} sx={{ borderRadius: "10px" }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
