export default function Badge({ texto, tipo }) {
  const estilos = {
    Puntual:   { bg: "#d1fae5", color: "#065f46" },
    Tardanza:  { bg: "#fef3c7", color: "#92400e" },
    Ausente:   { bg: "#fee2e2", color: "#991b1b" },
    Activo:    { bg: "#dbeafe", color: "#1e40af" },
    Inactivo:  { bg: "#f3f4f6", color: "#6b7280" },
    Aprobado:  { bg: "#d1fae5", color: "#065f46" },
    Pendiente: { bg: "#fef3c7", color: "#92400e" },
    Rechazado: { bg: "#fee2e2", color: "#991b1b" },
  };

  const estilo = estilos[tipo] || { bg: "#f3f4f6", color: "#6b7280" };

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