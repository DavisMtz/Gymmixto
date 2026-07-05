// Cliente de Google Sheets (fuente de verdad).
// Autenticación: usa SHEETS_SA_JSON (JSON del service account) si está definido;
// de lo contrario usa las credenciales por defecto del entorno (la cuenta de
// servicio de las Functions debe tener la Hoja compartida como Editor).
import { google, sheets_v4 } from 'googleapis';
import { ymdInTZ, type Registro, type Pago } from './rules';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const SHEET_USUARIOS = 'Usuarios';
const SHEET_REGISTROS = 'Registros';
const SHEET_PAGOS = 'Pagos';

let client: sheets_v4.Sheets | null = null;

// ID de la Hoja "RETO 2026". Override con la variable de entorno SPREADSHEET_ID.
const DEFAULT_SPREADSHEET_ID = '1E46f6q3q1kLl4E04uX1i3a0HENZpmcOVatDtbd0E8TQ';

function spreadsheetId(): string {
  return process.env.SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
}

async function getClient(): Promise<sheets_v4.Sheets> {
  if (client) return client;
  let auth;
  if (process.env.SHEETS_SA_JSON) {
    const creds = JSON.parse(process.env.SHEETS_SA_JSON);
    auth = new google.auth.GoogleAuth({ credentials: creds, scopes: SCOPES });
  } else {
    auth = new google.auth.GoogleAuth({ scopes: SCOPES });
  }
  const authClient = await auth.getClient();
  client = google.sheets({ version: 'v4', auth: authClient as any });
  return client;
}

// Convierte un valor de celda (serial de Sheets o string) a Date.
function cellToDate(v: any): Date | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') {
    // Serial de Sheets: días desde 1899-12-30
    return new Date(Date.UTC(1899, 11, 30) + Math.round(v * 86400000));
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// ————————————————————— Lecturas —————————————————————
export async function readUsuarios(): Promise<{ nombre: string; activo: boolean }[]> {
  const api = await getClient();
  const res = await api.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET_USUARIOS}!A2:B`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r[0])
    .map((r) => ({ nombre: String(r[0]).trim(), activo: String(r[1]).trim() === 'Activo' }));
}

export async function readRegistros(): Promise<Registro[]> {
  const api = await getClient();
  const res = await api.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET_REGISTROS}!A2:I`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER',
  });
  const rows = res.data.values || [];
  const out: Registro[] = [];
  rows.forEach((r) => {
    if (!r[1]) return; // sin usuario => fila vacía
    const tsDate = cellToDate(r[0]);
    const fechaDate = cellToDate(r[2]);
    out.push({
      usuario: String(r[1]).trim(),
      fecha: fechaDate ? ymdInTZ(fechaDate) : '',
      tipo: String(r[3] || ''),
      minutos: Number(r[4]) || 0,
      calorias: Number(r[5]) || 0,
      evidencia: r[6] != null ? String(r[6]) : '',
      estatus: String(r[7] || ''),
      notas: r[8] != null ? String(r[8]) : '',
      tsMs: tsDate ? tsDate.getTime() : undefined,
    });
  });
  return out;
}

export async function readPagos(): Promise<Pago[]> {
  const api = await getClient();
  const res = await api.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET_PAGOS}!A2:D`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER',
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r.length)
    .map((r) => {
      const fechaDate = cellToDate(r[0]);
      return {
        fecha: fechaDate ? ymdInTZ(fechaDate) : '',
        usuario: r[1] != null ? String(r[1]) : '',
        monto: Number(r[2]) || 0,
        notas: r[3] != null ? String(r[3]) : '',
      };
    });
}

// ————————————————————— Escritura —————————————————————
// Devuelve el índice de fila (1-based) donde quedó el registro.
export async function appendRegistro(reg: {
  usuario: string;
  fecha: string; // YYYY-MM-DD
  tipo: string;
  minutos: number;
  calorias: number;
  evidencia: string;
  estatus: string;
  notas: string;
}): Promise<number> {
  const api = await getClient();
  const now = new Date();
  const ts = `${ymdInTZ(now)} ${new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)}`;

  const res = await api.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET_REGISTROS}!A:I`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [ts, reg.usuario, reg.fecha, reg.tipo, reg.minutos, reg.calorias, reg.evidencia, reg.estatus, reg.notas],
      ],
    },
  });

  // updatedRange ej: "Registros!A57:I57"
  const updated = res.data.updates?.updatedRange || '';
  const match = updated.match(/!A(\d+):/);
  return match ? parseInt(match[1], 10) : 0;
}
