/*
 * Original raven motion for Jack, made for this portfolio.
 * Visual references: crimson topology, raven flight and frosted metal.
 * No third-party animation code or assets. Canvas 2D keeps the drawing compact;
 * the only animated DOM property is the intro overlay's compositor opacity.
 */
(() => {
  'use strict';

  const instances = new WeakMap();
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const SESSION_KEY = 'jack-raven-intro-v1';
  const DEFAULTS = Object.freeze({
    speed: 0.6,
    intensity: 0.75,
    density: 38,
    dpr: 1.5,
    color: '#e32c45',
    introDuration: 2800,
    interactive: true,
    autoplayIntro: true
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, progress) => a + (b - a) * progress;
  const seed = value => {
    const number = Math.sin(value * 127.1 + 311.7) * 43758.5453;
    return number - Math.floor(number);
  };

  // Exact cubic-bezier curves from the site's motion tokens. Lookup tables keep
  // hundreds of text particles from solving the same curve on every frame.
  function makeEase(x1, y1, x2, y2) {
    const samples = new Float32Array(257);
    const axis = (t, p1, p2) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3;
    for (let index = 0; index <= 256; index++) {
      const x = index / 256;
      let low = 0;
      let high = 1;
      for (let step = 0; step < 14; step++) {
        const middle = (low + high) / 2;
        if (axis(middle, x1, x2) < x) low = middle;
        else high = middle;
      }
      samples[index] = axis((low + high) / 2, y1, y2);
    }
    return value => {
      const position = clamp(value, 0, 1) * 256;
      const index = Math.floor(position);
      return index === 256 ? 1 : lerp(samples[index], samples[index + 1], position - index);
    };
  }

  const easeOut = makeEase(0.23, 1, 0.32, 1);
  const easeInOut = makeEase(0.77, 0, 0.175, 1);

  function safeOptions(previous, partial) {
    const options = { ...previous };
    if (!partial || typeof partial !== 'object') return options;
    const limits = { speed: [0.1, 1.5], intensity: [0, 1], density: [16, 64], dpr: [1, 1.5], introDuration: [1800, 3000] };
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

  function getRGB(hex) {
    return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
  }

  function mount(container, initialOptions = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element || element.nodeType !== 1) return null;
    if (instances.has(element)) return instances.get(element);

    const createdCanvas = element.tagName !== 'CANVAS' && !element.querySelector('canvas');
    const canvas = element.tagName === 'CANVAS' ? element : element.querySelector('canvas') || element.appendChild(document.createElement('canvas'));
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return null;
    const flock = window.JackRavenOverlay ? window.JackRavenOverlay.create({ count: 480 }) : null;
    const wordmarkImage = new Image();
    wordmarkImage.onload = () => { if (flock) flock.setImage(wordmarkImage); };
    wordmarkImage.src = './jack-wordmark.webp';
    canvas.setAttribute('aria-hidden', 'true');

    let options = safeOptions(DEFAULTS, initialOptions);
    let color = getRGB(options.color);
    const region = document.getElementById('hero-motion-region') || canvas.parentElement || element;
    const overlay = document.getElementById('intro-overlay');
    const introCanvas = document.getElementById('intro-canvas');
    const introContext = introCanvas && introCanvas.getContext('2d', { alpha: true });
    const skipButton = document.getElementById('skip-intro');
    const replayButton = document.getElementById('replay-intro');
    const toggleButton = document.getElementById('toggle-motion');
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const cleanups = [];
    const pointer = { active: false, x: 0, y: 0, previousX: 0, previousY: 0, speed: 0 };
    let reduced = reduceQuery.matches;
    let finePointer = pointerQuery.matches;
    let paused = false;
    let destroyed = false;
    let heroVisible = true;
    let width = 1;
    let height = 1;
    let ratio = 1;
    let time = 0;
    let lastFrame = 0;
    let frame = 0;
    let particles = [];
    let introParticles = [];
    let introWidth = 1;
    let introHeight = 1;
    let introFontSize = 1;
    let introActive = false;
    let introStart = 0;
    let introTimer = 0;
    let introRun = 0;
    let fadeAnimation = null;
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
      if (!toggleButton) return;
      toggleButton.textContent = reduced ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion';
      toggleButton.setAttribute('aria-pressed', String(paused || reduced));
      toggleButton.disabled = reduced;
    }

    function createParticles() {
      const count = Math.round(options.density * (finePointer ? 0.48 : 0.28));
      particles = Array.from({ length: count }, (_, index) => ({
        x: width * seed(index * 7 + 5),
        y: height * (index % 2 ? 0.1 + seed(index + 13) * 0.18 : 0.72 + seed(index + 18) * 0.2),
        size: 3 + seed(index + 19) ** 2 * 11,
        phase: seed(index + 37) * Math.PI * 2,
        alpha: 0.15 + seed(index + 8) * 0.26,
        offsetX: 0, offsetY: 0, velocityX: 0, velocityY: 0
      }));
    }

    function resizeHero() {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, options.dpr);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      createParticles();
      drawHero(0);
    }

    function strokeCurve(alpha, offset) {
      context.beginPath();
      context.moveTo(-width * 0.05, height * (0.26 + offset));
      context.bezierCurveTo(width * 0.23, -height * 0.15, width * 0.64, height * (0.12 + offset), width * 1.05, height * (0.77 + offset));
      context.strokeStyle = `rgba(${color},${alpha})`;
      context.lineWidth = 0.8;
      context.stroke();
    }

    function drawHero(delta) {
      context.clearRect(0, 0, width, height);
      const motionTime = reduced ? 0 : time;
      strokeCurve(0.09, 0.07);
      strokeCurve(0.04, 0.11);
      const movementX = pointer.x - pointer.previousX;
      const movementY = pointer.y - pointer.previousY;
      const movementLength = movementX * movementX + movementY * movementY;
      const targetSpeed = delta > 0 ? Math.min(1200, Math.sqrt(movementLength) / delta) : 0;
      pointer.speed = lerp(pointer.speed, targetSpeed, 1 - Math.exp(-12 * delta));
      particles.forEach((particle, index) => {
        const driftX = reduced ? 0 : Math.sin(motionTime * 0.2 + particle.phase) * 14 * options.intensity;
        const driftY = reduced ? 0 : Math.cos(motionTime * 0.17 + particle.phase) * 8 * options.intensity;
        const baseX = particle.x + driftX, baseY = particle.y + driftY;
        if (delta > 0) {
          if (pointer.active && finePointer && options.interactive && pointer.speed > 1) {
            const dx = baseX - pointer.x, dy = baseY - pointer.y;
            const distance = Math.hypot(dx, dy), radius = Math.min(85, width * 0.2);
            if (distance > 0 && distance < radius) {
              const force = (1 - distance / radius) ** 2 * Math.min(pointer.speed, 700) * options.intensity;
              particle.velocityX += dx / distance * force * delta;
              particle.velocityY += dy / distance * force * delta;
            }
          }
          // Decorative spring: mass 1, stiffness 100, damping 10.
          particle.velocityX += (-100 * particle.offsetX - 10 * particle.velocityX) * delta;
          particle.velocityY += (-100 * particle.offsetY - 10 * particle.velocityY) * delta;
          particle.offsetX = clamp(particle.offsetX + particle.velocityX * delta, -20, 20);
          particle.offsetY = clamp(particle.offsetY + particle.velocityY * delta, -20, 20);
        }
        if (window.JackRavenOverlay) window.JackRavenOverlay.raven(
          context, baseX + particle.offsetX, baseY + particle.offsetY, particle.size,
          motionTime * 2.4 + particle.phase, Math.sin(particle.phase) * 0.2,
          particle.alpha, index % 4 === 0
        );
      });
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;
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
      const state = elapsed < duration * 0.4 ? 'assembling' : elapsed < duration * 0.6 ? 'holding' : 'departing';
      if (overlay.dataset.introState !== state) overlay.dataset.introState = state;
      if (flock) flock.render(introContext, elapsed / duration * 5.7, {
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
      if (elapsed >= duration - 240 && !fadeAnimation && overlay.animate) {
        const run = introRun;
        fadeAnimation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: EASE_OUT, fill: 'forwards' });
        fadeAnimation.finished.then(() => { if (run === introRun && introActive) finishIntro(); }).catch(() => {});
      } else if (elapsed >= duration - 240 && !overlay.animate) {
        overlay.style.opacity = String(1 - easeOut((elapsed - duration + 240) / 240));
      }
      if (elapsed >= duration + 40) finishIntro();
    }

    function restoreIntroFocus() {
      if (!overlay || !overlay.contains(document.activeElement)) return;
      const target = previouslyFocused && previouslyFocused !== document.body && document.contains(previouslyFocused) ? previouslyFocused : replayButton;
      if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
    }

    function finishIntro() {
      document.body.classList.add('intro-complete');
      document.body.dataset.introState = 'complete';
      window.dispatchEvent(new CustomEvent('jack:intro-complete'));
      if (!overlay) return;
      const hadIntro = introActive;
      introActive = false;
      introRun++;
      window.clearTimeout(introTimer);
      if (fadeAnimation) {
        fadeAnimation.cancel();
        fadeAnimation = null;
      }
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
      try { resizeIntro(); } catch (_) { finishIntro(); return false; }
      if (!introParticles.length) return false;
      markSeen();
      introActive = true;
      document.body.classList.remove('intro-complete');
      document.body.dataset.introState = 'running';
      introStart = performance.now();
      introRun++;
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      overlay.dataset.introState = 'assembling';
      overlay.style.opacity = '1';
      // Restart the CSS fail-safe on explicit replay, even within the same task.
      overlay.classList.remove('is-active');
      void overlay.offsetWidth;
      overlay.classList.add('is-active');
      introTimer = window.setTimeout(finishIntro, options.introDuration + 100);
      drawIntro(0);
      schedule();
      return true;
    }

    function schedule() {
      if (destroyed || frame || document.hidden) return;
      if (introActive || (heroVisible && !paused && !reduced)) frame = window.requestAnimationFrame(tick);
    }

    function tick(now) {
      frame = 0;
      if (destroyed || document.hidden) return;
      const delta = lastFrame ? clamp((now - lastFrame) / 1000, 0, 1 / 30) : 0;
      lastFrame = now;
      if (heroVisible && !paused && !reduced) {
        time += delta * options.speed;
        drawHero(delta);
      }
      if (introActive) drawIntro(now - introStart);
      schedule();
    }

    function resetPointer() {
      pointer.active = false;
      pointer.speed = 0;
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;
    }

    function updatePointer(event) {
      if (reduced || paused || !finePointer || !options.interactive || event.pointerType === 'touch') return;
      const bounds = canvas.getBoundingClientRect();
      const nextX = event.clientX - bounds.left;
      const nextY = event.clientY - bounds.top;
      if (!pointer.active) {
        pointer.previousX = nextX;
        pointer.previousY = nextY;
      }
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.active = true;
    }

    const controller = {
      updateOptions(partial) {
        if (destroyed) return;
        options = safeOptions(options, partial);
        color = getRGB(options.color);
        resetPointer();
        resizeHero();
        if (introActive) {
          resizeIntro();
          // A changed duration also retimes the safety timer and exit fade.
          window.clearTimeout(introTimer);
          if (fadeAnimation) {
            introRun++;
            fadeAnimation.cancel();
            fadeAnimation = null;
            overlay.style.opacity = '1';
          }
          const remaining = options.introDuration - (performance.now() - introStart);
          if (remaining <= 0) finishIntro();
          else introTimer = window.setTimeout(finishIntro, remaining + 100);
        }
        schedule();
      },
      pause() {
        if (destroyed) return;
        paused = true;
        resetPointer();
        syncToggle();
      },
      resume() {
        if (destroyed) return;
        paused = false;
        lastFrame = 0;
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
        context.clearRect(0, 0, width, height);
        if (createdCanvas) canvas.remove();
        instances.delete(element);
      }
    };
    instances.set(element, controller);

    listen(region, 'pointermove', updatePointer, { passive: true });
    listen(region, 'pointerleave', resetPointer, { passive: true });
    listen(region, 'pointercancel', resetPointer, { passive: true });
    listen(skipButton, 'click', finishIntro);
    listen(replayButton, 'click', replayIntro);
    listen(toggleButton, 'click', () => paused ? controller.resume() : controller.pause());
    listen(document, 'keydown', event => {
      if (event.key === 'Escape' && introActive && !event.defaultPrevented) {
        event.preventDefault();
        finishIntro();
      }
    });
    listen(document, 'visibilitychange', () => {
      lastFrame = 0;
      resetPointer();
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      } else {
        if (introActive && performance.now() - introStart >= options.introDuration) finishIntro();
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
      resetPointer();
      if (reduced) {
        finishIntro();
        particles.forEach(particle => {
          particle.offsetX = 0;
          particle.offsetY = 0;
          particle.velocityX = 0;
          particle.velocityY = 0;
        });
        drawHero(0);
      }
      syncToggle();
      schedule();
    });
    watchMedia(pointerQuery, event => {
      finePointer = event.matches;
      resetPointer();
      createParticles();
      drawHero(0);
      if (introActive) resizeIntro();
    });

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(resizeHero);
      resizeObserver.observe(canvas);
      cleanups.push(() => resizeObserver.disconnect());
    }
    if (window.IntersectionObserver) {
      const intersectionObserver = new IntersectionObserver(entries => {
        heroVisible = entries[0].isIntersecting;
        lastFrame = 0;
        if (!heroVisible) resetPointer();
        schedule();
      }, { rootMargin: '40px' });
      intersectionObserver.observe(canvas);
      cleanups.push(() => intersectionObserver.disconnect());
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
