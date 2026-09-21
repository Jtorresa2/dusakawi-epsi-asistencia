// @ts-ignore - no @types/node-cron installed
import cron from "node-cron";
import { marcarAusentes } from "../api/shared/services/ausenteService";

function fechaAyer() {
  const d = new Date(Date.now() - 86400000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function marcarAusentesDeFecha(fechaStr: string) {
  try {
    const res = await marcarAusentes(fechaStr);
    console.log(
      `[cron-ausentes] Fecha: ${res.fecha} | Procesados: ${res.procesados} | Ausentes creados: ${res.creados} | Omitidos (con marca): ${res.omitidosLaboralConMarca} | Salidas no registradas: ${res.salidasNoRegistradas} | Ausencias de tarde: ${res.ausenciasTarde} | Errores: ${res.errores.length}`
    );
    if (res.errores.length > 0) {
      console.error('[cron-ausentes] Detalle errores:', res.errores);
    }
  } catch (err) {
    console.error('[cron-ausentes] Error general:', err instanceof Error ? err.message : err);
  }
}

export function iniciarAusentesJob() {
  const patron = '45 23 * * *';

  if (!cron.validate(patron)) {
    console.error('[cron-ausentes] Patron invalido, job NO programado:', patron);
    return;
  }

  cron.schedule(patron, () => {
    marcarAusentesDeFecha(fechaAyer());
  },
  {
    timezone: 'America/Bogota',
  }
);

  console.log('[cron-ausentes] Job programado: todos los dias a las 23:45 (fecha del dia anterior)');
  console.log('[cron-ausentes] NO corre retroactivo al boot.');
}