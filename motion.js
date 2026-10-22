/* One native alpha-video surface becomes the static scene wordmark.
 * Only its parent transform moves; neither the source rectangle nor the
 * persistent character background changes during the UI handoff.
 */
(() => {
  'use strict';
  const instances = new WeakMap();
  const SESSION_KEY = 'jack-alpha-name-v7';

  function mount(container, options = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element || instances.has(element)) return instances.get(element) || null;
    const config = window.JackPortfolioMedia;
    const overlay = document.getElementById('intro-overlay');
    const stage = document.getElementById('intro-name-stage');
    const nameElement = document.getElementById('intro-name-video');
    const still = document.getElementById('intro-name-still');
    const target = document.getElementById('hero-wordmark-image');
    const characterElement = document.getElementById('intro-character-video');
    const replay = document.getElementById('replay-intro');
    const toggle = document.getElementById('toggle-motion');
    const pauseButton = document.getElementById('pause-intro');
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!config || !overlay || !stage || !nameElement || !still || !target) return null;

    // Safari's native HEVC-alpha path is more reliable than its VP9-alpha path.
    const ua = navigator.userAgent || '';
    const appleWebKit = /iP(ad|hone|od)/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua)) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const source = config.nameSources[appleWebKit ? 'hevc' : 'webm'];
    stage.dataset.codec = appleWebKit ? 'hevc' : 'webm';
    still.src = source.still;
    let stillReady = false;
    const stillDecoded = (typeof still.decode === 'function' ? still.decode() : new Promise((resolve, reject) => {
      if (still.complete && still.naturalWidth) resolve();
      else { still.onload = resolve; still.onerror = reject; }
    })).then(() => { stillReady = Boolean(still.naturalWidth); }).catch(() => {});
    const cleanups = [];
    let destroyed = false;
    let reduced = reduceQuery.matches;
    let paused = false;
    let active = false;
    // A run that reaches a phone layout keeps a static name, even if the
    // viewport widens again. Explicit desktop Replay can start a new flight.
    let directName = window.innerWidth <= 700;
    let nameStarted = false;
    let departed = false;
    let staticName = false;
    let frame = 0;
    let safety = 0;
    let generation = 0;
    let departure = null;
    let priorFocus = null;
    let progressKey = '';
    let progressAt = 0;
    const character = window.JackVideoIntro.create(characterElement, {
      onEnded: () => { document.body.classList.add('video-holding'); },
      onError: () => { if (active) startName(); }
    });
    const name = window.JackVideoIntro.create(nameElement, {
      path: source.path,
      onPlaying: () => { if (nameStarted && !staticName && !directName) stage.hidden = false; },
      onEnded: () => handoffStill(),
      onError: () => { if (nameStarted) skipIntro(); }
    });

    function listen(node, event, fn, settings) {
      node?.addEventListener(event, fn, settings);
      cleanups.push(() => node?.removeEventListener(event, fn, settings));
    }
    function syncControls() {
      document.body.classList.toggle('motion-paused', paused);
      toggle.textContent = reduced ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion';
      toggle.setAttribute('aria-pressed', String(paused || reduced));
      toggle.disabled = reduced;
      pauseButton.textContent = paused ? 'Resume' : 'Pause';
      pauseButton.setAttribute('aria-pressed', String(paused));
      replay.disabled = reduced;
    }
    function cancelFrame() { if (frame) window.cancelAnimationFrame(frame); frame = 0; }
    function clearSafety() { window.clearTimeout(safety); safety = 0; }
    function armSafety() {
      clearSafety();
      if (destroyed || paused || document.hidden || (!active && (!nameStarted || staticName))) return;
      // A native video stalled after UI reveal still needs a bounded tail fallback.
      safety = window.setTimeout(skipIntro, (config.loadTimeout + 4) * 1000);
    }
    function cancelDeparture() {
      if (!departure) return;
      departure.onfinish = null;
      departure.cancel();
      departure = null;
    }
    function useStaticName() {
      directName = true;
      generation++;
      cancelDeparture();
      name.stop();
      nameStarted = false;
      staticName = true;
      stage.hidden = true;
      nameElement.hidden = true;
      still.hidden = true;
      stage.dataset.surface = 'static';
      document.body.classList.remove('alpha-name-ready');
      progressKey = '';
      clearSafety();
    }
    function finalTransform() {
      const rect = target.getBoundingClientRect();
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height || !rect.width || !target.naturalWidth) return null;
      const sourceScale = Math.min(width / config.nameSize.width, height / config.nameSize.height);
      const planeLeft = (width - config.nameSize.width * sourceScale) / 2;
      const planeTop = (height - config.nameSize.height * sourceScale) / 2;
      const scale = rect.width / (config.nameCrop.width * sourceScale);
      const x = rect.left + window.scrollX - scale * (planeLeft + config.nameCrop.left * sourceScale);
      const y = rect.top + window.scrollY - scale * (planeTop + config.nameCrop.top * sourceScale);
      return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
    function alignFinal() {
      const transform = finalTransform();
      if (transform) stage.style.transform = transform;
      return Boolean(transform);
    }
    function revealUI() {
      const hadIntro = active;
      active = false;
      departed = true;
      cancelFrame();
      document.body.classList.add('intro-complete', 'video-holding');
      document.body.dataset.introState = 'complete';
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.dataset.introState = 'complete';
      stage.dataset.phase = 'scene';
      if (!directName) alignFinal();
      try { sessionStorage.setItem(SESSION_KEY, 'seen'); } catch (_) { /* Optional storage. */ }
      if (hadIntro && overlay.contains(document.activeElement)) {
        const focus = priorFocus && priorFocus !== document.body && document.contains(priorFocus) ? priorFocus : replay;
        focus?.focus({ preventScroll: true });
      }
      if (hadIntro) window.dispatchEvent(new CustomEvent('jack:intro-complete'));
      armSafety();
    }
    function handoffStill() {
      const run = generation;
      // Both elements retain identical dimensions, parent transform and placement.
      // Leave the last native frame up if the still has not finished decoding.
      stillDecoded.then(() => {
        if (destroyed || run !== generation || directName || !nameStarted || staticName || !stillReady) return;
        staticName = true;
        still.hidden = false;
        nameElement.hidden = true;
        stage.dataset.surface = 'still';
        clearSafety();
      });
    }
    function depart() {
      if (directName || departure || departed || !active) return;
      const destination = finalTransform();
      if (!destination) return;
      document.body.classList.add('alpha-name-ready');
      stage.dataset.phase = 'departing';
      overlay.dataset.introState = 'departing';
      const run = generation;
      if (!stage.animate) { stage.style.transform = destination; revealUI(); return; }
      departure = stage.animate([
        { transform: getComputedStyle(stage).transform }, { transform: destination }
      ], { duration: config.departureDuration, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'both' });
      const current = departure;
      current.onfinish = () => {
        if (destroyed || run !== generation || current !== departure) return;
        stage.style.transform = destination;
        cancelDeparture();
        revealUI();
      };
      if (paused || document.hidden) current.pause();
    }
    function startName() {
      if (!active || nameStarted || paused || document.hidden) return;
      if (directName) {
        useStaticName();
        revealUI();
        return;
      }
      nameStarted = true;
      stage.dataset.surface = 'video';
      stage.dataset.phase = 'assembling';
      overlay.dataset.introState = 'assembling';
      name.start();
      armSafety();
    }
    function schedule() {
      if (!frame && active && !destroyed && !paused && !document.hidden && !departure) frame = window.requestAnimationFrame(tick);
    }
    function tick(now) {
      frame = 0;
      if (!active || destroyed || paused || document.hidden) return;
      const shot = character.sample();
      if (!nameStarted && (shot.time >= config.overlayStart || ['ended', 'failed'].includes(shot.status))) startName();
      const sample = nameStarted ? name.sample() : shot;
      const key = `${nameStarted}:${sample.status}:${sample.time.toFixed(3)}`;
      if (key !== progressKey) { progressKey = key; progressAt = now; }
      else if (now - progressAt > config.loadTimeout * 1000) { skipIntro(); return; }
      if (nameStarted && sample.time >= config.nameDepartAt) depart();
      schedule();
    }
    function skipIntro() {
      if (destroyed) return;
      generation++;
      cancelDeparture();
      character.stop();
      name.stop();
      if (character.sample().status !== 'ended') characterElement.hidden = true;
      nameStarted = false;
      staticName = true;
      stage.hidden = true;
      document.body.classList.remove('alpha-name-ready');
      clearSafety();
      revealUI();
    }
    function replayIntro() {
      if (destroyed || reduced || document.hidden) return false;
      generation++;
      cancelDeparture();
      cancelFrame();
      clearSafety();
      character.stop();
      name.stop();
      priorFocus = document.activeElement;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      paused = false;
      active = true;
      directName = window.innerWidth <= 700;
      departed = staticName = nameStarted = false;
      progressKey = '';
      progressAt = 0;
      document.body.classList.remove('intro-complete', 'video-holding', 'alpha-name-ready');
      document.body.dataset.introState = 'running';
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      overlay.dataset.introState = 'character';
      stage.hidden = true;
      still.hidden = true;
      nameElement.hidden = true;
      stage.style.transform = 'none';
      stage.dataset.phase = 'waiting';
      syncControls();
      character.start();
      armSafety();
      schedule();
      return true;
    }
    function pauseMedia() {
      character.pause();
      name.pause();
      departure?.pause();
      cancelFrame();
      clearSafety();
    }
    function resumeMedia() {
      if (paused || reduced || document.hidden) return;
      // Mobile reveals the UI before the character's native tail has ended.
      // That same surface must still resume after Pause or tab suspension.
      if (active || directName) character.resume();
      if (nameStarted && !staticName) name.resume();
      departure?.play();
      progressKey = '';
      armSafety();
      schedule();
    }
    const controller = {
      pause() { if (!destroyed) { paused = true; pauseMedia(); syncControls(); } },
      resume() { if (!destroyed) { paused = false; syncControls(); resumeMedia(); } },
      replayIntro,
      updateOptions(partial) { if (partial && typeof partial.autoplayIntro === 'boolean') options.autoplayIntro = partial.autoplayIntro; },
      destroy() {
        if (destroyed) return;
        skipIntro();
        destroyed = true;
        clearSafety();
        cancelFrame();
        cleanups.forEach(remove => remove());
        character.destroy();
        name.destroy();
        instances.delete(element);
      }
    };
    instances.set(element, controller);
    listen(document.getElementById('skip-intro'), 'click', skipIntro);
    listen(pauseButton, 'click', () => paused ? controller.resume() : controller.pause());
    listen(toggle, 'click', () => paused ? controller.resume() : controller.pause());
    listen(replay, 'click', replayIntro);
    listen(document, 'keydown', event => {
      if (event.key === 'Escape' && active && !event.defaultPrevented) { event.preventDefault(); skipIntro(); }
    });
    listen(document, 'visibilitychange', () => {
      document.body.classList.toggle('motion-suspended', document.hidden);
      if (document.hidden) pauseMedia(); else resumeMedia();
    });
    listen(window, 'resize', () => {
      if (window.innerWidth <= 700) {
        useStaticName();
        const shot = character.sample();
        if (active && !paused && !document.hidden &&
            (shot.time >= config.overlayStart || ['ended', 'failed'].includes(shot.status))) revealUI();
        else { armSafety(); schedule(); }
        return;
      }
      if (departed && !stage.hidden) alignFinal();
      else if (departure) {
        // Keep the currently displayed transform, then finish against new bounds.
        const current = getComputedStyle(stage).transform;
        cancelDeparture();
        stage.style.transform = current;
        depart();
      }
    }, { passive: true });
    const reduceChanged = event => {
      reduced = event.matches;
      if (reduced) skipIntro();
      syncControls();
    };
    if (reduceQuery.addEventListener) listen(reduceQuery, 'change', reduceChanged);
    else { reduceQuery.addListener(reduceChanged); cleanups.push(() => reduceQuery.removeListener(reduceChanged)); }
    listen(target, 'load', () => { if (departed && !stage.hidden) alignFinal(); });
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === 'seen'; } catch (_) { /* Optional storage. */ }
    syncControls();
    if (reduced || seen || options.autoplayIntro === false) skipIntro(); else replayIntro();
    return controller;
  }
  window.JackMotion = Object.freeze({ mount });
  function boot() { window.jackMotion = mount('#hero-motion'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
