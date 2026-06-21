// Markup portado verbatim del Index.html original (mismo diseño/IDs).
export const MARKUP = `

  <!-- SCROLL PROGRESS -->
  <div class="scroll-progress" id="scrollProgress"></div>

  <!-- ANIME INTRO ANIMATION -->
  <div id="animeIntro" class="anime-intro">
    <div class="anime-bg-lines"></div>
    <div class="anime-slash"></div>
    <div class="anime-content">
      <h1 class="anime-title" id="animeTitle">¡BIENVENIDX!</h1>
      <p class="anime-subtitle" id="animeSub">TU ESFUERZO TIENE RESULTADOS INCREÍBLES.<br>SIGUE ASÍ.</p>
    </div>
  </div>

  <div class="app">
  <!-- HEADER -->
  <header class="header">
    <div class="brand">
      <div class="brand-mark">R</div>
      <div class="brand-text">
        <b>RETO 2026</b>
        <span>Disciplina · Constancia</span>
      </div>
    </div>
    <div class="header-pills">
      <a href="#rules" class="rules-link" id="rulesLink">
        Reglas
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
      </a>
      <div class="live-pill">
        <span class="live-dot"></span> Activo
      </div>
    </div>
  </header>

  <!-- STATUS STRIP (NEW) -->
  <div class="status-strip">
    <span id="strip-week">SEM <b>—</b></span>
    <span class="ss-divider"></span>
    <span id="strip-date">—</span>
    <span class="ss-divider"></span>
    <span id="strip-time">—</span>
    <span class="ss-divider"></span>
    <span>EST · MX</span>
  </div>

  <!-- COUNTDOWN -->
  <div class="countdown-strip" id="countdownStrip">
    <div class="cd-num" id="cdDays">—</div>
    <div class="cd-info">
      <span class="cd-label">Días para<br>el fin del reto</span>
      <span class="cd-sub">13 DIC 2026</span>
    </div>
  </div>

  <!-- HERO CARD -->
  <section class="hero stagger">
    <div class="rank-badge" id="rankBadge">#—</div>
    <div class="hero-eyebrow"><span class="ed-num"></span>Tu reto · Esta semana</div>
    <h1 class="hero-title">Más fuerte<br><em>que ayer.</em></h1>
    <p class="hero-sub" id="heroSub">Registra tu actividad de hoy. Tu equipo te está viendo.</p>

    <div class="hero-stat">
      <div class="hero-stat-num" id="heroNum">
        0<span>/4</span>
      </div>
      <div class="hero-stat-label">Días<br>completados</div>
    </div>
    <div class="progress-track">
      <div class="progress-fill" id="progressBar"></div>
    </div>
  </section>

  <!-- ATHLETE PICKER -->
  <button class="athlete-trigger pressable ripple-host" id="athleteTrigger" type="button" aria-label="Seleccionar atleta">
    <div class="athlete-avatar-wrap">
      <div class="athlete-avatar" id="athleteAvatar">?</div>
      <svg class="ring-svg" viewBox="0 0 44 44">
        <circle class="ring-bg" cx="22" cy="22" r="19"/>
        <circle class="ring-fill" id="ringFill" cx="22" cy="22" r="19"/>
      </svg>
    </div>
    <div class="athlete-info">
      <b id="athleteName">Selecciona tu nombre</b>
      <span id="athleteSub">Toca para elegir</span>
    </div>
    <svg class="athlete-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
  </button>

  <!-- YOU vs LEADER CARD -->
  <div class="vs-card" id="vsCard">
    <div class="vs-header">
      <span class="vs-label">Tu posición · Esta semana</span>
      <span class="vs-leader-badge" id="vsLeaderBadge">LÍDER</span>
    </div>
    <div id="vsRows"></div>
    <div class="vs-gap" id="vsGap"></div>
  </div>

  <!-- GREETING -->
  <div class="greeting" id="greetingBox"></div>

  <!-- DANGER ZONE -->
  <div class="danger-strip" id="dangerStrip" style="display:none">
    <span class="danger-icon">⚠️</span>
    <span class="danger-text"></span>
    <span class="streak-countdown" id="streakCountdown"></span>
  </div>

  <!-- DONE STATE -->
  <div class="done-state" id="doneState">
    <div class="done-circle">
      <div class="done-circle-inner">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
    <h3>Misión <em>cumplida.</em></h3>
    <p>Hoy ya registraste tu actividad. Mañana otra vez.</p>
    <div class="done-tag" id="doneTag">—</div>

    <a href="#" id="btnLateWA" target="_blank" class="btn-wa" style="margin-top:24px;">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      Reenviar evidencia
    </a>
  </div>

  <!-- FORM CARD -->
  <section class="card" id="formCard">
    <div class="card-head">
      <h2 class="card-title">Registro de Hoy</h2>
    </div>

    <form id="gymForm" novalidate>
      <!-- Activity grid -->
      <div class="activity-grid" id="activityGrid">
        <button type="button" class="activity-chip" data-value="Gimnasio">
          <span class="ac-icon">🏋️</span>
          <div class="ac-name">Gimnasio</div>
          <div class="ac-tag">Entrenamiento</div>
        </button>
        <button type="button" class="activity-chip" data-value="Fuera del Gym">
          <span class="ac-icon">🏃</span>
          <div class="ac-name">Outdoor</div>
          <div class="ac-tag">Fuera del gym</div>
        </button>
        <button type="button" class="activity-chip" data-value="Vacaciones">
          <span class="ac-icon">🌴</span>
          <div class="ac-name">Vacaciones</div>
          <div class="ac-tag">Descanso</div>
        </button>
        <button type="button" class="activity-chip" data-value="Incapacidad">
          <span class="ac-icon">🏥</span>
          <div class="ac-name">Incapacidad</div>
          <div class="ac-tag">Salud</div>
        </button>
      </div>
      <input type="hidden" id="tipo" value="">

      <!-- Rule tag -->
      <div class="rule-tag" id="ruleTag"></div>

      <!-- Dynamic fields -->
      <div class="dynamic-fields" id="dynamicFields">
        <div class="row-2">
          <div class="field">
            <label class="field-label" for="horas">Horas</label>
            <div class="field-with-unit" data-unit="hrs">
              <input type="number" id="horas" placeholder="0" min="0" max="10" inputmode="numeric">
            </div>
          </div>
          <div class="field">
            <label class="field-label" for="minutos">Minutos</label>
            <div class="field-with-unit" data-unit="min">
              <input type="number" id="minutos" placeholder="0" min="0" max="59" inputmode="numeric">
            </div>
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="calorias">Calorías quemadas</label>
          <div class="field-with-unit" data-unit="kcal">
            <input type="number" id="calorias" placeholder="0" min="0" inputmode="numeric">
          </div>
          <div class="cal-feedback" id="calFeedback"></div>
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="notas">Notas (opcional)</label>
        <textarea id="notas" rows="2" placeholder="¿Algún récord, sensación o detalle?"></textarea>
      </div>

      <!-- Honor toggle -->
      <label class="honor" id="lblHonor" for="evidencia">
        <input type="checkbox" id="evidencia" style="display:none;">
        <div class="honor-switch"></div>
        <div class="honor-text">
          <b>Código de Honor</b>
          Confirmo que envié las 3 fotos (Inicio, Reloj, Fin) al grupo de WhatsApp.
        </div>
      </label>

      <button type="submit" class="submit-btn" id="btnSubmit">
        <span class="submit-btn-content" id="submitContent">
          Registrar actividad
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </button>
    </form>
  </section>

  <!-- JACKPOT -->
  <div class="jackpot">
    <div class="jackpot-eyebrow">Bote acumulado</div>
    <div class="jackpot-amount">
      <sup>$</sup><span id="boteMonto">0.00</span>
    </div>
    <div class="jackpot-meta">Pesos · Premio del reto</div>
  </div>

  <!-- RANKING -->
  <section class="card reveal" data-reveal>
    <div class="card-head">
      <h2 class="card-title">Clasificación</h2>
      <button class="refresh-btn" id="refreshBtn" type="button" aria-label="Refrescar ranking">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 0115.36-6.36L21 8M21 3v5h-5M21 12a9 9 0 01-15.36 6.36L3 16M3 21v-5h5"/></svg>
      </button>
    </div>
    <div class="rank-tabs" role="tablist">
      <button class="rank-tab active" id="tabSemana" role="tab" aria-selected="true" onclick="switchRankTab('semana')">Esta semana</button>
      <button class="rank-tab" id="tabMes" role="tab" aria-selected="false" onclick="switchRankTab('mes')">Este mes</button>
    </div>
    <div class="rank-period-label" id="rankPeriodLabel"></div>
    <span class="rank-updated" id="rankUpdated"></span>
    <div class="rank-viewport">
      <ul class="rank-list" id="rankList">
        <li class="rank-skeleton"><div class="sk sk-pos"></div><div class="sk sk-av"></div><div class="sk sk-text"></div><div class="sk sk-tag"></div></li>
        <li class="rank-skeleton"><div class="sk sk-pos"></div><div class="sk sk-av"></div><div class="sk sk-text"></div><div class="sk sk-tag"></div></li>
        <li class="rank-skeleton"><div class="sk sk-pos"></div><div class="sk sk-av"></div><div class="sk sk-text"></div><div class="sk sk-tag"></div></li>
      </ul>
    </div>
    <!-- PODIUM TEASER -->
    <div class="podium-teaser" id="podiumTeaser">
      <div class="podium-teaser-text">
        <b id="podiumTeaserTitle">—</b>
        <span id="podiumTeaserSub">—</span>
      </div>
      <button class="podium-teaser-cta" onclick="document.getElementById('formCard').scrollIntoView({behavior:'smooth'})">Entrenar →</button>
    </div>
  </section>

  <!-- SOCIAL PROOF -->
  <div class="social-proof" id="socialProof">
    <span class="social-proof-dot"></span>
    <span><b id="socialCount">—</b> atletas cumplieron esta semana</span>
  </div>

  <!-- ACTIVITY TICKER -->
  <div class="activity-ticker" id="activityTicker" style="display:none">
    <div class="ticker-track" id="tickerTrack"></div>
  </div>

  <!-- REGLAMENTO -->
  <section class="rules-card reveal" id="rules" data-reveal>
    <div class="rules-eyebrow">El Reglamento</div>
    <h2 class="rules-title">GYM RETO <em>2026</em></h2>

    <div class="rules-dates">
      <div class="rules-date">
        <span>Inicia</span>
        <b>12 ENE 2026</b>
      </div>
      <div class="rules-date-sep"></div>
      <div class="rules-date">
        <span>Termina</span>
        <b>13 DIC 2026</b>
      </div>
    </div>

    <!-- Stats grid -->
    <div class="rules-stats reveal-stagger" data-reveal>
      <div class="rs-block">
        <div class="rs-num"><span class="rs-num-value" data-count-to="4">0</span><span class="rs-num-suffix">+</span></div>
        <div class="rs-label">Días/sem<br>mínimos</div>
      </div>
      <div class="rs-block">
        <div class="rs-num"><span class="rs-num-prefix">$</span><span class="rs-num-value" data-count-to="65">0</span></div>
        <div class="rs-label">MXN<br>multa semanal</div>
      </div>
      <div class="rs-block">
        <div class="rs-num"><span class="rs-num-value" data-count-to="3">0</span></div>
        <div class="rs-label">Ganadores<br>50·30·20</div>
      </div>
    </div>

    <!-- Accordion -->
    <div class="rules-accordion reveal-stagger" data-reveal>

      <div class="rules-item">
        <button type="button" class="rules-summary" aria-expanded="false">
          <span class="rs-icon">⏱️</span>
          <span class="rs-name">Tiempos</span>
          <span class="rs-arrow">›</span>
        </button>
        <div class="rs-content"><div>
          <div class="rs-body">
            <ol>
              <li>Mantén constancia con un mínimo de <b>4 días de entrenamiento</b> a la semana.</li>
              <li>La semana corre de <b>lunes a domingo</b>.</li>
              <li>En el GYM: mínimo <b>1:15 hrs</b> ó <b>500 kcal</b> por sesión.</li>
              <li>Fuera del gym: <b>90 min</b> de movimiento + <b>550 kcal</b>, o <b>700 kcal</b> antes de las 2 hrs.</li>
              <li>Bonus: completar un <b>quinto día</b> = +1 punto de desempate.</li>
            </ol>
          </div>
        </div></div>
      </div>

      <div class="rules-item">
        <button type="button" class="rules-summary" aria-expanded="false">
          <span class="rs-icon">📸</span>
          <span class="rs-name">Evidencias</span>
          <span class="rs-arrow">›</span>
        </button>
        <div class="rs-content"><div>
          <div class="rs-body">
            <ol>
              <li>Check-in en la app cada día para que cuente.</li>
              <li>Captura <b>3 momentos clave con fecha y hora</b>: inicio, reloj y cierre — compártelos juntos en el grupo de WA.</li>
              <li>Cada evidencia debe mostrar <b>tu rostro y la seña diaria</b>.</li>
              <li>Captura el <b>ambiente</b> de tu actividad — evita fondos de pared, techo, piso o cama.</li>
              <li>Si tu reloj falla: respaldo con <b>video de mín. 2 minutos en cámara rápida</b>.</li>
            </ol>
          </div>
        </div></div>
      </div>

      <div class="rules-item">
        <button type="button" class="rules-summary" aria-expanded="false">
          <span class="rs-icon">💸</span>
          <span class="rs-name">Penalizaciones</span>
          <span class="rs-arrow">›</span>
        </button>
        <div class="rs-content"><div>
          <div class="rs-body">
            <ol>
              <li>Si no cumples la meta semanal: <b>$65.00 MXN</b> al fondo.</li>
              <li>Cuentas claras: paga a más tardar el <b>último día del mes</b> penalizado.</li>
              <li>Atraso > 15 días: <b>+$10 MXN</b> por semana penalizada como apoyo al fondo del equipo.</li>
              <li>Transferencia + comprobante en el grupo. Motivo: <code>GYM Semana X</code>.</li>
              <li><b>No se aceptan pagos en efectivo.</b></li>
            </ol>
          </div>
        </div></div>
      </div>

      <div class="rules-item">
        <button type="button" class="rules-summary" aria-expanded="false">
          <span class="rs-icon">🌴</span>
          <span class="rs-name">Vacaciones</span>
          <span class="rs-arrow">›</span>
        </button>
        <div class="rs-content"><div>
          <div class="rs-body">
            <ol>
              <li>Tienes <b>13 días anuales</b> para recargar energías, organízalos como quieras.</li>
              <li>Solicítalas por WA <b>dentro del mes</b> en que las vas a disfrutar.</li>
            </ol>
          </div>
        </div></div>
      </div>

      <div class="rules-item">
        <button type="button" class="rules-summary" aria-expanded="false">
          <span class="rs-icon">🏥</span>
          <span class="rs-name">Incapacidades</span>
          <span class="rs-arrow">›</span>
        </button>
        <div class="rs-content"><div>
          <div class="rs-body">
            <ol>
              <li>Las ausencias por motivos médicos se validan con la <b>fecha del justificante médico</b> — el sistema reconoce tu situación de salud.</li>
            </ol>
          </div>
        </div></div>
      </div>

      <div class="rules-item">
        <button type="button" class="rules-summary" aria-expanded="false">
          <span class="rs-icon">👋</span>
          <span class="rs-name">Bajas</span>
          <span class="rs-arrow">›</span>
        </button>
        <div class="rs-content"><div>
          <div class="rs-body">
            <ol>
              <li>Si decides darte de baja anticipadamente: <b>$100 MXN</b> por cada mes pendiente para finalizar el reto, como apoyo al fondo común.</li>
            </ol>
          </div>
        </div></div>
      </div>

      <div class="rules-item">
        <button type="button" class="rules-summary" aria-expanded="false">
          <span class="rs-icon">🏆</span>
          <span class="rs-name">Ganadores</span>
          <span class="rs-arrow">›</span>
        </button>
        <div class="rs-content"><div>
          <div class="rs-body">
            <p>El bote acumulado se reparte entre los <b>3 campeones de constancia</b> con menor número de penalizaciones:</p>
            <div class="podium">
              <div class="podium-row top-1">
                <span class="podium-pos">🥇</span>
                <span class="podium-place">1er Lugar</span>
                <span class="podium-pct">50%</span>
              </div>
              <div class="podium-row top-2">
                <span class="podium-pos">🥈</span>
                <span class="podium-place">2do Lugar</span>
                <span class="podium-pct">30%</span>
              </div>
              <div class="podium-row top-3">
                <span class="podium-pos">🥉</span>
                <span class="podium-place">3er Lugar</span>
                <span class="podium-pct">20%</span>
              </div>
            </div>
          </div>
        </div></div>
      </div>

    </div>

    <!-- Closing quote -->
    <blockquote class="rules-quote">
      No te detengas cuando estés cansado,<br><em>detente cuando hayas terminado.</em>
    </blockquote>
  </section>

  <!-- SIGNATURE FOOTER (Alex X DMA) -->
  <section class="signature reveal" data-reveal>
    <div class="sig-eyebrow">Reto exclusivo</div>

    <div class="sig-mark">
      <span class="sig-name">Alex</span>
      <div class="sig-x" aria-label="x">
        <div class="sig-x-bg"></div>
        <span class="sig-x-icon">×</span>
      </div>
      <span class="sig-name"><em>DMA</em></span>
    </div>

    <p class="sig-tagline">
      Reto <em>mixto</em>
    </p>


    <!-- Modified sig-copy to include the mini logo next to "Logidma.com" -->
    <div class="sig-copy" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
      ©
      <img src="https://github.com/DavisMtz/logidma-assets/blob/main/Logidma%20logo.png?raw=true" alt="Logidma logo" style="height: 1.2em; vertical-align: middle;">
      Logidma.com
    </div>
  </section>

</div>

<!-- ATHLETE BOTTOM SHEET -->
<div class="sheet-overlay" id="sheetOverlay"></div>
<div class="sheet" id="athleteSheet">
  <div class="sheet-handle"></div>
  <div class="sheet-head">
    <h3>Elige tu nombre</h3>
    <button class="sheet-close" id="sheetClose" type="button" aria-label="Cerrar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>
  <div class="sheet-search">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
    <input type="text" id="sheetSearch" placeholder="Buscar atleta..." autocomplete="off">
  </div>
  <div class="sheet-list" id="sheetList"></div>
</div>

<!-- DEBT MODAL -->
<div class="modal-overlay" id="debtModal">
  <div class="modal">
    <div class="modal-icon danger">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
    </div>
    <h2>Tienes pago pendiente</h2>
    <p>Multa de <b style="color:var(--danger);">$65.00 MXN</b> por no cumplir la asistencia mínima de la semana pasada.</p>

    <div class="bank-card">
      <div class="bank-eyebrow">Spin by Oxxo · Alexa Bautista Medina</div>
      <div class="bank-num">4217 4701 7680 3837</div>
      <div class="bank-amt">$65.00 MXN</div>
    </div>

    <button class="btn-dark" type="button" onclick="closeDebt()">Entendido, voy a pagar</button>
  </div>
</div>

<!-- WHATSAPP MODAL -->
<div class="modal-overlay" id="waModal">
  <div class="modal">
    <div class="modal-icon success">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h2>¡Excelente trabajo!</h2>
    <p>Tu actividad quedó registrada. Ahora envía la evidencia al grupo de WhatsApp.</p>

    <a href="#" id="btnWA" target="_blank" class="btn-wa">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      Enviar evidencia
    </a>
    <button class="btn-secondary" type="button" onclick="closeWA()">Cerrar y ver ranking</button>
  </div>
</div>

<!-- TOAST -->
<div class="toast" id="toast"></div>


  <!-- ACHIEVEMENT UNLOCK OVERLAY -->
  <div id="achieveOverlay" class="achieve-overlay">
    <div class="achieve-card" id="achieveCard">
      <div class="achieve-shine"></div>
      <span class="achieve-eyebrow">Logro desbloqueado</span>
      <div class="achieve-icon-wrap" id="achieveIcon">🏆</div>
      <div class="achieve-title-text" id="achieveTitle">TÍTULO</div>
      <div class="achieve-sub-text" id="achieveSub">Descripción</div>
      <div class="achieve-bar" id="achieveBar"></div>
    </div>
  </div>

  <!-- PERSONAL BEST OVERLAY -->
  <div class="pb-overlay" id="pbOverlay">
    ⚡ NUEVO RÉCORD
    <span id="pbValue"></span>
  </div>

`;
