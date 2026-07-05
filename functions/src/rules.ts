// Lógica de negocio portada de codigo.gs (Apps Script) a TypeScript.
// Opera sobre arreglos de objetos (registros/pagos) leídos desde Firestore.
// Las fechas de actividad se manejan como cadenas 'YYYY-MM-DD' en zona MX,
// lo que evita problemas de zona horaria al comparar.

export const TZ = 'America/Mexico_City';

export interface Registro {
  usuario: string;
  fecha: string; // YYYY-MM-DD (fecha de la actividad)
  tipo: string;
  minutos: number;
  calorias: number;
  evidencia?: string;
  estatus: string; // CUMPLE | NO CUMPLE | JUSTIFICADO | N/A | Pendiente
  notas?: string;
  tsMs?: number; // timestamp de creación (ms) para "hace"
}

export interface Pago {
  fecha?: string;
  usuario?: string;
  monto: number;
  notas?: string;
}

export interface RankItem {
  nombre: string;
  dias: number;
  calorias: number;
}

// ————————————————————— Helpers de fecha (zona MX) —————————————————————
export function ymdInTZ(d: Date): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function todayStr(): string {
  return ymdInTZ(new Date());
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function ymdUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysStr(s: string, n: number): string {
  const d = parseYMD(s);
  d.setUTCDate(d.getUTCDate() + n);
  return ymdUTC(d);
}

function dayOfWeekMon1(s: string): number {
  const g = parseYMD(s).getUTCDay();
  return g === 0 ? 7 : g; // Lunes=1 ... Domingo=7
}

export interface Range {
  start: string;
  end: string;
}

export function weekRange(today = todayStr()): Range {
  const dow = dayOfWeekMon1(today);
  const monday = addDaysStr(today, -(dow - 1));
  return { start: monday, end: addDaysStr(monday, 6) };
}

export function prevWeekRange(today = todayStr()): Range {
  const dow = dayOfWeekMon1(today);
  const monday = addDaysStr(today, -(dow - 1));
  const prevMonday = addDaysStr(monday, -7);
  return { start: prevMonday, end: addDaysStr(prevMonday, 6) };
}

export function monthRange(today = todayStr()): Range {
  const [y, m] = today.split('-').map(Number);
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start: first, end: last };
}

const inRange = (fecha: string, r: Range) => fecha >= r.start && fecha <= r.end;

// ————————————————————— Reglas de cumplimiento —————————————————————
// Equivalente a la lógica de guardarRegistro() en codigo.gs.
export function computeEstatus(tipo: string, minutos: number, calorias: number): {
  estatus: string;
  minutos: number;
  calorias: number;
} {
  let min = minutos || 0;
  let cal = calorias || 0;
  let estatus = 'Pendiente';

  if (tipo === 'Gimnasio') {
    estatus = min >= 75 || cal >= 500 ? 'CUMPLE' : 'NO CUMPLE';
  } else if (tipo === 'Fuera del Gym') {
    estatus = (min >= 90 && cal >= 550) || (cal >= 700 && min <= 120) ? 'CUMPLE' : 'NO CUMPLE';
  } else if (tipo === 'Vacaciones' || tipo === 'Incapacidad') {
    estatus = 'JUSTIFICADO';
    min = 0;
    cal = 0;
  } else {
    estatus = 'N/A';
  }
  return { estatus, minutos: min, calorias: cal };
}

// "tiempo" viene como "HH:MM" desde el cliente.
export function minutosDesdeTiempo(tiempo?: string): number {
  if (!tiempo) return 0;
  const [h, m] = tiempo.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
}

// ————————————————————— Usuarios —————————————————————
export function usuariosActivos(rows: { nombre: string; activo: boolean }[]): string[] {
  return rows.filter((r) => r.nombre && r.activo).map((r) => r.nombre);
}

// ————————————————————— Estado de hoy —————————————————————
export function estadoHoy(registros: Registro[], usuario: string): {
  yaRegistro: boolean;
  mensaje?: string;
  tipo?: string;
} {
  const hoy = todayStr();
  const reg = registros.find((r) => r.usuario === usuario && r.fecha === hoy);
  if (reg) {
    return { yaRegistro: true, mensaje: '¡Ya registraste tu actividad de hoy!', tipo: reg.tipo };
  }
  return { yaRegistro: false };
}

