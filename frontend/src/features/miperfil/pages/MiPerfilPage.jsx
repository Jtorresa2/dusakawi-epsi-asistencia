import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Lock,
  Clock,
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { obtenerPersonalPorId, actualizarPersonal } from "../../personal/personal.api";
import { apiFetch } from "../../../shared/api/api";
import PageBreadcrumbs from "../../../shared/components/PageBreadcrumbs";
import { COLORES } from "../../../shared/constants/colores.js";

function formatUltimoAcceso(iso) {
  if (!iso) return "Sesión iniciada hoy";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Sesión iniciada hoy";
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Sesión iniciada hoy";
  }
}

export default function MiPerfilPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem("usuario") || "{}"));
  const userId = usuario.id || usuario.empleado_id;

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Edición de contacto (correo y teléfono)
  const [editandoContacto, setEditandoContacto] = useState(false);
  const [contactoForm, setContactoForm] = useState({ correo: "", telefono: "" });
  const [guardandoContacto, setGuardandoContacto] = useState(false);

  // Modal para cambio de contraseña
  const [modalPassOpen, setModalPassOpen] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNuevo, setPassNuevo] = useState("");
  const [passConfirmar, setPassConfirmar] = useState("");
  const [showPassActual, setShowPassActual] = useState(false);
  const [showPassNuevo, setShowPassNuevo] = useState(false);
  const [showPassConfirmar, setShowPassConfirmar] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);

  // Foto de perfil
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Notificaciones / Feedback
  const [snack, setSnack] = useState({ open: false, severity: "success", mensaje: "" });

  const cargarDatos = async () => {
    try {
      if (userId) {
        const data = await obtenerPersonalPorId(userId);
        setPerfil(data);
        setContactoForm({
          correo: data?.correo || data?.email || usuario.email || "",
          telefono: data?.telefono || data?.phone || "",
        });
      }
    } catch {
      setContactoForm({
        correo: usuario.email || "",
        telefono: "",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const datos = perfil || usuario;
  const rolRaw = usuario.rol || (perfil?.rol === "Administrador" ? "admin" : "talento_humano");
  const rolLabel = rolRaw === "admin" ? "Administrador del Sistema" : "Talento Humano";

  const nombreMostrar = datos?.empleado || datos?.nombre || usuario.nombre || "Administrador";
  const usernameMostrar = usuario.username || (rolRaw === "admin" ? "admin" : "talento");
  const cargoMostrar = datos?.cargo && datos.cargo !== "—" ? datos.cargo : (rolRaw === "admin" ? "Técnico de Sistemas" : "Coordinador de Talento Humano");
  const areaMostrar = datos?.area && datos.area !== "—" ? datos.area : (rolRaw === "admin" ? "Sistemas" : "Talento Humano");
  const pisoMostrar = datos?.piso && datos.piso !== "—" ? datos.piso : (rolRaw === "admin" ? "Piso 3" : "Piso 4");

  const iniciales = nombreMostrar
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";

  const fotoSrc = usuario.foto_url || perfil?.foto_url || "";

  // Manejo de actualización de foto (Base64)
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSnack({ open: true, severity: "error", mensaje: "Por favor selecciona un archivo de imagen válido" });
      return;
    }

    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64 = evt.target.result;
        await actualizarPersonal(userId, { foto_url: base64 });
        const nuevoUsuario = { ...usuario, foto_url: base64 };
        localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
        setUsuario(nuevoUsuario);
        setPerfil((prev) => ({ ...prev, foto_url: base64 }));
        setSnack({ open: true, severity: "success", mensaje: "Foto de perfil actualizada correctamente" });
      } catch (err) {
        setSnack({ open: true, severity: "error", mensaje: err.message || "Error al actualizar la foto" });
      } finally {
        setSubiendoFoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Guardar datos de contacto
  const handleGuardarContacto = async () => {
    setGuardandoContacto(true);
    try {
      await actualizarPersonal(userId, {
        correo: contactoForm.correo,
        telefono: contactoForm.telefono,
      });
      const nuevoUsuario = { ...usuario, email: contactoForm.correo };
      localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
      setUsuario(nuevoUsuario);
      setPerfil((prev) => ({
        ...prev,
        correo: contactoForm.correo,
        email: contactoForm.correo,
        telefono: contactoForm.telefono,
        phone: contactoForm.telefono,
      }));
      setEditandoContacto(false);
      setSnack({ open: true, severity: "success", mensaje: "Datos de contacto actualizados correctamente" });
    } catch (err) {
      setSnack({ open: true, severity: "error", mensaje: err.message || "Error al guardar cambios" });
    } finally {
      setGuardandoContacto(false);
    }
  };

  // Cambiar contraseña en modal
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (!passActual || !passNuevo || !passConfirmar) {
      setSnack({ open: true, severity: "warning", mensaje: "Completa todos los campos" });
      return;
    }
    if (passNuevo.length < 8) {
      setSnack({ open: true, severity: "warning", mensaje: "La nueva contraseña debe tener al menos 8 caracteres" });
      return;
    }
    if (passNuevo !== passConfirmar) {
      setSnack({ open: true, severity: "error", mensaje: "La nueva contraseña y la confirmación no coinciden" });
      return;
    }

    setCambiandoPass(true);
    try {
      const res = await apiFetch("/auth/cambiar-password", {
        method: "POST",
        body: JSON.stringify({
          password_actual: passActual,
          password_nuevo: passNuevo,
        }),
      });
      if (res.token) {
        localStorage.setItem("token", res.token);
      }
      setPassActual("");
      setPassNuevo("");
      setPassConfirmar("");
      setModalPassOpen(false);
      setSnack({ open: true, severity: "success", mensaje: res.mensaje || "Contraseña actualizada exitosamente" });
    } catch (err) {
      setSnack({ open: true, severity: "error", mensaje: err.message || "Error al cambiar contraseña" });
    } finally {
      setCambiandoPass(false);
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 780,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <PageBreadcrumbs
          items={["Mi cuenta", "Perfil institucional"]}
          sx={{ mb: 1, justifyContent: "center" }}
        />
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: COLORES.textoPrimario }}>
          Perfil de Usuario
        </Typography>
      </Box>

      {/* CABECERA DE PERFIL (Centrado limpio) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: "24px",
          border: `1px solid ${COLORES.grisContorno}`,
          bgcolor: COLORES.fondoBlanco,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        }}
      >
        {/* Avatar grande con botón de cámara */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <Avatar
            src={fotoSrc}
            sx={{
              width: 96,
              height: 96,
              bgcolor: COLORES.primarioClaro,
              color: COLORES.primarioOscuro,
              fontSize: 32,
              fontWeight: 700,
              border: `4px solid ${COLORES.fondoBlanco}`,
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            }}
          >
            {iniciales}
          </Avatar>
          <label htmlFor="foto-perfil-centrada">
            <input
              id="foto-perfil-centrada"
              type="file"
              hidden
              accept="image/*"
              onChange={handleFotoChange}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: COLORES.primarioOscuro,
                color: COLORES.fondoBlanco,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .2s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                "&:hover": { bgcolor: COLORES.primario, transform: "scale(1.08)" },
              }}
              title="Cambiar foto de perfil"
            >
              {subiendoFoto ? <CircularProgress size={14} sx={{ color: COLORES.fondoBlanco }} /> : <Camera size={15} />}
            </Box>
          </label>
        </Box>

        {/* Nombre y Username */}
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
          {nombreMostrar}
        </Typography>
        <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, fontFamily: "monospace", mt: 0.5 }}>
          @{usernameMostrar}
        </Typography>

        {/* Metadatos institucionales */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, flexWrap: "wrap", mt: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: 13, color: COLORES.textoSecundario }}>
            <Briefcase size={14} color={COLORES.primarioOscuro} />
            <span>{cargoMostrar}</span>
          </Box>
          <Typography sx={{ color: COLORES.borde2 }}>•</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: 13, color: COLORES.textoSecundario }}>
            <Building2 size={14} color={COLORES.primarioOscuro} />
            <span>{areaMostrar} ({pisoMostrar})</span>
          </Box>
        </Box>

        {/* Badges de rol y estado */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 2.5 }}>
          <Chip
            icon={<ShieldCheck size={16} color={COLORES.primarioOscuro} />}
            label={rolLabel}
            sx={{
              height: 30,
              px: 1,
              borderRadius: "8px",
              bgcolor: COLORES.primarioClaro,
              color: COLORES.primarioOscuro,
              fontWeight: 700,
              fontSize: 12,
            }}
          />
          <Chip
            icon={<CheckCircle2 size={15} color={COLORES.verdeTexto} />}
            label="Cuenta Activa"
            sx={{
              height: 30,
              px: 1,
              borderRadius: "8px",
              bgcolor: COLORES.successFondo,
              color: COLORES.verdeTexto,
              fontWeight: 600,
              fontSize: 12,
            }}
          />
        </Box>
      </Paper>

      {/* BLOQUE 1: INFORMACIÓN DE LA CUENTA Y CONTACTO */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: `1px solid ${COLORES.grisContorno}`,
          bgcolor: COLORES.fondoBlanco,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, px: 3, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: COLORES.fondoGris }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <User size={18} color={COLORES.primarioOscuro} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
              Información de la Cuenta
            </Typography>
          </Box>
          {!editandoContacto && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit3 size={14} />}
              onClick={() => setEditandoContacto(true)}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 12.5,
                fontWeight: 600,
                color: COLORES.primarioOscuro,
                borderColor: COLORES.primarioClaro2,
                "&:hover": { bgcolor: COLORES.primarioClaro, borderColor: COLORES.primario },
              }}
            >
              Editar contacto
            </Button>
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Fila: Usuario */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
            <Typography sx={{ fontSize: 13.5, color: COLORES.textoTerciario, fontWeight: 500 }}>
              Usuario de acceso
            </Typography>
            <Chip
              label={`@${usernameMostrar}`}
              size="small"
              sx={{ fontWeight: 600, fontSize: 12, bgcolor: COLORES.fondoGris, color: COLORES.textoPrimario, fontFamily: "monospace" }}
            />
          </Box>

          <Divider sx={{ borderColor: COLORES.fondoGris2 }} />

          {/* Fila: Cargo y Ubicación */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
            <Typography sx={{ fontSize: 13.5, color: COLORES.textoTerciario, fontWeight: 500 }}>
              Cargo y Ubicación
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: COLORES.textoPrimario, textAlign: "right" }}>
              {cargoMostrar} · {areaMostrar} ({pisoMostrar})
            </Typography>
          </Box>

          <Divider sx={{ borderColor: COLORES.fondoGris2 }} />

          {/* Fila: Correo institucional */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5, gap: 2 }}>
            <Typography sx={{ fontSize: 13.5, color: COLORES.textoTerciario, fontWeight: 500, flexShrink: 0 }}>
              Correo institucional
            </Typography>
            {editandoContacto ? (
              <TextField
                size="small"
                value={contactoForm.correo}
                onChange={(e) => setContactoForm((prev) => ({ ...prev, correo: e.target.value }))}
                placeholder="correo@dusakawi.gov.co"
                sx={{
                  maxWidth: 320,
                  width: "100%",
                  "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 },
                }}
              />
            ) : (
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: COLORES.textoPrimario, textAlign: "right" }}>
                {contactoForm.correo || "Sin registrar"}
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: COLORES.fondoGris2 }} />

          {/* Fila: Teléfono / Extensión */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5, gap: 2 }}>
            <Typography sx={{ fontSize: 13.5, color: COLORES.textoTerciario, fontWeight: 500, flexShrink: 0 }}>
              Teléfono / Extensión
            </Typography>
            {editandoContacto ? (
              <TextField
                size="small"
                value={contactoForm.telefono}
                onChange={(e) => setContactoForm((prev) => ({ ...prev, telefono: e.target.value }))}
                placeholder="Ej: 3001234567"
                sx={{
                  maxWidth: 320,
                  width: "100%",
                  "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 },
                }}
              />
            ) : (
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: COLORES.textoPrimario, textAlign: "right" }}>
                {contactoForm.telefono || "Sin registrar"}
              </Typography>
            )}
          </Box>

          {/* Botones de acción al editar */}
          {editandoContacto && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, pt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setEditandoContacto(false);
                  setContactoForm({
                    correo: datos?.correo || datos?.email || usuario.email || "",
                    telefono: datos?.telefono || datos?.phone || "",
                  });
                }}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: COLORES.textoTerciario,
                  borderColor: COLORES.borde2,
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<Save size={14} />}
                onClick={handleGuardarContacto}
                disabled={guardandoContacto}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: COLORES.primarioOscuro,
                  "&:hover": { bgcolor: COLORES.primario },
                }}
              >
                {guardandoContacto ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* BLOQUE 2: SEGURIDAD Y ACCESO */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: `1px solid ${COLORES.grisContorno}`,
          bgcolor: COLORES.fondoBlanco,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, px: 3, display: "flex", alignItems: "center", gap: 1.2, bgcolor: COLORES.fondoGris }}>
          <KeyRound size={18} color={COLORES.warningOscuro} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
            Seguridad y Acceso
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Fila: Contraseña con botón modal */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
            <Box>
              <Typography sx={{ fontSize: 13.5, color: COLORES.textoPrimario, fontWeight: 600 }}>
                Contraseña
              </Typography>
              <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>
                •••••••••••• (Cifrada con estándar seguro)
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setPassActual("");
                setPassNuevo("");
                setPassConfirmar("");
                setModalPassOpen(true);
              }}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 12.5,
                fontWeight: 600,
                color: COLORES.textoSecundario,
                borderColor: COLORES.borde2,
                "&:hover": { bgcolor: COLORES.fondoGris, borderColor: COLORES.textoSecundario },
              }}
            >
              Cambiar contraseña
            </Button>
          </Box>

          <Divider sx={{ borderColor: COLORES.fondoGris2 }} />

          {/* Fila: Último acceso */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
            <Typography sx={{ fontSize: 13.5, color: COLORES.textoTerciario, fontWeight: 500 }}>
              Último acceso registrado
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>
              {formatUltimoAcceso(datos?.ultimo_acceso || usuario.ultimo_acceso)}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: COLORES.fondoGris2 }} />

          {/* Fila: Sesión actual */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
            <Typography sx={{ fontSize: 13.5, color: COLORES.textoTerciario, fontWeight: 500 }}>
              Sesión activa
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORES.success }} />
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: COLORES.verdeTexto }}>
                Autenticado en este navegador
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* BOTÓN CERRAR SESIÓN */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 2 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogOut size={16} />}
          onClick={handleCerrarSesion}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            px: 3,
            py: 1,
            borderColor: COLORES.dangerBorde,
            color: COLORES.danger,
            "&:hover": { bgcolor: COLORES.dangerFondo, borderColor: COLORES.danger },
          }}
        >
          Cerrar sesión
        </Button>
      </Box>

      {/* MODAL / DIALOG: CAMBIO DE CONTRASEÑA */}
      <Dialog
        open={modalPassOpen}
        onClose={() => !cambiandoPass && setModalPassOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: "20px", p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: 17, color: COLORES.textoPrimario }}>
          Cambiar Contraseña
        </DialogTitle>
        <form onSubmit={handleCambiarPassword}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Typography sx={{ fontSize: 12.5, color: COLORES.textoSuave, mb: 0.5 }}>
              Ingresa tu contraseña actual y define una nueva de al menos 8 caracteres.
            </Typography>

            <TextField
              fullWidth
              size="small"
              type={showPassActual ? "text" : "password"}
              label="Contraseña actual"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassActual(!showPassActual)} edge="end">
                        {showPassActual ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
            />

            <TextField
              fullWidth
              size="small"
              type={showPassNuevo ? "text" : "password"}
              label="Nueva contraseña"
              helperText="Mínimo 8 caracteres"
              value={passNuevo}
              onChange={(e) => setPassNuevo(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassNuevo(!showPassNuevo)} edge="end">
                        {showPassNuevo ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
            />

            <TextField
              fullWidth
              size="small"
              type={showPassConfirmar ? "text" : "password"}
              label="Confirmar nueva contraseña"
              value={passConfirmar}
              onChange={(e) => setPassConfirmar(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassConfirmar(!showPassConfirmar)} edge="end">
                        {showPassConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setModalPassOpen(false)}
              disabled={cambiandoPass}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                color: COLORES.textoTerciario,
                borderColor: COLORES.borde2,
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={cambiandoPass || !passActual || !passNuevo || !passConfirmar}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                bgcolor: COLORES.primarioOscuro,
                "&:hover": { bgcolor: COLORES.primario },
              }}
            >
              {cambiandoPass ? <CircularProgress size={16} sx={{ color: COLORES.fondoBlanco }} /> : "Guardar contraseña"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* SNACKBAR FEEDBACK */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "10px" }}>
          {snack.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
