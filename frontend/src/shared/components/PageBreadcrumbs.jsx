import { Breadcrumbs, Link, Typography, Box, IconButton } from "@mui/material";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COLORES } from "../constants/colores.js";

/**
 * Componente unificado de migas de pan (Breadcrumbs)
 * @param {object} props
 * @param {Array<string | { label: string, path?: string }>} [props.items] - Elementos de la ruta (después de "Inicio")
 * @param {boolean} [props.showBack] - Si muestra el botón flecha hacia atrás
 * @param {Function} [props.onVolver] - Función personalizada al hacer clic en volver (por defecto navigate(-1))
 * @param {object} [props.sx] - Estilos adicionales para el contenedor
 */
export default function PageBreadcrumbs({ items = [], showBack = false, onVolver, sx = {} }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onVolver) onVolver();
    else navigate(-1);
  };

  const normalizedItems = items.map((item) =>
    typeof item === "string" ? { label: item } : item
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5, ...sx }}>
      {showBack && (
        <IconButton
          onClick={handleBack}
          size="small"
          title="Volver"
          sx={{
            p: 0.5,
            borderRadius: "8px",
            color: COLORES.textoTerciario,
            "&:hover": { bgcolor: COLORES.fondoGris2, color: COLORES.primarioOscuro },
          }}
        >
          <ArrowLeft size={18} />
        </IconButton>
      )}

      <Breadcrumbs
        separator={<ChevronRight size={14} color={COLORES.textoSuave} />}
        sx={{
          fontSize: 12.5,
          color: COLORES.textoSuave,
          "& .MuiBreadcrumbs-separator": { mx: 0.75 },
        }}
      >
        <Link
          underline="hover"
          color="inherit"
          sx={{
            cursor: "pointer",
            fontWeight: 500,
            transition: "color .15s",
            "&:hover": { color: COLORES.primarioOscuro },
          }}
          onClick={() => navigate("/dashboard")}
        >
          Inicio
        </Link>

        {normalizedItems.map((item, index) => {
          const esUltimo = index === normalizedItems.length - 1;

          if (esUltimo) {
            return (
              <Typography
                key={index}
                sx={{
                  fontSize: 12.5,
                  color: COLORES.textoPrimario,
                  fontWeight: 600,
                }}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              underline={item.path ? "hover" : "none"}
              color="inherit"
              sx={{
                cursor: item.path ? "pointer" : "default",
                fontWeight: 500,
                transition: "color .15s",
                "&:hover": item.path ? { color: COLORES.primarioOscuro } : {},
              }}
              onClick={() => item.path && navigate(item.path)}
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
