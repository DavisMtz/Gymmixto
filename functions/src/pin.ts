// PIN de 4 dígitos por atleta, guardado HASHEADO en Firestore (colección `pins`).
import { getFirestore } from 'firebase-admin/firestore';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

function hashPin(pin: string, salt: string): string {
  return createHash('sha256').update(salt + ':' + pin).digest('hex');
}

export async function pinStatus(usuario: string): Promise<{ exists: boolean }> {
  const db = getFirestore();
  const doc = await db.collection('pins').doc(usuario).get();
  return { exists: doc.exists };
}

export async function createPin(usuario: string, pin: string): Promise<{ success: boolean; message?: string }> {
  if (!/^\d{4}$/.test(pin)) return { success: false, message: 'El PIN debe ser de 4 dígitos.' };
  const db = getFirestore();
  const ref = db.collection('pins').doc(usuario);
  const doc = await ref.get();
  if (doc.exists) return { success: false, message: 'Este atleta ya tiene un PIN.' };
  const salt = randomBytes(16).toString('hex');
  await ref.set({ pinHash: hashPin(pin, salt), salt, createdAt: Date.now() });
  return { success: true };
}

export async function checkPin(usuario: string, pin: string): Promise<{ success: boolean; message?: string }> {
  if (!/^\d{4}$/.test(pin)) return { success: false, message: 'PIN inválido.' };
  const db = getFirestore();
  const doc = await db.collection('pins').doc(usuario).get();
  if (!doc.exists) return { success: false, message: 'No hay PIN para este atleta.' };
  const { pinHash, salt } = doc.data() as { pinHash: string; salt: string };
  const a = Buffer.from(hashPin(pin, salt));
  const b = Buffer.from(pinHash);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  return ok ? { success: true } : { success: false, message: 'PIN incorrecto.' };
}
