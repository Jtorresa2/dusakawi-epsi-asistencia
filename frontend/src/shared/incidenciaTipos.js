// Incident "type" keys are stored in the database (stable English keys).
// The UI shows them in Spanish. Display labels only — this map does NOT
// define which types are selectable (that lives in the report form / backend).
export const TIPOS_INCIDENCIA = {
  biometric_failure: "Falla biométrica",
  other: "Otro",
  late: "Tardanza",
  unregistered_exit: "Salida no registrada",
  afternoon_absence: "Ausencia de la tarde",
  // Legacy/seed values kept only so nothing ever renders in raw English.
  absence: "Ausencia",
  damaged_equipment: "Equipo dañado",
  late_arrival: "Llegada tarde",
};

export const etiquetaTipoIncidencia = (tipo) => TIPOS_INCIDENCIA[tipo] || tipo || "—";
