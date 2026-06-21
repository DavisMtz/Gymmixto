// Capa de acceso a datos.
// Reemplaza a google.script.run. Si Firebase está configurado, llama a las
// Cloud Functions (callables). Si no, devuelve datos DEMO para desarrollo local.
import { httpsCallable } from 'firebase/functions';
import { isConfigured, getFns, ensureAnonSession } from './firebase';

async function call<T>(name: string, payload?: any): Promise<T> {
  await ensureAnonSession();
  const fn = httpsCallable(getFns(), name);
  const res = await fn(payload ?? {});
  return res.data as T;
}

// ————————————————————— DATOS DEMO —————————————————————
const DEMO_USERS = ['Alexa Bautista', 'Juan Perez', 'Maria Garcia', 'Sofia Lopez', 'Diego Ramirez'];
const DEMO_RANKING = {
  ranking: [
    { nombre: 'Alexa Bautista', dias: 5, calorias: 3240 },
    { nombre: 'Sofia Lopez', dias: 4, calorias: 2890 },
    { nombre: 'Diego Ramirez', dias: 4, calorias: 2510 },
    { nombre: 'Juan Perez', dias: 3, calorias: 1980 },
    { nombre: 'Maria Garcia', dias: 2, calorias: 1340 },
  ],
  bote: 845.0,
};
const DEMO_TICKER = [
  { nombre: 'Alexa', tipo: 'Gimnasio', calorias: 520, hace: '1 h' },
  { nombre: 'Diego', tipo: 'Fuera del Gym', calorias: 480, hace: '3 h' },
  { nombre: 'Sofia', tipo: 'Gimnasio', calorias: 610, hace: '5 h' },
  { nombre: 'Juan', tipo: 'Gimnasio', calorias: 390, hace: '1 d' },
];
const DEMO_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => ({
  dia,
  fecha: '',
  estatus: 'sin registro',
}));

// ————————————————————— API —————————————————————
export async function obtenerUsuarios(): Promise<string[]> {
  if (!isConfigured()) return DEMO_USERS;
  return call<string[]>('obtenerUsuarios');
}

export async function verificarEstadoHoy(usuario: string): Promise<any> {
  if (!isConfigured()) return { yaRegistro: false };
  return call('verificarEstadoHoy', { usuario });
}

export async function obtenerRachaUsuario(usuario: string): Promise<number> {
  if (!isConfigured()) return 3;
  return call<number>('obtenerRachaUsuario', { usuario });
}

export async function obtenerSemanaUsuario(usuario: string): Promise<any[]> {
  if (!isConfigured()) return DEMO_SEMANA;
  return call('obtenerSemanaUsuario', { usuario });
}

export async function obtenerHistorialUsuario(usuario: string): Promise<any[]> {
  if (!isConfigured()) return [];
  return call('obtenerHistorialUsuario', { usuario });
}

export async function obtenerRanking(): Promise<any> {
  if (!isConfigured()) return DEMO_RANKING;
  return call('obtenerRanking');
}

export async function obtenerRankingMensual(): Promise<any> {
  if (!isConfigured()) return DEMO_RANKING;
  return call('obtenerRankingMensual');
}

export async function obtenerRankingAnterior(): Promise<any> {
  if (!isConfigured()) return { ranking: DEMO_RANKING.ranking.slice().reverse() };
  return call('obtenerRankingAnterior');
}

export async function obtenerActividadReciente(): Promise<any[]> {
  if (!isConfigured()) return DEMO_TICKER;
  return call('obtenerActividadReciente');
}

export async function guardarRegistro(datos: any): Promise<{ success: boolean; message?: string }> {
  if (!isConfigured()) {
    await new Promise((r) => setTimeout(r, 700));
    return { success: true, message: '(demo) Registro simulado' };
  }
  return call('guardarRegistro', datos);
}

// ————————————————————— PIN —————————————————————
export async function getPinStatus(usuario: string): Promise<{ exists: boolean }> {
  if (!isConfigured()) {
    return { exists: Boolean(localStorage.getItem('demoPin_' + usuario)) };
  }
  return call('getPinStatus', { usuario });
}

export async function crearPin(usuario: string, pin: string): Promise<{ success: boolean; message?: string }> {
  if (!isConfigured()) {
    localStorage.setItem('demoPin_' + usuario, pin);
    return { success: true };
  }
  return call('crearPin', { usuario, pin });
}

export async function verificarPin(usuario: string, pin: string): Promise<{ success: boolean; message?: string }> {
  if (!isConfigured()) {
    const ok = localStorage.getItem('demoPin_' + usuario) === pin;
    return { success: ok, message: ok ? undefined : 'PIN incorrecto' };
  }
  return call('verificarPin', { usuario, pin });
}
