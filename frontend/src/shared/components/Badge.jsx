import { COLORES } from "../constants/colores.js";
export default function Badge({ texto, tipo }) {
  const estilos = {
    Puntual:   { bg: COLORES.successFondo, color: COLORES.verdeTexto },
    Tardanza:  { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
    Ausente:   { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
    Activo:    { bg: COLORES.primarioClaro2, color: COLORES.primarioOscuro },
    Inactivo:  { bg: COLORES.fondoGris2, color: COLORES.textoTerciario },
    Aprobado:  { bg: COLORES.successFondo, color: COLORES.verdeTexto },
    Pendiente: { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
    Rechazado: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
  };

  const estilo = estilos[tipo] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario };

  return (
    <span style={{
      fontSize: "11px", padding: "3px 10px", borderRadius: "8px",
      background: estilo.bg, color: estilo.color, fontWeight: 500,
      display: "inline-block"
    }}>
      {texto}
    </span>
  );
}