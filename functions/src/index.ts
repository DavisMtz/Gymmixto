import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { syncSheetToFirestore } from './sync';

initializeApp();

// Las Functions corren COMO esta cuenta de servicio. Comparte la Hoja de Google
// como Editor con este correo y la Sheets API autenticará automáticamente
// (sin necesidad de pegar la clave privada). Override con FUNCTIONS_SA.
const SERVICE_ACCOUNT =
  process.env.FUNCTIONS_SA || 'firebase-adminsdk-fbsvc@servicios-logidma.iam.gserviceaccount.com';

setGlobalOptions({
  region: process.env.FUNCTIONS_REGION || 'us-central1',
  maxInstances: 10,
  serviceAccount: SERVICE_ACCOUNT,
});

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
