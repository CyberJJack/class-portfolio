/*
 * Lightweight light-reveal motion for Jack, made for this portfolio.
 * Visual references: crimson topology, a splitting light line and metal feathers.
 * No third-party animation code or assets. Canvas 2D keeps the drawing compact;
 * the character stays on one persistent video layer throughout the handoff.
 */
(() => {
  'use strict';

  const instances = new WeakMap();
  const SESSION_KEY = 'jack-seamless-line-v1';
  const DEFAULTS = Object.freeze({
    speed: 0.6,
    intensity: 0.75,
    density: 24,
    dpr: 1.5,
    color: '#e32c45',
    introDuration: 2000,
    interactive: false,
    autoplayIntro: true
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function safeOptions(previous, partial) {
    const options = { ...previous };
    if (!partial || typeof partial !== 'object') return options;
    const limits = { speed: [0.1, 1.5], intensity: [0, 1], density: [0, 24], dpr: [1, 1.5], introDuration: [1800, 8000] };
    Object.keys(limits).forEach(key => {
      if (Number.isFinite(partial[key])) options[key] = clamp(partial[key], ...limits[key]);
    });
    ['interactive', 'autoplayIntro'].forEach(key => {
      if (typeof partial[key] === 'boolean') options[key] = partial[key];
    });
    if (typeof partial.color === 'string' && /^#[\da-f]{6}$/i.test(partial.color)) options.color = partial.color;
    options.density = Math.round(options.density);
    return options;
  }

  function mount(container, initialOptions = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element || element.nodeType !== 1) return null;
    if (instances.has(element)) return instances.get(element);

    const createdCanvas = element.tagName !== 'CANVAS' && !element.querySelector('canvas');
    const canvas = element.tagName === 'CANVAS' ? element : element.querySelector('canvas') || element.appendChild(document.createElement('canvas'));
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return null;
    const lightReveal = window.JackRavenOverlay ? window.JackRavenOverlay.create({ count: 24 }) : null;
    const wordmarkImage = new Image();
    wordmarkImage.onload = () => { if (lightReveal) lightReveal.setImage(wordmarkImage); };
    const mediaConfig = window.JackPortfolioMedia || {};
    wordmarkImage.src = mediaConfig.wordmarkPath || './jack-wordmark.webp?v=seamless-line-1';
    canvas.setAttribute('aria-hidden', 'true');

    let options = safeOptions(DEFAULTS, {
      ...(Number.isFinite(mediaConfig.overlayDuration) ? { introDuration: mediaConfig.overlayDuration * 1000 } : {}),
      ...initialOptions
    });
    const overlay = document.getElementById('intro-overlay');
    const introCanvas = document.getElementById('intro-canvas');
    const introContext = introCanvas && introCanvas.getContext('2d', { alpha: true });
    const characterVideo = document.getElementById('intro-character-video');
    const video = window.JackVideoIntro?.create(characterVideo);
    const overlayStart = Number.isFinite(mediaConfig.overlayStart) ? Math.max(0, mediaConfig.overlayStart * 1000) : 3700;
    const loadTimeout = Number.isFinite(mediaConfig.loadTimeout) ? Math.max(2000, mediaConfig.loadTimeout * 1000) : 8000;
    const skipButton = document.getElementById('skip-intro');
    const pauseIntroButton = document.getElementById('pause-intro');
    const replayButton = document.getElementById('replay-intro');
    const toggleButton = document.getElementById('toggle-motion');
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cleanups = [];
    let reduced = reduceQuery.matches;
    let paused = false;
    let destroyed = false;
    let width = 1;
    let height = 1;
    let ratio = 1;
    let lastFrame = 0;
    let frame = 0;
    let introParticles = [];
    let introWidth = 1;
    let introHeight = 1;
    let introFontSize = 1;
    let introActive = false;
    let introElapsed = 0;
    let introVideoMode = false;
    let tailElapsed = 0;
    let stalledElapsed = 0;
    let lastMediaTime = 0;
    let introTimer = 0;
    let previouslyFocused = null;

    function listen(target, name, handler, settings) {
      if (!target) return;
      target.addEventListener(name, handler, settings);
      cleanups.push(() => target.removeEventListener(name, handler, settings));
    }

    function watchMedia(query, handler) {
      if (query.addEventListener) listen(query, 'change', handler);
      else {
        query.addListener(handler);
        cleanups.push(() => query.removeListener(handler));
      }
    }

    function syncToggle() {
      document.body.classList.toggle('motion-paused', paused);
      if (toggleButton) {
        toggleButton.textContent = reduced ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion';
        toggleButton.setAttribute('aria-pressed', String(paused || reduced));
        toggleButton.disabled = reduced;
      }
      if (pauseIntroButton) {
        pauseIntroButton.textContent = paused ? 'Resume' : 'Pause';
        pauseIntroButton.setAttribute('aria-pressed', String(paused));
      }
    }

    function resizeHero() {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, options.dpr);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawHero(0);
    }

    function drawHero() {
      // Background life comes from the compositor-only CSS float. Keeping this
      // surface clear removes the old persistent flock and its idle RAF work.
      context.clearRect(0, 0, width, height);
    }

    function resizeIntro() {
      if (!introCanvas || !introContext) return;
      introWidth = Math.max(1, window.innerWidth);
      introHeight = Math.max(1, window.innerHeight);
      const introRatio = Math.min(window.devicePixelRatio || 1, options.dpr);
      introCanvas.width = Math.round(introWidth * introRatio);
      introCanvas.height = Math.round(introHeight * introRatio);
      introContext.setTransform(introRatio, 0, 0, introRatio, 0, 0);
      introFontSize = Math.min(introWidth * 0.31, introHeight * 0.43, 330);
      introParticles = [{ ready: true }];
    }

    function drawIntro(elapsed) {
      const duration = options.introDuration;
      const name = document.getElementById('hero-wordmark');
      const bounds = name ? name.getBoundingClientRect() : null;
      if (elapsed < 0) {
        introContext.clearRect(0, 0, introWidth, introHeight);
        overlay.dataset.introState = 'character';
        return;
      }
      const cue = elapsed / duration * (lightReveal?.duration || 2);
      const state = cue < 0.35 ? 'line' : cue < 1.05 ? 'revealing' : cue < 2 ? 'departing' : 'complete';
      if (overlay.dataset.introState !== state) overlay.dataset.introState = state;
      if (lightReveal) lightReveal.render(introContext, cue, {
        width: introWidth, height: introHeight,
        wordWidth: Math.min(introWidth * 0.62, 1000),
        finalX: bounds ? bounds.left + bounds.width / 2 : introWidth * 0.28,
        finalY: bounds ? bounds.top + bounds.height / 2 : introHeight * 0.3,
        finalWidth: bounds ? bounds.width : introWidth * 0.35
      });
      else {
        introContext.clearRect(0, 0, introWidth, introHeight);
        introContext.fillStyle = '#e32c45'; introContext.font = `900 ${introFontSize}px Arial, sans-serif`;
        introContext.textAlign = 'center'; introContext.textBaseline = 'middle';
        introContext.fillText('Jack', introWidth / 2, introHeight * 0.48);
      }
      // Finish on the same frame the name reaches its destination. The
      // persistent character layer is untouched; only the UI becomes visible.
      if (elapsed >= duration) finishIntro();
    }

    function armSafetyTimer() {
      window.clearTimeout(introTimer);
      introTimer = 0;
      if (!introActive || paused || document.hidden) return;
      // Decoding failures must never trap visitors behind the black opening.
      // Pause/visibility suspension restart this bound without advancing a shot.
      const remaining = introVideoMode
        ? overlayStart + options.introDuration + loadTimeout - introElapsed
        : options.introDuration - introElapsed;
      introTimer = window.setTimeout(finishIntro, Math.max(100, remaining + 150));
    }

    function sampleIntro(delta) {
      if (!introVideoMode) {
        introElapsed += delta * 1000;
        return introElapsed;
      }
      const sample = video.sample();
      if (sample.status === 'failed') {
        // Autoplay rejection or an unavailable file keeps the light/name layer
        // usable without substituting an unrelated looping background clip.
        introVideoMode = false;
        introElapsed = 0;
        document.body.classList.add('video-holding');
        overlay.dataset.videoState = 'fallback';
        armSafetyTimer();
        return 0;
      }
      if (sample.status === 'ended') {
        tailElapsed += delta * 1000;
        introElapsed = (sample.duration || sample.time) * 1000 + tailElapsed;
        document.body.classList.add('video-holding');
        overlay.dataset.videoState = 'holding';
      } else {
        introElapsed = sample.time * 1000;
        stalledElapsed = sample.time > lastMediaTime + 0.001 ? 0 : stalledElapsed + delta * 1000;
        lastMediaTime = sample.time;
        if (stalledElapsed >= loadTimeout) {
          // A stalled network is treated like a failed video, not a long black
          // screen. The source is paused, then the short name cue proceeds.
          video.stop();
          if (characterVideo) characterVideo.hidden = true;
          introVideoMode = false;
          introElapsed = 0;
          overlay.dataset.videoState = 'fallback';
          document.body.classList.add('video-holding');
          armSafetyTimer();
          return 0;
        }
      }
      return introElapsed - overlayStart;
    }

    function restoreIntroFocus() {
      if (!overlay || !overlay.contains(document.activeElement)) return;
      const target = previouslyFocused && previouslyFocused !== document.body && document.contains(previouslyFocused) ? previouslyFocused : replayButton;
      if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
    }

    function finishIntro() {
      document.body.classList.add('intro-complete');
      document.body.classList.add('video-holding');
      document.body.dataset.introState = 'complete';
      window.dispatchEvent(new CustomEvent('jack:intro-complete'));
      if (!overlay) return;
      const hadIntro = introActive;
      introActive = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      // A natural completion keeps this exact decoded end frame in place.
      // An interrupted close-up must reveal the matching final poster instead.
      if (characterVideo && video?.sample().status !== 'ended') characterVideo.hidden = true;
      video?.stop();
      window.clearTimeout(introTimer);
      if (hadIntro) restoreIntroFocus();
      overlay.hidden = true;
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.dataset.introState = 'complete';
      overlay.style.opacity = '';
      if (introContext) introContext.clearRect(0, 0, introWidth, introHeight);
    }

    function markSeen() {
      try { window.sessionStorage.setItem(SESSION_KEY, 'seen'); } catch (_) { /* Storage is optional. */ }
    }

    function wasSeen() {
      try { return window.sessionStorage.getItem(SESSION_KEY) === 'seen'; } catch (_) { return false; }
    }

    function replayIntro() {
      if (destroyed || reduced || !overlay || !introCanvas || !introContext || document.hidden) return false;
      if (introActive) finishIntro();
      previouslyFocused = document.activeElement;
      // Replay's button can be below the fold. Match the final name to the
      // same top-of-page coordinates used for the first visit.
      window.scrollTo?.({ top: 0, left: 0, behavior: 'instant' });
      try { resizeIntro(); } catch (_) { finishIntro(); return false; }
      if (!introParticles.length) return false;
      markSeen();
      // Replay is an explicit request to play the complete sequence. Resume
      // the shared clock as well as media, including Pause → Skip → Replay.
      paused = false;
      syncToggle();
      introActive = true;
      document.body.classList.remove('intro-complete');
      document.body.classList.remove('video-holding');
      document.body.dataset.introState = 'running';
      introElapsed = 0;
      tailElapsed = 0;
      stalledElapsed = 0;
      lastMediaTime = 0;
      lastFrame = 0;
      introVideoMode = Boolean(video?.start());
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      overlay.dataset.introState = 'assembling';
      overlay.dataset.videoState = introVideoMode ? 'playing' : 'fallback';
      overlay.style.opacity = '1';
      // Restart the CSS fail-safe on explicit replay, even within the same task.
      overlay.classList.remove('is-active');
      void overlay.offsetWidth;
      overlay.classList.add('is-active');
      armSafetyTimer();
      drawIntro(introVideoMode ? -overlayStart : 0);
      schedule();
      return true;
    }

    function schedule() {
      if (destroyed || frame || document.hidden) return;
      if (!paused && !reduced && introActive) frame = window.requestAnimationFrame(tick);
    }

    function tick(now) {
      frame = 0;
      if (destroyed || document.hidden || paused || reduced) return;
      const realDelta = lastFrame ? Math.max(0, (now - lastFrame) / 1000) : 0;
      lastFrame = now;
      if (introActive) drawIntro(sampleIntro(realDelta));
      schedule();
    }

    const controller = {
      updateOptions(partial) {
        if (destroyed) return;
        options = safeOptions(options, partial);
        resizeHero();
        if (introActive) {
          resizeIntro();
          // A changed duration retimes the exit without restarting the video.
          const remaining = options.introDuration + (introVideoMode ? overlayStart : 0) - introElapsed;
          if (remaining <= 0) finishIntro();
          else armSafetyTimer();
        }
        schedule();
      },
      pause() {
        if (destroyed) return;
        paused = true;
        video?.pause();
        window.clearTimeout(introTimer);
        introTimer = 0;
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        syncToggle();
      },
      resume() {
        if (destroyed) return;
        paused = false;
        lastFrame = 0;
        if (introActive && introVideoMode && !document.hidden) video?.resume();
        armSafetyTimer();
        syncToggle();
        schedule();
      },
      replayIntro,
      destroy() {
        if (destroyed) return;
        finishIntro();
        destroyed = true;
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        cleanups.forEach(cleanup => cleanup());
        video?.destroy();
        context.clearRect(0, 0, width, height);
        if (createdCanvas) canvas.remove();
        instances.delete(element);
      }
    };
    instances.set(element, controller);

    listen(skipButton, 'click', finishIntro);
    listen(pauseIntroButton, 'click', () => paused ? controller.resume() : controller.pause());
    listen(replayButton, 'click', replayIntro);
    listen(toggleButton, 'click', () => paused ? controller.resume() : controller.pause());
    listen(document, 'keydown', event => {
      if (event.key === 'Escape' && introActive && !event.defaultPrevented) {
        event.preventDefault();
        finishIntro();
      }
    });
    listen(document, 'visibilitychange', () => {
      document.body.classList.toggle('motion-suspended', document.hidden);
      lastFrame = 0;
      if (document.hidden) {
        video?.pause();
        window.clearTimeout(introTimer);
        introTimer = 0;
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      } else {
        if (introActive && introVideoMode && !paused) video?.resume();
        armSafetyTimer();
        schedule();
      }
    });
    listen(window, 'resize', () => {
      if (!window.ResizeObserver) resizeHero();
      if (introActive) resizeIntro();
    }, { passive: true });
    watchMedia(reduceQuery, event => {
      reduced = event.matches;
      lastFrame = 0;
      if (reduced) {
        finishIntro();
        drawHero(0);
      }
      syncToggle();
      schedule();
    });
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(resizeHero);
      resizeObserver.observe(canvas);
      cleanups.push(() => resizeObserver.disconnect());
    }
    resizeHero();
    syncToggle();
    if (replayButton && reduced) replayButton.disabled = true;
    watchMedia(reduceQuery, () => {
      if (replayButton) replayButton.disabled = reduced;
    });
    if (reduced || wasSeen() || !options.autoplayIntro) finishIntro();
    else replayIntro();
    schedule();
    return controller;
  }

  window.JackMotion = Object.freeze({ mount });
  function boot() {
    const surface = document.getElementById('hero-motion');
    if (surface) window.jackMotion = mount(surface);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
