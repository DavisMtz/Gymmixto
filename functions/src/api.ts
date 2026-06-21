// Cloud Functions callables: reemplazan a las funciones de codigo.gs.
// Las LECTURAS se sirven desde Firestore (caché) para velocidad.
// Las ESCRITURAS van a la Hoja (fuente de verdad) y se reflejan en Firestore.
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import * as rules from './rules';
import { appendRegistro } from './sheets';
import { pinStatus, createPin, checkPin } from './pin';

async function getRegistros(): Promise<rules.Registro[]> {
  const snap = await getFirestore().collection('registros').get();
  return snap.docs.map((d) => d.data() as rules.Registro);
}
async function getPagos(): Promise<rules.Pago[]> {
  const snap = await getFirestore().collection('pagos').get();
  return snap.docs.map((d) => d.data() as rules.Pago);
}
async function getUsuarios(): Promise<{ nombre: string; activo: boolean }[]> {
  const snap = await getFirestore().collection('usuarios').get();
  return snap.docs.map((d) => d.data() as { nombre: string; activo: boolean });
}

const requireStr = (req: CallableRequest, key: string): string => {
  const v = req.data?.[key];
  if (typeof v !== 'string' || !v) throw new HttpsError('invalid-argument', `Falta "${key}".`);
  return v;
};

// ————————————————————— Lecturas —————————————————————
export const obtenerUsuarios = onCall(async () => rules.usuariosActivos(await getUsuarios()));

export const verificarEstadoHoy = onCall(async (req) =>
  rules.estadoHoy(await getRegistros(), requireStr(req, 'usuario'))
);

export const obtenerRachaUsuario = onCall(async (req) =>
  rules.rachaUsuario(await getRegistros(), requireStr(req, 'usuario'))
);

export const obtenerSemanaUsuario = onCall(async (req) =>
  rules.semanaUsuario(await getRegistros(), requireStr(req, 'usuario'))
);

export const obtenerHistorialUsuario = onCall(async (req) =>
  rules.historialUsuario(await getRegistros(), requireStr(req, 'usuario'))
);

export const obtenerRanking = onCall(async () => {
  const [registros, pagos] = await Promise.all([getRegistros(), getPagos()]);
  return rules.rankingSemanal(registros, pagos);
});

export const obtenerRankingMensual = onCall(async () => {
  const [registros, pagos] = await Promise.all([getRegistros(), getPagos()]);
  return rules.rankingMensual(registros, pagos);
});

export const obtenerRankingAnterior = onCall(async () => rules.rankingAnterior(await getRegistros()));

export const obtenerActividadReciente = onCall(async () => rules.actividadReciente(await getRegistros()));

// ————————————————————— Escritura —————————————————————
export const guardarRegistro = onCall(async (req) => {
  const usuario = requireStr(req, 'usuario');
  const tipo = requireStr(req, 'tipo');
  const tiempo: string = req.data?.tiempo || '';
  const caloriasIn = parseInt(req.data?.calorias, 10) || 0;
  const notas: string = req.data?.notas || '';
  const evidencia: string = req.data?.evidencia || 'NO';

  // Revalidación servidor: evitar doble registro el mismo día.
  const registros = await getRegistros();
  if (rules.estadoHoy(registros, usuario).yaRegistro) {
    return { success: false, message: 'Ya existe un registro tuyo el día de hoy.' };
  }

  const fecha = rules.todayStr();
  const minutos = rules.minutosDesdeTiempo(tiempo);
  const calc = rules.computeEstatus(tipo, minutos, caloriasIn);

  try {
    // 1) Hoja (fuente de verdad)
    const row = await appendRegistro({
      usuario,
      fecha,
      tipo,
      minutos: calc.minutos,
      calorias: calc.calorias,
      evidencia,
      estatus: calc.estatus,
      notas,
    });

    // 2) Write-through a Firestore (mismo id determinístico que la sync: r{fila-2})
    const idx = row > 1 ? row - 2 : registros.length;
    const reg: rules.Registro = {
      usuario,
      fecha,
      tipo,
      minutos: calc.minutos,
      calorias: calc.calorias,
      evidencia,
      estatus: calc.estatus,
      notas,
      tsMs: Date.now(),
    };
    await getFirestore().collection('registros').doc(`r${idx}`).set(reg);

    return { success: true, message: '¡Entrenamiento registrado con éxito!' };
  } catch (e: any) {
    return { success: false, message: e?.message || String(e) };
  }
});

// ————————————————————— PIN —————————————————————
export const getPinStatus = onCall(async (req) => pinStatus(requireStr(req, 'usuario')));
export const crearPin = onCall(async (req) => createPin(requireStr(req, 'usuario'), requireStr(req, 'pin')));
export const verificarPin = onCall(async (req) => checkPin(requireStr(req, 'usuario'), requireStr(req, 'pin')));
