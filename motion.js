/*
 * Original motion for Jack / Cyan, made for this portfolio.
 * Visual references: Jack's outlined-square portraits, Bezier studies and orbits.
 * No third-party animation code or assets. Canvas 2D keeps the drawing compact;
 * the only animated DOM property is the intro overlay's compositor opacity.
 */
(() => {
  'use strict';

  const instances = new WeakMap();
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const SESSION_KEY = 'jack-cyan-intro-v1';
  const DEFAULTS = Object.freeze({
    speed: 0.6,
    intensity: 0.75,
    density: 38,
    dpr: 1.5,
    color: '#67e6f5',
    introDuration: 2400,
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
    const limits = { speed: [0.1, 1.5], intensity: [0, 1], density: [16, 64], dpr: [1, 1.5], introDuration: [1800, 3200] };
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
      const count = Math.round(options.density * (finePointer ? 1 : 0.6));
      particles = [];
      for (let index = 0; index < count; index++) {
        let x = seed(index * 7 + 5);
        let y = seed(index * 9 + 13);
        // Leave a quiet pocket behind the selectable Jack / Cyan wordmark.
        if (x > 0.19 && x < 0.83 && y > 0.31 && y < 0.65) {
          y = y < 0.48 ? 0.14 + y * 0.22 : 0.69 + y * 0.19;
        }
        particles.push({
          x: width * x,
          y: height * y,
          size: 4 + seed(index + 19) ** 2 * 27,
          phase: seed(index + 37) * Math.PI * 2,
          alpha: 0.12 + seed(index + 8) * 0.33,
          offsetX: 0,
          offsetY: 0,
          velocityX: 0,
          velocityY: 0
        });
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

    function orbitPoint(angle, radiusX, radiusY, rotation, centerX, centerY) {
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      context.translate(centerX + x * Math.cos(rotation) - y * Math.sin(rotation), centerY + x * Math.sin(rotation) + y * Math.cos(rotation));
    }

    function drawHero(delta) {
      context.clearRect(0, 0, width, height);
      const motionTime = reduced ? 0 : time;
      const intensity = options.intensity;
      const centerX = width * 0.53;
      const centerY = height * 0.47;
      const radiusX = width * 0.41;
      const radiusY = height * 0.29;
      const rotation = -0.49;

      // Curved construction lines: continuous and slow, never flashing.
      strokeCurve(0.12, 0);
      strokeCurve(0.055, 0.035);
      context.save();
      context.translate(centerX, centerY);
      context.rotate(rotation);
      context.beginPath();
      context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.strokeStyle = `rgba(${color},0.17)`;
      context.lineWidth = 0.8;
      context.stroke();
      context.beginPath();
      context.ellipse(0, 0, radiusX * 0.91, radiusY * 1.19, 0, 0.38, 2.25);
      context.strokeStyle = `rgba(${color},0.08)`;
      context.stroke();
      context.restore();

      for (let index = 0; index < 3; index++) {
        context.save();
        const angle = motionTime * (0.1 + index * 0.024) + index * 2.2 + 0.8;
        orbitPoint(angle, radiusX, radiusY, rotation, centerX, centerY);
        context.rotate(angle * 0.35);
        const size = index === 0 ? 5 : 3;
        context.fillStyle = `rgba(${color},${index === 0 ? 0.82 : 0.47})`;
        context.fillRect(-size / 2, -size / 2, size, size);
        context.strokeStyle = `rgba(${color},0.2)`;
        context.strokeRect(-size - 2, -size - 2, size * 2 + 4, size * 2 + 4);
        context.restore();
      }

      const movementX = pointer.x - pointer.previousX;
      const movementY = pointer.y - pointer.previousY;
      const movementLength = movementX * movementX + movementY * movementY;
      const targetSpeed = delta > 0 ? Math.min(1200, Math.sqrt(movementLength) / delta) : 0;
      pointer.speed = lerp(pointer.speed, targetSpeed, 1 - Math.exp(-12 * delta));

      for (let index = 0; index < particles.length; index++) {
        const particle = particles[index];
        const driftX = reduced ? 0 : Math.sin(motionTime * 0.2 + particle.phase) * 5 * intensity;
        const driftY = reduced ? 0 : Math.cos(motionTime * 0.17 + particle.phase) * 6 * intensity;
        const baseX = particle.x + driftX;
        const baseY = particle.y + driftY;

        if (delta > 0) {
          if (pointer.active && finePointer && options.interactive && pointer.speed > 1) {
            // Distance to the movement segment makes a small wake, not a hole.
            const segment = movementLength > 0 ? clamp(((baseX - pointer.previousX) * movementX + (baseY - pointer.previousY) * movementY) / movementLength, 0, 1) : 1;
            const differenceX = baseX - (pointer.previousX + movementX * segment);
            const differenceY = baseY - (pointer.previousY + movementY * segment);
            const distance = Math.hypot(differenceX, differenceY);
            const radius = Math.min(105, width * 0.21);
            if (distance > 0 && distance < radius) {
              const force = (1 - distance / radius) ** 2 * Math.min(pointer.speed, 700) * intensity;
              particle.velocityX += differenceX / distance * force * delta * 1.2;
              particle.velocityY += differenceY / distance * force * delta * 1.2;
            }
          }
          // Decorative spring: mass 1, stiffness 100, damping 10.
          particle.velocityX += (-100 * particle.offsetX - 10 * particle.velocityX) * delta;
          particle.velocityY += (-100 * particle.offsetY - 10 * particle.velocityY) * delta;
          particle.offsetX = clamp(particle.offsetX + particle.velocityX * delta, -28, 28);
          particle.offsetY = clamp(particle.offsetY + particle.velocityY * delta, -28, 28);
        }

        const opacity = particle.alpha * (0.83 + Math.sin(motionTime * 0.38 + particle.phase) * 0.17);
        context.save();
        context.translate(baseX + particle.offsetX, baseY + particle.offsetY);
        context.rotate(Math.sin(particle.phase) * 0.17);
        context.strokeStyle = `rgba(${color},${opacity})`;
        context.lineWidth = index % 8 === 0 ? 1.2 : 0.7;
        context.strokeRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        if (index % 9 === 0) {
          context.fillStyle = `rgba(${color},0.15)`;
          context.fillRect(-1, -1, 2, 2);
        }
        context.restore();
      }
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

      const sampler = document.createElement('canvas');
      sampler.width = Math.round(introWidth);
      sampler.height = Math.round(introHeight);
      const sampleContext = sampler.getContext('2d', { willReadFrequently: true });
      if (!sampleContext) return;
      introFontSize = Math.min(introWidth * 0.31, introHeight * 0.43, 330);
      sampleContext.font = `800 ${introFontSize}px Arial, sans-serif`;
      sampleContext.textAlign = 'center';
      sampleContext.textBaseline = 'middle';
      sampleContext.fillStyle = '#fff';
      sampleContext.fillText('Jack', introWidth / 2, introHeight * 0.45);
      const pixels = sampleContext.getImageData(0, 0, sampler.width, sampler.height).data;
      const spacing = Math.max(5, Math.round(introFontSize / (finePointer ? 30 : 23)));
      const targets = [];
      for (let y = spacing; y < sampler.height; y += spacing) {
        for (let x = spacing; x < sampler.width; x += spacing) {
          if (pixels[(y * sampler.width + x) * 4 + 3] > 150) targets.push({ x, y });
        }
      }

      const stride = Math.max(1, Math.ceil(targets.length / (finePointer ? 1050 : 620)));
      introParticles = [];
      for (let index = 0; index < targets.length; index += stride) {
        const target = targets[index];
        const angle = seed(index + 39) * Math.PI * 2;
        const distance = Math.max(introWidth, introHeight) * (0.32 + seed(index + 101) * 0.48);
        introParticles.push({
          x: target.x,
          y: target.y,
          startX: target.x + Math.cos(angle) * distance,
          startY: target.y + Math.sin(angle) * distance,
          bend: (seed(index + 71) - 0.5) * introFontSize * 0.6,
          size: spacing * (0.42 + seed(index + 29) * 0.24),
          delay: (index % 4) * 60,
          alpha: 0.55 + seed(index + 8) * 0.45
        });
      }
    }

    function spacedText(text, x, y, spacing) {
      const fullWidth = introContext.measureText(text).width + (text.length - 1) * spacing;
      let left = x - fullWidth / 2;
      for (let index = 0; index < text.length; index++) {
        introContext.fillText(text[index], left, y);
        left += introContext.measureText(text[index]).width + spacing;
      }
    }

    function drawIntro(elapsed) {
      introContext.clearRect(0, 0, introWidth, introHeight);
      const duration = options.introDuration;
      const departure = easeInOut((elapsed - duration * 0.68) / (duration * 0.32));
      const visibility = easeOut(elapsed / 200);
      const state = elapsed < duration * 0.5 ? 'assembling' : elapsed < duration * 0.68 ? 'holding' : 'departing';
      if (overlay.dataset.introState !== state) overlay.dataset.introState = state;

      introContext.save();
      introContext.translate(introWidth / 2, introHeight * 0.46);
      introContext.rotate(-0.45);
      introContext.strokeStyle = `rgba(${color},${0.17 * visibility * (1 - departure)})`;
      introContext.lineWidth = 0.8;
      introContext.beginPath();
      introContext.ellipse(0, 0, introFontSize * 1.23, introFontSize * 0.66, 0, 0, Math.PI * 2);
      introContext.stroke();
      introContext.restore();

      for (let index = 0; index < introParticles.length; index++) {
        const particle = introParticles[index];
        const assembly = easeOut((elapsed - particle.delay) / (duration * 0.43));
        const settled = assembly * (1 - departure);
        const x = lerp(particle.startX, particle.x, settled);
        const y = lerp(particle.startY, particle.y, settled) + Math.sin(settled * Math.PI) * particle.bend;
        const opacity = visibility * particle.alpha * (1 - departure * 0.8);
        introContext.fillStyle = `rgba(${color},${opacity})`;
        const size = particle.size * (0.7 + settled * 0.3);
        introContext.fillRect(x - size / 2, y - size / 2, size, size);
      }

      introContext.font = `400 ${Math.max(17, introFontSize * 0.12)}px Arial, sans-serif`;
      introContext.textAlign = 'left';
      introContext.textBaseline = 'middle';
      introContext.fillStyle = `rgba(${color},${easeOut((elapsed - 400) / 500) * (1 - departure) * 0.82})`;
      spacedText('Cyan', introWidth / 2, introHeight * 0.45 + introFontSize * 0.52, introFontSize * 0.035);

      if (elapsed >= duration - 240 && !fadeAnimation && overlay.animate) {
        const run = introRun;
        fadeAnimation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: EASE_OUT, fill: 'forwards' });
        fadeAnimation.finished.then(() => {
          if (run === introRun && introActive) finishIntro();
        }).catch(() => {});
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

  window.CyanMotion = Object.freeze({ mount });
  function boot() {
    const surface = document.getElementById('hero-motion');
    if (surface) window.cyanMotion = mount(surface);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