// ————————————————————— Racha —————————————————————
export function rachaUsuario(registros: Registro[], usuario: string): number {
  const fechas = new Set<string>();
  for (const r of registros) {
    if (r.usuario === usuario && (r.estatus === 'CUMPLE' || r.estatus === 'JUSTIFICADO')) {
      fechas.add(r.fecha);
    }
  }
  if (fechas.size === 0) return 0;

  const ordenadas = Array.from(fechas).sort((a, b) => (a < b ? 1 : -1)); // desc
  const hoy = todayStr();
  const ayer = addDaysStr(hoy, -1);

  if (ordenadas[0] !== hoy && ordenadas[0] !== ayer) return 0;

  let racha = 1;
  for (let i = 0; i < ordenadas.length - 1; i++) {
    if (addDaysStr(ordenadas[i], -1) === ordenadas[i + 1]) racha++;
    else break;
  }
  return racha;
}

// ————————————————————— Semana del usuario —————————————————————
export function semanaUsuario(registros: Registro[], usuario: string): {
  dia: string;
  fecha: string;
  estatus: string;
}[] {
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const { start } = weekRange();
  const semana = dias.map((dia, i) => ({ dia, fecha: addDaysStr(start, i), estatus: 'sin registro' }));
  for (const r of registros) {
    if (r.usuario !== usuario) continue;
    const slot = semana.find((s) => s.fecha === r.fecha);
    if (slot) slot.estatus = r.estatus;
  }
  return semana;
}

// ————————————————————— Historial —————————————————————
export function historialUsuario(registros: Registro[], usuario: string): {
  fecha: string;
  tipo: string;
  estatus: string;
}[] {
  return registros
    .filter((r) => r.usuario === usuario)
    .sort((a, b) => (b.tsMs || 0) - (a.tsMs || 0))
    .slice(0, 5)
    .map((r) => {
      const [, m, d] = r.fecha.split('-');
      return { fecha: `${d}/${m}`, tipo: r.tipo, estatus: r.estatus };
    });
}

// ————————————————————— Ranking + bote —————————————————————
function boteTotal(pagos: Pago[]): number {
  return pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
}

function rankingForRange(registros: Registro[], range: Range): RankItem[] {
  const conteo: Record<string, { dias: number; calorias: number }> = {};
  for (const r of registros) {
    if (!inRange(r.fecha, range)) continue;
    if (!conteo[r.usuario]) conteo[r.usuario] = { dias: 0, calorias: 0 };
    if (r.estatus === 'CUMPLE' || r.estatus === 'JUSTIFICADO') conteo[r.usuario].dias += 1;
    if (r.tipo === 'Gimnasio' || r.tipo === 'Fuera del Gym') conteo[r.usuario].calorias += Number(r.calorias) || 0;
  }
  return Object.keys(conteo)
    .map((nombre) => ({ nombre, dias: conteo[nombre].dias, calorias: conteo[nombre].calorias }))
    .sort((a, b) => (b.dias !== a.dias ? b.dias - a.dias : b.calorias - a.calorias));
}

export function rankingSemanal(registros: Registro[], pagos: Pago[]): { ranking: RankItem[]; bote: number } {
  return { ranking: rankingForRange(registros, weekRange()), bote: boteTotal(pagos) };
}

export function rankingMensual(registros: Registro[], pagos: Pago[]): { ranking: RankItem[]; bote: number } {
  return { ranking: rankingForRange(registros, monthRange()), bote: boteTotal(pagos) };
}

export function rankingAnterior(registros: Registro[]): { ranking: RankItem[] } {
  return { ranking: rankingForRange(registros, prevWeekRange()) };
}

// ————————————————————— Actividad reciente —————————————————————
export function actividadReciente(registros: Registro[]): {
  nombre: string;
  tipo: string;
  calorias: number;
  hace: string;
}[] {
  const now = Date.now();
  return registros
    .filter((r) => r.estatus === 'CUMPLE' || r.estatus === 'JUSTIFICADO')
    .sort((a, b) => (b.tsMs || 0) - (a.tsMs || 0))
    .slice(0, 8)
    .map((r) => {
      const diffMins = Math.round((now - (r.tsMs || now)) / 60000);
      const hace =
        diffMins < 60 ? `${diffMins} min` : diffMins < 1440 ? `${Math.round(diffMins / 60)} h` : `${Math.round(diffMins / 1440)} d`;
      return { nombre: (r.usuario || '').split(' ')[0], tipo: r.tipo, calorias: Number(r.calorias) || 0, hace };
    });
}
