// Reglas y helpers 1:1 del legacy asistenciaController.js.
// Transcripción exacta: NO se toca la matemática ni los dicts español↔inglés.

// FIX AUTORIZADO: el flujo interno de marcar pasa Dates (Prisma devuelve
// timestamptz como Date). La BD corre en Etc/UTC, así que las horas para el
// cálculo de métricas se extraen con getUTC* (idéntico a TO_CHAR HH24:MI en
// zona de sesión). Los strings 'HH:MM(:SS)' del legacy siguen funcionando.
export function timeToMinutes(t: any): number | null {
  if (!t) return null;
  if (t instanceof Date) {
    return t.getUTCHours() * 60 + t.getUTCMinutes();
  }
  const parts = t.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export function calculateAttendanceMetrics(
  e1: string | Date | null,
  s1: string | Date | null,
  e2: string | Date | null,
  s2: string | Date | null,
  tolerancia = 15
): { horas_trabajadas: number; minutos_tardanza: number } {
  let minutesWorked = 0;
  const mE1 = timeToMinutes(e1);
  const mS1 = timeToMinutes(s1);
  const mE2 = timeToMinutes(e2);
  const mS2 = timeToMinutes(s2);

  if (mE1 !== null && mS1 !== null && mS1 > mE1) {
    minutesWorked += mS1 - mE1;
  }
  if (mE2 !== null && mS2 !== null && mS2 > mE2) {
    minutesWorked += mS2 - mE2;
  }

  let lateness = 0;
  // Morning entry: 08:00 (480 min) + tolerancia
  if (mE1 !== null && mE1 > 480 + tolerancia) {
    lateness += mE1 - 480;
  }
  // Afternoon entry: 14:00 (840 min) + tolerancia
  if (mE2 !== null && mE2 > 840 + tolerancia) {
    lateness += mE2 - 840;
  }

  const horas_trabajadas = +(minutesWorked / 60).toFixed(2);
  return { horas_trabajadas, minutos_tardanza: lateness };
}

export function statusDisplay(status: string | null | undefined): string {
  if (status === 'on_time') return 'puntual';
  if (status === 'late') return 'tardanza';
  if (status === 'absent') return 'ausente';
  if (status === 'justified') return 'justificado';
  return status || 'puntual';
}

export function statusFromDB(status: string | null | undefined): string {
  if (status === 'puntual') return 'on_time';
  if (status === 'tardanza') return 'late';
  if (status === 'ausente') return 'absent';
  if (status === 'justificado') return 'justified';
  return status || 'on_time';
}
