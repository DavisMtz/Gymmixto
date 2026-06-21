// Sincroniza la Hoja de Google (fuente de verdad) hacia Firestore (caché de lectura).
// Se ejecuta de forma programada y también on-demand. El espejo es idempotente:
// cada registro/pago usa un id determinístico basado en su posición en la Hoja.
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { readUsuarios, readRegistros, readPagos } from './sheets';

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

async function replaceCollection(
  db: Firestore,
  name: string,
  docs: { id: string; data: any }[]
): Promise<void> {
  const col = db.collection(name);
  const existing = await col.listDocuments();
  const keepIds = new Set(docs.map((d) => d.id));

  // Borrar lo que ya no existe en la Hoja.
  const toDelete = existing.filter((ref) => !keepIds.has(ref.id));
  await commitInChunks(db, toDelete.map((ref) => ({ type: 'delete' as const, ref })));

  // Crear/actualizar.
  await commitInChunks(
    db,
    docs.map((d) => ({ type: 'set' as const, ref: col.doc(d.id), data: d.data }))
  );
}

type Op = { type: 'set'; ref: FirebaseFirestore.DocumentReference; data: any } | { type: 'delete'; ref: FirebaseFirestore.DocumentReference };

async function commitInChunks(db: Firestore, ops: Op[]): Promise<void> {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + 450)) {
      if (op.type === 'delete') batch.delete(op.ref);
      else batch.set(op.ref, op.data);
    }
    await batch.commit();
  }
}

export async function syncSheetToFirestore(): Promise<{ usuarios: number; registros: number; pagos: number }> {
  const db = getFirestore();
  const [usuarios, registros, pagos] = await Promise.all([readUsuarios(), readRegistros(), readPagos()]);

  await replaceCollection(
    db,
    'usuarios',
    usuarios.map((u, i) => ({ id: slug(u.nombre) || `u${i}`, data: u }))
  );
  await replaceCollection(
    db,
    'registros',
    registros.map((r, i) => ({ id: `r${i}`, data: r }))
  );
  await replaceCollection(
    db,
    'pagos',
    pagos.map((p, i) => ({ id: `p${i}`, data: p }))
  );

  const counts = { usuarios: usuarios.length, registros: registros.length, pagos: pagos.length };
  await db.doc('meta/sync').set({ lastSync: Date.now(), counts });
  return counts;
}
