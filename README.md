# RETO 2026 — Reto del Gym

Aplicación web (PWA) del reto del gym, migrada de **Google Apps Script** a una app
**Next.js + Firebase**, manteniendo el mismo diseño y la lógica original.

- **Fuente de verdad:** Google Sheets (atletas, registros, pagos).
- **Caché de lectura:** Firestore (para que la app sea rápida).
- **Login:** PIN de 4 dígitos por atleta (se crea en el primer ingreso).
- **Hosting:** Firebase Hosting bajo `fit.logidma.com`.

## Estructura

```
web/                 App Next.js (App Router, exportación estática → Firebase Hosting)
  app/               layout, página, globals.css (CSS del diseño original)
  components/        GymApp + markup portado del Index.html
  lib/               firebase, api (callables), pin (login), gym-ui (lógica de UI)
functions/           Cloud Functions (Node 24)
  src/rules.ts       Lógica de negocio (portada de codigo.gs)
  src/sheets.ts      Cliente Google Sheets API (service account)
  src/sync.ts        Sincronización Hoja → Firestore
  src/api.ts         Callables (reemplazan google.script.run)
  src/pin.ts         PIN hasheado en Firestore
firebase.json, firestore.rules, .firebaserc
codigo.gs, Index.html  Versión original (referencia histórica)
```

## Desarrollo local

Requisitos: **Node 24**.

```bash
cd web
npm install
NEXT_PUBLIC_DEMO=1 npm run dev   # modo demo con datos de ejemplo (sin backend)
```

Para correr contra Firebase real en local, usa los emuladores:

```bash
cd functions && npm install && npm run build
firebase emulators:start
```

## Configuración de Firebase (una vez)

1. Proyecto: **servicios-logidma** (ya configurado en `.firebaserc` y `web/lib/firebase.ts`).
2. Activar plan **Blaze** (requerido por las Functions que llaman a la Sheets API).
3. **Firestore** habilitado.
4. **Authentication → Sign-in method → Anónimo** habilitado (sesión base de dispositivo).
5. **Google Sheets API** habilitada en el proyecto de Google Cloud.
6. Compartir la Hoja como **Editor** con el email del service account de las Functions
   (o definir `SHEETS_SA_JSON`).
7. Variables de entorno de las Functions (`functions/.env`, ver `.env.example`):
   - `SPREADSHEET_ID` = ID de la Hoja.
   - `FUNCTIONS_REGION` = `us-central1`.

### Hojas requeridas (columnas)

- **Usuarios:** `A` Nombre · `B` Estatus (`Activo`)
- **Registros:** `timestamp, usuario, fecha, tipo, minutos, calorías, evidencia, estatus, notas`
- **Pagos:** `fecha, usuario, monto, notas`

## Despliegue

```bash
# 1. Compilar el web (genera web/out)
cd web && npm install && npm run build && cd ..

# 2. Desplegar functions, firestore y hosting
firebase deploy
```

### Primera carga de datos

Tras el primer deploy, ejecuta la sincronización inicial Hoja → Firestore
(callable `syncAhora`, o espera a la sync programada que corre cada 5 minutos).

### Subdominio `fit.logidma.com`

En la consola de Firebase Hosting → **Add custom domain** → `fit.logidma.com`,
y agrega en el DNS de `logidma.com` los registros que Firebase indique.

## Cómo funciona el flujo de datos

- **Registrar actividad:** app → callable `guardarRegistro` → valida reglas →
  `appendRow` en la Hoja → write-through a Firestore.
- **Lecturas (ranking, racha, semana, bote, actividad):** desde Firestore (rápido),
  mantenido fresco por la sync programada + write-through.
- **Pagos:** se siguen registrando manualmente en la Hoja; la sync los refleja para el bote.
