// @ts-nocheck
// Lógica de UI portada del Index.html original (Apps Script -> Next.js).
// Las llamadas a google.script.run fueron reemplazadas por el módulo ./api
// (que llama a Cloud Functions de Firebase, con fallback a modo demo).
import confetti from 'canvas-confetti';
import * as api from './api';
import { requirePin, isPinSessionValid } from './pin';

export function initGymApp() {
  if (typeof window === 'undefined') return;
  if (window.__gymInited) return;
  window.__gymInited = true;

  // —————————————————————————————————————————————————
  // STATE
  // —————————————————————————————————————————————————
  let usersList = [];
  let rankingData = [];
  let monthlyRankingData = [];
  let prevRankingData = [];
  let activeRankTab = 'semana';
  let monthlyLoaded = false;
  let selectedUser = '';
  const STORAGE_KEY = 'gymAppUser_v2';

  const phrasesBank = {
    urgency: [
      '¡No te quedes atrás! Hoy es tu oportunidad.',
      'La multa duele más que el gym. ¡Muévete!',
      'Tu equipo te necesita. Dale con todo hoy.',
      'Queda poco tiempo. Cada minuto cuenta.',
    ],
    normal: [
      'La disciplina es el puente entre metas y logros.',
      'Tu única competencia es quien eras ayer.',
      'El sudor de hoy es la fuerza de mañana.',
      'Pequeños pasos, grandes resultados.',
      'Transforma tus excusas en esfuerzo.',
      'No pares hasta sentirte orgulloso de ti.',
    ],
    celebration: [
      '¡Ya cumpliste la semana! Ahora rompe récords.',
      'Semana SÓLIDA. Imparable.',
      '¡Así se hace el reto! Sigue construyendo.',
      'Leyenda en progreso. No pares.',
    ]
  };

  function getAdaptivePhrase() {
    const userEntry = rankingData.find(r => r.nombre === selectedUser);
    const dias = userEntry ? userEntry.dias : 0;
    const now = new Date();
    const dayNorm = now.getDay() === 0 ? 7 : now.getDay();
    const daysLeft = 8 - dayNorm;
    const needed = 4 - dias;
    let pool;
    if (dias >= 4) pool = phrasesBank.celebration;
    else if (needed > 0 && daysLeft <= needed) pool = phrasesBank.urgency;
    else pool = phrasesBank.normal;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function updateGreetingPhrase() {
    const el = $('greetPhrase');
    if (el) el.textContent = getAdaptivePhrase();
  }

  const animeIntroPhrases = [
    "TU ESFUERZO CONSTANTE TIENE RESULTADOS INCREÍBLES.<br>SIGUE ASÍ.",
    "LA DISCIPLINA DE HOY ES TU FUERZA DE MAÑANA.",
    "NO HAY LÍMITES PARA TU POTENCIAL.<br>¡A ROMPERLA!",
    "CADA DÍA MÁS FUERTE.<br>CADA DÍA MÁS INVENCIBLE."
  ];

  // —————————————————————————————————————————————————
  // UTILS
  // —————————————————————————————————————————————————
  const $ = (id) => document.getElementById(id);
  const vibrate = (ms = 25) => { if (navigator.vibrate) navigator.vibrate(ms); };

  // —— Haptic patterns diferenciados ——
  function haptic(type) {
    if (!navigator.vibrate) return;
    const patterns = {
      light:       15,
      medium:      30,
      success:     [50, 30, 100],
      error:       [30, 20, 30],
      celebration: [80, 40, 80, 40, 200],
      streak_risk: [100, 50, 100],
    };
    navigator.vibrate(patterns[type] || 15);
  }

  // —— Achievements system ——
  const ACHIEVEMENTS = {
    racha7:  { id: 'racha7',  icon: '🔥', title: 'RACHA ÉPICA',    sub: '7 días seguidos sin parar',   type: 'streak', threshold: 7  },
    racha14: { id: 'racha14', icon: '⚡', title: 'IMPARABLE',      sub: '14 días seguidos. Leyenda.',  type: 'streak', threshold: 14 },
    racha30: { id: 'racha30', icon: '👑', title: 'ÉLITE TOTAL',    sub: '30 días de racha. Histórico.',type: 'streak', threshold: 30 },
    semana4: { id: 'semana4', icon: '✅', title: 'SEMANA CUMPLIDA', sub: '4 días completados esta semana', type: 'weekly', threshold: 4 },
    semana5: { id: 'semana5', icon: '💪', title: 'MÁS QUE SUFICIENTE', sub: '5+ días esta semana. Brutal.', type: 'weekly', threshold: 5 },
  };

  let lastRankUpdate = null;
  let countdownInterval = null;
  let clockInterval = null;
  let rankUpdateInterval = null;

  function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  function showToast(msg, danger = false) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.toggle('danger', danger);
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
  }

  function animateNumber(el, target, duration = 1200, prefix = '', suffix = '') {
    const start = parseFloat(el.dataset.current || 0);
    const startTime = performance.now();
    const isFloat = target % 1 !== 0;
    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = start + (target - start) * eased;
      el.textContent = prefix + (isFloat ? value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(value)) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.dataset.current = target;
    }
    requestAnimationFrame(step);
  }

  // —————————————————————————————————————————————————
  // ACHIEVEMENT UNLOCK
  // —————————————————————————————————————————————————
  function showAchievement(ach) {
    const overlay = $('achieveOverlay');
    const card    = $('achieveCard');
    const bar     = $('achieveBar');
    if (!overlay) return;
    $('achieveIcon').textContent  = ach.icon;
    $('achieveTitle').textContent = ach.title;
    $('achieveSub').textContent   = ach.sub;
    card.classList.remove('exit');
    overlay.classList.add('show');
    haptic('celebration');
    // Countdown bar shrinks over 3.5s
    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(1)';
    requestAnimationFrame(() => {
      bar.style.transition = 'transform 3.5s linear';
      bar.style.transform = 'scaleX(0)';
    });
    setTimeout(() => {
      card.classList.add('exit');
      setTimeout(() => {
        overlay.classList.remove('show');
        card.classList.remove('exit');
      }, 380);
    }, 3500);
  }

  function checkAchievements(streak, dias) {
    if (!selectedUser) return;
    const weekKey = `${getWeekNumber(new Date())}_${new Date().getFullYear()}`;
    Object.values(ACHIEVEMENTS).forEach(ach => {
      const key = `ach_${ach.id}_${selectedUser}${ach.type === 'weekly' ? '_' + weekKey : ''}`;
      if (localStorage.getItem(key)) return;
      const reached = (ach.type === 'streak' && streak >= ach.threshold) ||
                      (ach.type === 'weekly' && dias >= ach.threshold);
      if (reached) {
        localStorage.setItem(key, '1');
        setTimeout(() => showAchievement(ach), 600);
      }
    });
  }

  // —————————————————————————————————————————————————
  // PERSONAL BEST
  // —————————————————————————————————————————————————
  function checkPersonalBest(kcal) {
    if (!selectedUser || !kcal || isNaN(kcal)) return;
    const pbKey = `pb_kcal_${selectedUser}`;
    const prev = parseFloat(localStorage.getItem(pbKey) || '0');
    const val = parseFloat(kcal);
    if (val > prev && val > 0) {
      localStorage.setItem(pbKey, val);
      showPBOverlay(val);
    }
  }

  function showPBOverlay(kcal) {
    const el = $('pbOverlay');
    const valEl = $('pbValue');
    if (!el) return;
    if (valEl) valEl.textContent = `${kcal.toLocaleString('es-MX')} kcal`;
    el.classList.remove('exit');
    el.classList.add('show');
    haptic('celebration');
    setTimeout(() => {
      el.classList.add('exit');
      setTimeout(() => { el.classList.remove('show', 'exit'); }, 420);
    }, 2500);
  }

  // —————————————————————————————————————————————————
  // LIVE CLOCK
  // —————————————————————————————————————————————————
  function startLiveClock() {
    function tick() {
      const el = $('strip-time');
      if (!el) return;
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      el.textContent = `${h}:${m}`;
    }
    tick();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(tick, 30000);
  }

  // —————————————————————————————————————————————————
  // STREAK RISK COUNTDOWN
  // —————————————————————————————————————————————————
  function startStreakCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    function updateCountdown() {
      const el = $('streakCountdown');
      if (!el) return;
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      el.textContent = `· ${h}h ${m}m`;
    }
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 60000);
  }

  function stopStreakCountdown() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    const el = $('streakCountdown');
    if (el) el.textContent = '';
  }

  // —————————————————————————————————————————————————
  // AUTO-REFRESH TIMESTAMP
  // —————————————————————————————————————————————————
  function updateRankTimestamp() {
    const el = $('rankUpdated');
    if (!el || !lastRankUpdate) return;
    const mins = Math.round((Date.now() - lastRankUpdate) / 60000);
    el.textContent = mins < 1 ? 'Actualizado justo ahora' : `Actualizado hace ${mins} min`;
  }

  function startRankUpdateTimer() {
    if (rankUpdateInterval) clearInterval(rankUpdateInterval);
    lastRankUpdate = Date.now();
    updateRankTimestamp();
    rankUpdateInterval = setInterval(updateRankTimestamp, 30000);
  }

  // —————————————————————————————————————————————————
  // RIPPLE EFFECT
  // —————————————————————————————————————————————————
  function addRipple(el, e) {
    const rect = el.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const ripple = document.createElement('div');
    ripple.className = 'ripple-fx';
    ripple.style.left = x + 'px';
    ripple.style.top  = y + 'px';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  // —————————————————————————————————————————————————
  // CARD PRESS (pressable elements)
  // —————————————————————————————————————————————————
  function setupPressables() {
    document.querySelectorAll('.pressable').forEach(el => {
      el.addEventListener('touchstart', () => el.classList.add('pressing'), { passive: true });
      el.addEventListener('touchend',   () => el.classList.remove('pressing'), { passive: true });
      el.addEventListener('touchcancel',() => el.classList.remove('pressing'), { passive: true });
    });
  }

  // —————————————————————————————————————————————————
  // SWIPE TO DISMISS (bottom sheet)
  // —————————————————————————————————————————————————
  function setupSwipeToDismiss(sheetEl, closeFn) {
    let startY = 0, currentY = 0, dragging = false;
    sheetEl.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      dragging = true;
    }, { passive: true });
    sheetEl.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      currentY = e.touches[0].clientY;
      const delta = Math.max(0, currentY - startY);
      sheetEl.style.transform = delta > 0 ? `translateY(${delta}px)` : '';
    }, { passive: true });
    sheetEl.addEventListener('touchend', () => {
      dragging = false;
      const delta = currentY - startY;
      if (delta > 90) {
        closeFn();
      } else {
        sheetEl.style.transform = '';
      }
      sheetEl.style.transition = '';
    }, { passive: true });
  }

  // —————————————————————————————————————————————————
  // CALORIE FEEDBACK
  // —————————————————————————————————————————————————
  function updateCalFeedback() {
    const fb = $('calFeedback');
    const tipo = $('tipo').value;
    const val = parseInt($('calorias').value, 10);
    if (!fb || !tipo || isNaN(val) || val <= 0) {
      if (fb) { fb.textContent = ''; fb.className = 'cal-feedback'; }
      return;
    }
    let min = tipo === 'Gimnasio' ? 500 : 550;
    if (val >= min) {
      fb.textContent = `✓ Por encima del mínimo (${min} kcal)`;
      fb.className = 'cal-feedback show ok';
    } else {
      fb.textContent = `Faltan ${min - val} kcal para el mínimo`;
      fb.className = 'cal-feedback show warn';
    }
  }

  // —————————————————————————————————————————————————
  // YOU vs LEADER CARD
  // —————————————————————————————————————————————————
  function updateVsCard() {
    const card = $('vsCard');
    if (!card || !selectedUser || !rankingData.length) {
      if (card) card.classList.remove('visible');
      return;
    }
    const userEntry   = rankingData.find(r => r.nombre === selectedUser);
    const leaderEntry = rankingData[0];
    if (!userEntry || !leaderEntry) { card.classList.remove('visible'); return; }

    const isLeader = leaderEntry.nombre === selectedUser;
    const maxDays  = Math.max(leaderEntry.dias, userEntry.dias, 1);
    const userPct  = Math.round((userEntry.dias / maxDays) * 100);
    const leadPct  = 100;

    const rows = $('vsRows');
    if (!rows) return;
    rows.innerHTML = `
      <div class="vs-row">
        <div class="vs-av you">${getInitials(selectedUser)}</div>
        <span class="vs-name">${selectedUser.split(' ')[0]}</span>
        <div class="vs-bar-track"><div class="vs-bar-fill you" style="width:${userPct}%"></div></div>
        <span class="vs-days you">${userEntry.dias}d</span>
      </div>
      ${!isLeader ? `<div class="vs-row">
        <div class="vs-av">${getInitials(leaderEntry.nombre)}</div>
        <span class="vs-name">${leaderEntry.nombre.split(' ')[0]}</span>
        <div class="vs-bar-track"><div class="vs-bar-fill" style="width:${leadPct}%"></div></div>
        <span class="vs-days">${leaderEntry.dias}d</span>
      </div>` : ''}
    `;

    const gapEl = $('vsGap');
    const badgeEl = $('vsLeaderBadge');
    if (isLeader) {
      if (gapEl) { gapEl.className = 'vs-gap is-leader'; gapEl.innerHTML = '🏆 Eres el <b>líder</b> esta semana. ¡Defiéndelo!'; }
      if (badgeEl) { badgeEl.textContent = '🥇 TÚ'; badgeEl.style.color = 'var(--gold)'; }
    } else {
      const gap = leaderEntry.dias - userEntry.dias;
      if (gapEl) { gapEl.className = 'vs-gap'; gapEl.innerHTML = `A <b>${gap} día${gap !== 1 ? 's' : ''}</b> del líder · Entrena hoy`; }
      if (badgeEl) { badgeEl.textContent = 'LÍDER'; badgeEl.style.color = ''; }
    }

    card.classList.add('visible');
  }

  // —————————————————————————————————————————————————
  // SOCIAL PROOF
  // —————————————————————————————————————————————————
  function updateSocialProof() {
    const el  = $('socialProof');
    const cnt = $('socialCount');
    if (!el || !cnt || !rankingData.length) return;
    const activos = rankingData.filter(r => r.dias >= 1).length;
    if (activos > 0) {
      animateNumber(cnt, activos, 800);
      el.classList.add('visible');
    }
  }

  // —————————————————————————————————————————————————
  // RANK BADGE & PODIUM TEASER
  // —————————————————————————————————————————————————
  function updateRankBadge() {
    const badge = $('rankBadge');
    if (!badge || !selectedUser || activeRankTab !== 'semana') { if (badge) badge.style.display = 'none'; return; }
    const idx = rankingData.findIndex(r => r.nombre === selectedUser);
    if (idx < 0) { badge.style.display = 'none'; return; }
    const pos = idx + 1;
    const labels = ['🥇', '🥈', '🥉'];
    badge.textContent = pos <= 3 ? labels[pos - 1] + ' #' + pos : '#' + pos;
    badge.style.display = 'block';
    badge.style.animation = 'none';
    void badge.offsetWidth;
    badge.style.animation = 'badge-drop 0.5s var(--spring) forwards';
  }

  function updatePodiumTeaser() {
    const tease = $('podiumTeaser');
    const title = $('podiumTeaserTitle');
    const sub   = $('podiumTeaserSub');
    if (!tease || !selectedUser || activeRankTab !== 'semana') {
      if (tease) tease.classList.remove('visible');
      return;
    }
    const idx = rankingData.findIndex(r => r.nombre === selectedUser);
    if (idx < 0) { tease.classList.remove('visible'); return; }
    const pos = idx + 1;
    if (pos <= 3) {
      if (title) title.textContent = '🏆 Estás en el podio';
      if (sub) sub.textContent = pos === 1 ? 'Eres el líder. ¡Mantén el paso!' : `Posición #${pos}. ¡Sigue empujando!`;
    } else {
      const gap = (rankingData[2] ? rankingData[2].dias : 0) - (rankingData[idx] ? rankingData[idx].dias : 0);
      if (title) title.textContent = `A ${gap > 0 ? gap + ' día' + (gap > 1 ? 's' : '') : 'poca diferencia'} del podio`;
      if (sub) sub.textContent = 'Posición #' + pos + ' · ¡Entrena hoy!';
    }
    tease.classList.add('visible');
  }

  // —————————————————————————————————————————————————
  // PROGRESS RING
  // —————————————————————————————————————————════════
  function updateProgressRing(dias) {
    const ring = $('ringFill');
    if (!ring) return;
    const pct = Math.min(dias / 4, 1);
    const circumference = 119.4; // 2π × r(19)
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference - pct * circumference;
    ring.classList.toggle('complete', dias >= 4);
  }

  // —————————————————————————————————————————————————
  // HERO SUBTITLE DINÁMICO
  // —————————————————————————————————————————————————
  function updateHeroSubtitle() {
    const sub = $('heroSub');
    if (!sub || !selectedUser) return;
    const userEntry = rankingData.find(r => r.nombre === selectedUser);
    const dias = userEntry ? userEntry.dias : 0;
    const dayNorm = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const daysLeft = 8 - dayNorm;
    const needed = 4 - dias;
    sub.classList.add('fading');
    setTimeout(() => {
      if (dias >= 4) {
        sub.textContent = '💪 Semana cumplida. Ahora busca el podio.';
      } else if (needed > 0 && daysLeft <= needed) {
        sub.textContent = `⚠ Multa de $65 en riesgo — faltan ${needed} día${needed > 1 ? 's' : ''}`;
      } else {
        sub.textContent = 'Registra tu actividad de hoy. Tu equipo te está viendo.';
      }
      sub.classList.remove('fading');
    }, 200);
  }

  // —————————————————————————————————————————————————
  // RANK PULSE ON UPDATE
  // —————————————————————————————————————————————————
  function pulseRankList() {
    const list = $('rankList');
    if (!list) return;
    list.classList.remove('just-updated');
    void list.offsetWidth;
    list.classList.add('just-updated');
    setTimeout(() => list.classList.remove('just-updated'), 1000);
  }

  // —————————————————————————————————————————————————
  // SCROLL PARALLAX EN HERO
  // —————————————————————————————————————————————————
  function setupParallax() {
    const hero = document.querySelector('.hero');
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          hero.style.setProperty('--parallax-y', (scrollY * 0.12) + 'px');
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // —————————————————————————————————————————————————
  // STATUS STRIP — pinta semana y fecha al cargar
  // —————————————————————————————————————————————————
  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  function paintStatusStrip() {
    const now = new Date();
    const weekNum = getWeekNumber(now);
    const dateFmt = now.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, '').toUpperCase();
    const wkEl = document.querySelector('#strip-week b');
    const dateEl = $('strip-date');
    if (wkEl) wkEl.textContent = String(weekNum).padStart(2, '0');
    if (dateEl) dateEl.textContent = dateFmt;
  }

  // —————————————————————————————————————————————————
  // SCROLL PROGRESS
  // —————————————————————————————————————————————————
  function setupScrollProgress() {
    const bar = $('scrollProgress');
    if (!bar) return;
    let ticking = false;
    function update() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // —————————————————————————————————————————————————
  // ACTIVITY CHIP — coordenadas para el efecto radial
  // —————————————————————————————————————————————————
  function setupActivityChipMagnet() {
    document.querySelectorAll('.activity-chip').forEach(chip => {
      chip.addEventListener('mousemove', (e) => {
        const rect = chip.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        chip.style.setProperty('--mx', x + '%');
        chip.style.setProperty('--my', y + '%');
      });
    });
  }

  // —————————————————————————————————————————————————
  // ANIME INTRO LOGIC
  // —————————————————————————————————————————————————
  function playAnimeIntro(name) {
    const firstName = name.split(' ')[0].toUpperCase();
    $('animeTitle').innerHTML = `¡BIENVENIDX,<br><span style="color:#fff">${firstName}!</span>`;

    const randPhrase = animeIntroPhrases[Math.floor(Math.random() * animeIntroPhrases.length)];
    $('animeSub').innerHTML = randPhrase;

    const introBox = $('animeIntro');

    introBox.classList.remove('active');
    void introBox.offsetWidth;
    introBox.classList.add('active');

    if (navigator.vibrate) {
      setTimeout(() => vibrate([40, 50, 40]), 100);
      setTimeout(() => vibrate(150), 400);
    }

    setTimeout(() => {
      introBox.classList.remove('active');
    }, 3600);
  }

  // —————————————————————————————————————————————————
  // INIT
  // —————————————————————————————————————————————————
  function bootstrap() {
    paintStatusStrip();
    paintCountdown();
    setupScrollProgress();
    setupActivityChipMagnet();
    setupPressables();
    setupParallax();
    startLiveClock();

    const sheet = document.getElementById('athleteSheet');
    if (sheet) setupSwipeToDismiss(sheet, closeSheet);

    const btn = $('btnSubmit');
    if (btn) btn.addEventListener('touchstart', (e) => addRipple(btn, e), { passive: true });

    const calInput = $('calorias');
    if (calInput) calInput.addEventListener('input', updateCalFeedback);

    api.obtenerUsuarios().then(onUsersLoaded);
    loadRanking();
  }

  // —————————————————————————————————————————————————
  // USERS / SHEET PICKER
  // —————————————————————————————————————————————————
  function onUsersLoaded(users) {
    usersList = users || [];
    renderSheetList(usersList);

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && usersList.includes(stored) && isPinSessionValid(stored)) {
      selectUser(stored, false);
    }
  }

  function renderSheetList(list) {
    const container = $('sheetList');
    container.innerHTML = '';
    if (!list.length) {
      container.innerHTML = '<div class="rank-empty">Sin atletas</div>';
      return;
    }
    list.forEach(name => {
      const item = document.createElement('div');
      item.className = 'sheet-item' + (name === selectedUser ? ' selected' : '');
      item.innerHTML = `
        <div class="sheet-item-av">${getInitials(name)}</div>
        <div class="sheet-item-name">${name}</div>
      `;
      item.addEventListener('click', () => {
        haptic('medium');
        requirePin(name).then((ok) => {
          if (ok) { selectUser(name, true); closeSheet(); }
        });
      });
      container.appendChild(item);
    });
  }

  function openSheet() {
    haptic('light');
    $('sheetOverlay').classList.add('open');
    $('athleteSheet').classList.add('open');
    $('sheetSearch').value = '';
    renderSheetList(usersList);
    setTimeout(() => $('sheetSearch').focus(), 300);
  }
  function closeSheet() {
    $('sheetOverlay').classList.remove('open');
    $('athleteSheet').classList.remove('open');
  }

  $('athleteTrigger').addEventListener('click', openSheet);
  $('sheetOverlay').addEventListener('click', closeSheet);
  $('sheetClose').addEventListener('click', closeSheet);
  $('sheetSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = usersList.filter(n => n.toLowerCase().includes(q));
    renderSheetList(filtered);
  });

  function selectUser(name, save) {
    const isNewSelection = (selectedUser !== name);
    selectedUser = name;
    if (save) localStorage.setItem(STORAGE_KEY, name);

    const trigger = $('athleteTrigger');
    trigger.classList.add('has-user');
    $('athleteAvatar').textContent = getInitials(name);
    $('athleteName').textContent = name;
    $('athleteSub').textContent = 'Toca para cambiar';

    showGreeting(name);
    checkUserStatus();
    checkDebt(name);
    checkDangerZone();
    updateVsCard();
    updateRankBadge();
    updatePodiumTeaser();
    updateHeroSubtitle();

    if(isNewSelection) {
      playAnimeIntro(name);
    }
  }

  // —————————————————————————————————————————————————
  // GREETING + STREAK
  // —————————————————————————————————————————————————
  function showGreeting(user) {
    if (!user) return;
    const firstName = user.split(' ')[0];
    const box = $('greetingBox');
    box.style.display = 'block';
    box.innerHTML = `
      <h4>Hola, ${firstName}.</h4>
      <p id="greetPhrase">${getAdaptivePhrase()}</p>
      <div id="streakWrap"></div>
      <div id="semanaWrap"></div>
    `;
    api.obtenerRachaUsuario(user).then(renderStreak);
    api.obtenerSemanaUsuario(user).then(renderSemana);
  }
  function renderStreak(streak) {
    const wrap = $('streakWrap');
    if (!wrap) return;
    if (!streak || streak <= 0) {
      wrap.innerHTML = '';
      return;
    }

    // Flame tiers
    let flameClass = 'streak-flame';
    let flameIcon  = '🔥';
    if (streak >= 14) {
      flameIcon  = '🔥🔥🔥';
      flameClass += ' streak-mega streak-glow-fire';
    } else if (streak >= 7) {
      flameIcon  = '🔥🔥';
      flameClass += ' streak-glow-gold';
    } else if (streak >= 4) {
      flameIcon  = '🔥';
      flameClass += ' streak-glow-gold';
    }

    // Trophy shelf from localStorage
    const weekKey = `${getWeekNumber(new Date())}_${new Date().getFullYear()}`;
    const trophyHTML = Object.values(ACHIEVEMENTS).map((ach, i) => {
      const key = `ach_${ach.id}_${selectedUser}${ach.type === 'weekly' ? '_' + weekKey : ''}`;
      const unlocked = localStorage.getItem(key);
      return `<span class="trophy-badge ${unlocked ? '' : 'locked'}" title="${ach.title}" style="animation-delay:${i*0.07}s">${ach.icon}</span>`;
    }).join('');

    wrap.innerHTML = `
      <div class="streak">
        <span class="${flameClass}">${flameIcon}</span>
        Racha · <b>${streak} días</b>
      </div>
      <div class="trophy-shelf">${trophyHTML}</div>
    `;

    checkAchievements(streak, (rankingData.find(r => r.nombre === selectedUser) || {}).dias || 0);
  }

  // —————————————————————————————————————————————————
  // DEBT
  // —————————————————————————————————————————————————
  function checkDebt(user) {
    const debtors = ['.'];
    const modal = $('debtModal');
    if (debtors.includes(user)) {
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('show'));
    }
  }
  function closeDebt() {
    const m = $('debtModal');
    m.classList.remove('show');
    setTimeout(() => m.style.display = 'none', 300);
  }

  // —————————————————————————————————————————————————
  // STATUS HOY
  // —————————————————————————————————————————————————
  function checkUserStatus() {
    if (!selectedUser) return;

    api.verificarEstadoHoy(selectedUser).then((res) => {
      if (res && res.yaRegistro) {
        $('formCard').style.display = 'none';
        $('doneState').style.display = 'block';
        $('doneTag').textContent = 'Hoy: ' + (res.tipo || 'Registrado');
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.4 } });
        buildLateWAUrl(res.tipo);
      } else {
        $('formCard').style.display = 'block';
        $('doneState').style.display = 'none';
        updateProgress();
      }
    });
  }

  function buildLateWAUrl(tipo) {
    const fechaHoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
    let msg = `🏋️ *REPORTE RETO 2026* (Reenvío)\n`;
    msg += `👤 *Atleta:* ${selectedUser}\n`;
    msg += `📅 *Fecha:* ${fechaHoy}\n`;
    msg += `📍 *Actividad:* ${tipo}\n`;
    msg += `✅ *Actividad ya registrada en App*\n`;
    msg += `(Adjunto evidencia visual)`;
    $('btnLateWA').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
  }

  // —————————————————————————————————————————————————
  // PROGRESS
  // —————————————————————————————————————————————————
  function updateProgress() {
    const stats = rankingData.find(r => r.nombre === selectedUser);
    const dias = stats ? stats.dias : 0;
    const pct = Math.min((dias / 4) * 100, 100);
    $('heroNum').innerHTML = `${dias}<span>/4</span>`;
    const bar = $('progressBar');
    setTimeout(() => { bar.style.width = pct + '%'; }, 80);
    if (dias >= 4) bar.classList.add('complete');
    else bar.classList.remove('complete');
    updateProgressRing(dias);
  }

  // —————————————————————————————————————————————————
  // ACTIVITY CHIPS
  // —————————————————————————————————————————————————
  document.querySelectorAll('.activity-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      haptic('medium');
      document.querySelectorAll('.activity-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      $('tipo').value = chip.dataset.value;
      updateRules(chip.dataset.value);
    });
  });

  function updateRules(tipo) {
    const fb = $('calFeedback');
    if (fb) { fb.textContent = ''; fb.className = 'cal-feedback'; }
    const tag = $('ruleTag');
    const fields = $('dynamicFields');
    const honor = $('lblHonor');
    const cals = $('calorias');

    tag.style.display = 'block';

    if (tipo === 'Gimnasio') {
      tag.innerHTML = '🎯 Mínimo: <b>1:15 hrs</b> ó <b>500 kcal</b>';
      fields.classList.add('show');
      honor.style.display = 'flex';
      cals.required = true;
    } else if (tipo === 'Fuera del Gym') {
      tag.innerHTML = '🏃 Mínimo: <b>90 min / 550 kcal</b> ó <b>700 kcal en menos de 2 hrs</b>';
      fields.classList.add('show');
      honor.style.display = 'flex';
      cals.required = true;
    } else {
      tag.innerHTML = '🌴 Día de descanso o justificante médico — sin requisitos.';
      fields.classList.remove('show');
      honor.style.display = 'none';
      $('evidencia').checked = false;
      $('lblHonor').classList.remove('active');
      cals.required = false;
      cals.value = '';
      $('horas').value = '';
      $('minutos').value = '';
    }
  }

  // Honor toggle
  $('lblHonor').addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT') return;
    e.preventDefault();
    haptic('light');
    const chk = $('evidencia');
    chk.checked = !chk.checked;
    $('lblHonor').classList.toggle('active', chk.checked);
  });

  // —————————————————————————————————————————————————
  // SUBMIT
  // —————————————————————————————————————————————————
  $('gymForm').addEventListener('submit', (e) => {
    e.preventDefault();
    haptic('medium');

    const tipo = $('tipo').value;
    if (!selectedUser) { showToast('Primero elige tu nombre', true); openSheet(); return; }
    if (!tipo) { showToast('Elige tu actividad de hoy', true); return; }

    const isActive = (tipo === 'Gimnasio' || tipo === 'Fuera del Gym');
    if (isActive && !$('evidencia').checked) { showToast('Confirma el código de honor', true); return; }
    if (isActive && !$('calorias').value) { showToast('Indica las calorías', true); return; }

    const btn = $('btnSubmit');
    const content = $('submitContent');
    btn.disabled = true;
    content.innerHTML = '<span style="display:inline-flex;align-items:center;gap:10px;">Guardando<span class="streak-flame">·</span></span>';

    const horas = ($('horas').value || '0').padStart(2, '0');
    const minutos = ($('minutos').value || '0').padStart(2, '0');
    const tiempo = `${horas}:${minutos}`;
    const calorias = $('calorias').value;
    const notas = $('notas').value;

    const datos = {
      usuario: selectedUser,
      tipo,
      tiempo,
      calorias,
      notas,
      evidencia: $('evidencia').checked ? 'SÍ' : 'NO'
    };

    api.guardarRegistro(datos).then((res) => {
      btn.disabled = false;
      content.innerHTML = 'Registrar actividad <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      if (res.success) onSubmitSuccess({ tipo, tiempo, calorias, notas });
      else showToast(res.message || 'Error al guardar', true);
    });
  });

  function onSubmitSuccess({ tipo, tiempo, calorias, notas }) {
    // Personal best check
    if (calorias) checkPersonalBest(parseFloat(calorias));

    haptic('success');

    // Confetti explosion
    const duration = 2400;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#d4ff00', '#ffffff', '#4ade80'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#d4ff00', '#ffffff', '#4ade80'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // Build WA message
    const fechaHoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
    let msg = `🏋️ *REPORTE RETO 2026*\n`;
    msg += `👤 *Atleta:* ${selectedUser}\n`;
    msg += `📅 *Fecha:* ${fechaHoy}\n`;
    msg += `📍 *Actividad:* ${tipo}\n`;
    if (tipo !== 'Vacaciones' && tipo !== 'Incapacidad') {
      msg += `⏱ *Tiempo:* ${tiempo} hrs\n`;
      msg += `🔥 *Calorías:* ${calorias} kcal\n`;
      if (notas) msg += `📝 *Notas:* ${notas}\n`;
      msg += `\n✅ *CÓDIGO DE HONOR CONFIRMADO*\nAdjunto mis 3 fotos (Inicio, Reloj, Fin).`;
    } else {
      msg += `🌴 *Estado:* Descanso / Justificante\n`;
      if (notas) msg += `📝 *Detalle:* ${notas}`;
    }
    $('btnWA').href = 'https://wa.me/?text=' + encodeURIComponent(msg);

    // Show modal
    const m = $('waModal');
    m.style.display = 'flex';
    requestAnimationFrame(() => m.classList.add('show'));

    loadRanking();
    $('gymForm').reset();
    document.querySelectorAll('.activity-chip').forEach(c => c.classList.remove('selected'));
    $('lblHonor').classList.remove('active');
    $('ruleTag').style.display = 'none';
    $('dynamicFields').classList.remove('show');
  }

  function closeWA() {
    haptic('light');
    const m = $('waModal');
    m.classList.remove('show');
    setTimeout(() => {
      m.style.display = 'none';
      checkUserStatus();
    }, 300);
  }

  // —————————————————————————————————————————————————
  // RANKING
  // —————————————————————————————————————————————————
  function loadRanking() {
    api.obtenerRanking().then(renderRanking);
    api.obtenerRankingAnterior().then((d) => { prevRankingData = d.ranking || []; });
    api.obtenerActividadReciente().then(renderActivityTicker);
  }

  function renderRanking(data) {
    rankingData = data.ranking || [];
    animateNumber($('boteMonto'), data.bote || 0, 1200);
    renderRankingData(rankingData, null);
    updatePeriodLabel('semana');
    startRankUpdateTimer();
    updateSocialProof();
    pulseRankList();
    if (selectedUser) {
      checkDangerZone();
      updateGreetingPhrase();
      checkSemanaPerfecta();
      updateVsCard();
      updateRankBadge();
      updatePodiumTeaser();
      updateHeroSubtitle();
      updateProgress();
    }
  }

  function renderRankingData(data, slideClass) {
    const list = $('rankList');
    if (!data || !data.length) {
      list.innerHTML = '<li class="rank-empty">Sin datos — sé el primero.</li>';
      return;
    }
    if (slideClass) list.classList.add(slideClass);
    list.innerHTML = '';
    const prevMap = {};
    prevRankingData.forEach((r, i) => { prevMap[r.nombre] = i + 1; });
    data.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'rank-row';
      if (i === 0) { li.classList.add('top-1'); li.style.animation = 'pop 0.7s var(--spring) 0.28s both'; }
      else if (i === 1) { li.classList.add('top-2'); li.style.animation = 'rise 0.6s var(--spring-soft) 0.14s both'; }
      else if (i === 2) { li.classList.add('top-3'); li.style.animation = 'rise 0.55s var(--soft) 0.07s both'; }
      else { li.style.animationDelay = (i * 0.06) + 's'; }
      if (r.nombre === selectedUser) li.classList.add('you');
      const daysClass = r.dias >= 4 ? 'rank-days full' : 'rank-days';
      const prevPos = prevMap[r.nombre];
      let trend = '';
      if (prevPos) {
        const diff = prevPos - (i + 1);
        if (diff > 0) trend = `<span class="trend up">↑${diff}</span>`;
        else if (diff < 0) trend = `<span class="trend down">↓${Math.abs(diff)}</span>`;
      }
      li.innerHTML = `
        <div class="rank-pos">${i + 1}${trend}</div>
        <div class="rank-av">${getInitials(r.nombre)}</div>
        <div class="rank-info">
          <div class="rank-name">${r.nombre}</div>
          <div class="rank-cal">${(r.calorias || 0).toLocaleString('es-MX')} kcal</div>
        </div>
        <div class="${daysClass}">${r.dias}d</div>
      `;
      list.appendChild(li);
    });
    if (slideClass) {
      requestAnimationFrame(() => {
        list.classList.remove(slideClass);
        list.classList.add('slide-in-active');
        setTimeout(() => list.classList.remove('slide-in-active'), 300);
      });
    }
    if (selectedUser && activeRankTab === 'semana') updateProgress();
  }

  function switchRankTab(tab) {
    if (tab === activeRankTab) return;
    haptic('light');
    const goingRight = (tab === 'mes');
    $('tabSemana').classList.toggle('active', tab === 'semana');
    $('tabSemana').setAttribute('aria-selected', tab === 'semana');
    $('tabMes').classList.toggle('active', tab === 'mes');
    $('tabMes').setAttribute('aria-selected', tab === 'mes');
    activeRankTab = tab;
    const list = $('rankList');
    list.classList.add(goingRight ? 'slide-out-left' : 'slide-out-right');
    setTimeout(() => {
      list.classList.remove('slide-out-left', 'slide-out-right');
      if (tab === 'semana') {
        renderRankingData(rankingData, 'slide-in-right');
        updatePeriodLabel('semana');
      } else {
        if (monthlyLoaded) {
          renderRankingData(monthlyRankingData, 'slide-in-left');
          updatePeriodLabel('mes');
        } else {
          list.innerHTML = `
            <li class="rank-skeleton"><div class="sk sk-pos"></div><div class="sk sk-av"></div><div class="sk sk-text"></div><div class="sk sk-tag"></div></li>
            <li class="rank-skeleton"><div class="sk sk-pos"></div><div class="sk sk-av"></div><div class="sk sk-text"></div><div class="sk sk-tag"></div></li>
            <li class="rank-skeleton"><div class="sk sk-pos"></div><div class="sk sk-av"></div><div class="sk sk-text"></div><div class="sk sk-tag"></div></li>`;
          api.obtenerRankingMensual()
            .then((data) => {
              monthlyRankingData = data.ranking || [];
              monthlyLoaded = true;
              renderRankingData(monthlyRankingData, 'slide-in-left');
              updatePeriodLabel('mes');
            })
            .catch(() => showToast('Error al cargar ranking mensual', true));
        }
      }
    }, 220);
  }

  function updatePeriodLabel(tab) {
    const el = $('rankPeriodLabel');
    if (!el) return;
    if (tab === 'semana') {
      el.textContent = `Semana ${String(getWeekNumber(new Date())).padStart(2,'0')} · ${new Date().getFullYear()}`;
    } else {
      const label = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      el.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    }
    el.style.animation = 'none'; void el.offsetWidth;
    el.style.animation = 'rise 0.4s var(--soft) forwards';
  }

  function renderSemana(semana) {
    const wrap = $('semanaWrap');
    if (!wrap || !semana) return;
    const hoyStr = new Date().toISOString().slice(0,10);
    const dots = semana.map((d, i) => {
      let cls = 'week-dot-circle';
      if (d.estatus === 'CUMPLE') cls += ' cumple';
      else if (d.estatus === 'JUSTIFICADO') cls += ' justif';
      else if (d.estatus === 'NO CUMPLE') cls += ' nocumple';
      if (d.fecha === hoyStr) cls += ' hoy';
      return `<div class="week-dot">
        <div class="${cls}" style="animation-delay:${i*0.06}s"></div>
        <span class="week-dot-label">${d.dia}</span>
      </div>`;
    }).join('');
    wrap.innerHTML = `<div class="week-dots">${dots}</div>`;
  }

  function renderActivityTicker(entries) {
    if (!entries || !entries.length) return;
    const track = $('tickerTrack');
    const ticker = $('activityTicker');
    if (!track || !ticker) return;
    const icons = { 'Gimnasio':'🏋️', 'Fuera del Gym':'🏃', 'Vacaciones':'🌴', 'Incapacidad':'💊' };
    const html = [...entries, ...entries].map(e =>
      `<span class="ticker-item">
        <span class="ticker-dot"></span>
        ${icons[e.tipo] || '💪'} <span class="ticker-name">${e.nombre}</span>
        <span class="ticker-sep">·</span>
        ${e.calorias > 0 ? e.calorias + ' kcal' : e.tipo}
        <span class="ticker-sep">·</span> hace ${e.hace}
      </span>`
    ).join('');
    track.innerHTML = html;
    ticker.style.display = 'block';
  }

  function checkDangerZone() {
    const strip = $('dangerStrip');
    if (!strip || !selectedUser) return;
    const userEntry = rankingData.find(r => r.nombre === selectedUser);
    const dias = userEntry ? userEntry.dias : 0;
    const needed = 4 - dias;
    const dayNorm = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const daysLeftInclToday = 8 - dayNorm;
    if (needed > 0 && daysLeftInclToday <= needed + 1) {
      strip.style.display = 'flex';
      strip.querySelector('.danger-text').innerHTML =
        `Llevas <b>${dias} día${dias !== 1 ? 's' : ''}</b> esta semana — necesitas <b>${needed} más</b> para no multar.`;
      strip.classList.toggle('critical', daysLeftInclToday <= needed);
      requestAnimationFrame(() => strip.classList.add('show'));
      startStreakCountdown();
      haptic('streak_risk');
    } else {
      strip.classList.remove('show');
      setTimeout(() => strip.style.display = 'none', 300);
      stopStreakCountdown();
    }
  }

  function checkSemanaPerfecta() {
    if (!selectedUser) return;
    const userEntry = rankingData.find(r => r.nombre === selectedUser);
    if (!userEntry || userEntry.dias < 7) return;
    const key = `perfectWeek_${selectedUser}_${getWeekNumber(new Date())}_${new Date().getFullYear()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    triggerSemanaPerfecta();
  }

  function triggerSemanaPerfecta() {
    vibrate([80, 60, 80, 60, 200]);
    const duration = 4000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 10, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#d4ff00','#ffffff','#4ade80','#ffd84d'] });
      confetti({ particleCount: 10, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#d4ff00','#ffffff','#4ade80','#ffd84d'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    showToast('🏆 ¡SEMANA PERFECTA! 7/7 días. ¡Leyenda!');
  }

  function paintCountdown() {
    const end = new Date('2026-12-13T23:59:59-06:00');
    const now = new Date();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const strip = $('countdownStrip');
    const el = $('cdDays');
    if (!strip || !el) return;
    if (days <= 0) {
      strip.classList.add('final');
      el.textContent = '¡Hoy!';
      strip.querySelector('.cd-label').textContent = '¡Último día del reto!';
      return;
    }
    animateNumber(el, days, 1200);
    if (days <= 7) strip.classList.add('urgent');
  }

  $('refreshBtn').addEventListener('click', () => {
    haptic('medium');
    $('refreshBtn').classList.add('spin');
    monthlyLoaded = false; monthlyRankingData = [];
    activeRankTab = 'semana';
    $('tabSemana').classList.add('active'); $('tabMes').classList.remove('active');
    loadRanking();
    setTimeout(() => $('refreshBtn').classList.remove('spin'), 1000);
  });

  // —————————————————————————————————————————————————
  // KEYBOARD UX
  // —————————————————————————————————————————————————
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSheet();
      closeDebt();
      closeWA();
    }
  });

  // —————————————————————————————————————————————————
  // RULES ACCORDION
  // —————————————————————————————————————————————————
  document.querySelectorAll('.rules-summary').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic('light');
      const item = btn.closest('.rules-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.rules-item.open').forEach(it => {
        it.classList.remove('open');
        const b = it.querySelector('.rules-summary');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // —————————————————————————————————————————————————
  // SMOOTH SCROLL al "Reglas"
  // —————————————————————————————————————————————————
  const rulesLink = document.getElementById('rulesLink');
  if (rulesLink) {
    rulesLink.addEventListener('click', (e) => {
      e.preventDefault();
      haptic('light');
      const target = document.getElementById('rules');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // —————————————————————————————————————————————————
  // COUNT-UP de números en stats
  // —————————————————————————————————————————————————
  function countUpEl(el) {
    if (el.dataset.counted === '1') return;
    const target = parseFloat(el.dataset.countTo || '0');
    const dur = 1100;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      el.textContent = (target % 1 === 0) ? Math.round(value) : value.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else { el.textContent = target; el.dataset.counted = '1'; }
    }
    requestAnimationFrame(tick);
  }

  // —————————————————————————————————————————————————
  // INTERSECTION OBSERVER → reveal on scroll
  // —————————————————————————————————————————————————
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          const counters = entry.target.querySelectorAll('.rs-num-value[data-count-to]');
          counters.forEach(c => countUpEl(c));
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.classList.add('in');
      el.querySelectorAll('.rs-num-value[data-count-to]').forEach(c => {
        c.textContent = c.dataset.countTo;
      });
    });
  }
  // Exponer handlers usados por atributos onclick="" del markup
  window.switchRankTab = switchRankTab;
  window.closeDebt = closeDebt;
  window.closeWA = closeWA;

  // Arrancar (equivalente al window.onload original)
  bootstrap();
}
