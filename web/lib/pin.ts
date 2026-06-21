// Login sencillo por PIN de 4 dígitos por atleta.
// Primer ingreso: crear PIN (+ confirmación). Después: pedir PIN.
// El PIN se valida/guarda en Firebase vía ./api (con fallback demo a localStorage).
import { getPinStatus, crearPin, verificarPin } from './api';

const SESSION_DAYS = 30;
const sessionKey = (name: string) => 'pinSession_' + name;

export function isPinSessionValid(name: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(sessionKey(name));
  if (!raw) return false;
  const exp = parseInt(raw, 10);
  return !isNaN(exp) && exp > Date.now();
}

function startSession(name: string) {
  localStorage.setItem(sessionKey(name), String(Date.now() + SESSION_DAYS * 86400000));
}

export function clearPinSession(name: string) {
  localStorage.removeItem(sessionKey(name));
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function injectStyles() {
  if (document.getElementById('pin-styles')) return;
  const css = `
  .pin-overlay{position:fixed;inset:0;z-index:2000;display:none;align-items:flex-end;justify-content:center;
    background:rgba(0,0,0,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .28s var(--smooth)}
  .pin-overlay.show{display:flex;opacity:1}
  .pin-card{width:100%;max-width:440px;background:var(--surface-1);border:1px solid var(--border);
    border-bottom:none;border-radius:var(--r-xl) var(--r-xl) 0 0;padding:32px 24px calc(28px + env(safe-area-inset-bottom));
    text-align:center;transform:translateY(40px);transition:transform .4s var(--spring);box-shadow:var(--shadow-deep)}
  .pin-overlay.show .pin-card{transform:translateY(0)}
  .pin-av{width:64px;height:64px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;
    font-family:var(--display);font-weight:700;font-size:22px;color:var(--on-acc);background:var(--acc);box-shadow:var(--shadow-glow-acc)}
  .pin-title{font-family:var(--display);font-size:22px;font-weight:700;margin:0 0 6px;color:var(--text-hi)}
  .pin-sub{font-size:14px;color:var(--text-mid);margin:0 0 22px;line-height:1.4}
  .pin-dots{display:flex;gap:16px;justify-content:center;margin-bottom:14px}
  .pin-dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--border-strong);transition:all .2s var(--spring)}
  .pin-dot.filled{background:var(--acc);border-color:var(--acc);transform:scale(1.1)}
  .pin-error{min-height:20px;color:var(--danger);font-size:13px;font-weight:600;margin-bottom:10px}
  .pin-card.shake{animation:pin-shake .4s}
  @keyframes pin-shake{0%,100%{transform:translateY(0)}20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}}
  .pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:300px;margin:0 auto}
  .pin-key{height:62px;border-radius:var(--r-md);border:1px solid var(--border);background:var(--surface-2);
    color:var(--text-hi);font-family:var(--display);font-size:24px;font-weight:600;cursor:pointer;
    -webkit-tap-highlight-color:transparent;transition:transform .08s,background .15s}
  .pin-key:active{transform:scale(.93);background:var(--surface-3)}
  .pin-key.fn{font-size:14px;font-family:var(--body);font-weight:600;color:var(--text-mid)}
  `;
  const style = document.createElement('style');
  style.id = 'pin-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

type Phase = 'enter' | 'create' | 'confirm';

export function requirePin(name: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    if (typeof document === 'undefined') return resolve(false);
    if (isPinSessionValid(name)) return resolve(true);

    injectStyles();

    let status: { exists: boolean };
    try {
      status = await getPinStatus(name);
    } catch {
      status = { exists: false };
    }

    let phase: Phase = status.exists ? 'enter' : 'create';
    let buffer = '';
    let firstPin = '';

    // Construir modal
    const overlay = document.createElement('div');
    overlay.className = 'pin-overlay';
    overlay.innerHTML = `
      <div class="pin-card" role="dialog" aria-modal="true">
        <div class="pin-av">${getInitials(name)}</div>
        <h2 class="pin-title"></h2>
        <p class="pin-sub"></p>
        <div class="pin-dots">
          <div class="pin-dot"></div><div class="pin-dot"></div>
          <div class="pin-dot"></div><div class="pin-dot"></div>
        </div>
        <div class="pin-error"></div>
        <div class="pin-pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="pin-key" data-d="${n}">${n}</button>`).join('')}
          <button class="pin-key fn" data-act="cancel">Cancelar</button>
          <button class="pin-key" data-d="0">0</button>
          <button class="pin-key fn" data-act="del">Borrar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    const card = overlay.querySelector('.pin-card') as HTMLElement;
    const titleEl = overlay.querySelector('.pin-title') as HTMLElement;
    const subEl = overlay.querySelector('.pin-sub') as HTMLElement;
    const errEl = overlay.querySelector('.pin-error') as HTMLElement;
    const dots = Array.from(overlay.querySelectorAll('.pin-dot')) as HTMLElement[];

    function renderHeader() {
      const first = name.split(' ')[0];
      if (phase === 'enter') {
        titleEl.textContent = `Hola, ${first}`;
        subEl.textContent = 'Ingresa tu PIN de 4 dígitos para entrar.';
      } else if (phase === 'create') {
        titleEl.textContent = '¡La app se actualizó!';
        subEl.innerHTML = `Ahora, <b>${first}</b>, crea un PIN de 4 dígitos para tu inicio de sesión.`;
      } else {
        titleEl.textContent = 'Confirma tu PIN';
        subEl.textContent = 'Vuelve a ingresar los 4 dígitos.';
      }
    }

    function renderDots() {
      dots.forEach((d, i) => d.classList.toggle('filled', i < buffer.length));
    }

    function shake(msg: string) {
      errEl.textContent = msg;
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    }

    function close(result: boolean) {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
      resolve(result);
    }

    async function complete() {
      if (phase === 'create') {
        firstPin = buffer;
        buffer = '';
        phase = 'confirm';
        errEl.textContent = '';
        renderHeader();
        renderDots();
        return;
      }
      if (phase === 'confirm') {
        if (buffer !== firstPin) {
          buffer = '';
          firstPin = '';
          phase = 'create';
          renderHeader();
          renderDots();
          shake('Los PIN no coinciden. Inténtalo de nuevo.');
          return;
        }
        try {
          const res = await crearPin(name, buffer);
          if (res.success) {
            startSession(name);
            close(true);
          } else {
            buffer = '';
            renderDots();
            shake(res.message || 'No se pudo guardar el PIN.');
          }
        } catch {
          buffer = '';
          renderDots();
          shake('Error de conexión.');
        }
        return;
      }
      // phase === 'enter'
      try {
        const res = await verificarPin(name, buffer);
        if (res.success) {
          startSession(name);
          close(true);
        } else {
          buffer = '';
          renderDots();
          shake(res.message || 'PIN incorrecto.');
        }
      } catch {
        buffer = '';
        renderDots();
        shake('Error de conexión.');
      }
    }

    overlay.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.pin-key') as HTMLElement | null;
      if (!target) return;
      if (navigator.vibrate) navigator.vibrate(12);
      const act = target.dataset.act;
      if (act === 'cancel') return close(false);
      if (act === 'del') {
        buffer = buffer.slice(0, -1);
        renderDots();
        return;
      }
      const d = target.dataset.d;
      if (d == null || buffer.length >= 4) return;
      errEl.textContent = '';
      buffer += d;
      renderDots();
      if (buffer.length === 4) setTimeout(complete, 120);
    });

    renderHeader();
    renderDots();
  });
}
