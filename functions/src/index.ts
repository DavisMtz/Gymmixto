import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { syncSheetToFirestore } from './sync';

initializeApp();
setGlobalOptions({ region: process.env.FUNCTIONS_REGION || 'us-central1', maxInstances: 10 });

// Callables de la app (lecturas desde Firestore, escrituras a la Hoja).
export {
  obtenerUsuarios,
  verificarEstadoHoy,
  obtenerRachaUsuario,
  obtenerSemanaUsuario,
  obtenerHistorialUsuario,
  obtenerRanking,
  obtenerRankingMensual,
  obtenerRankingAnterior,
  obtenerActividadReciente,
  guardarRegistro,
  getPinStatus,
  crearPin,
  verificarPin,
} from './api';

// Sincronización programada Hoja -> Firestore (cada 5 minutos).
export const syncProgramada = onSchedule(
  { schedule: 'every 5 minutes', timeZone: 'America/Mexico_City' },
  async () => {
    const counts = await syncSheetToFirestore();
    console.log('Sync OK', counts);
  }
);

// Sincronización on-demand (botón "refrescar" / setup inicial).
export const syncAhora = onCall(async () => {
  const counts = await syncSheetToFirestore();
  return { success: true, counts };
});
