/* The original character is the only masked layer. The native CodeFlow loop
 * shares its scene/crop/breathing parent; all HTML UI and the Jack name stay above.
 */
(() => {
  'use strict';
  const instances = new WeakMap();

  function mount() {
    const scene = document.getElementById('hero-scene');
    const character = document.getElementById('hero-character-layer');
    const video = document.getElementById('hero-codeflow-video');
    const hero = document.querySelector('.hero');
    if (!scene || !character || !video || !hero) return null;
    if (instances.has(scene)) return instances.get(scene);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const maskSupported = typeof CSS !== 'undefined' && (
      CSS.supports('mask-image', 'radial-gradient(black, transparent)') ||
      CSS.supports('-webkit-mask-image', 'radial-gradient(black, transparent)')
    );
    let source;
    try { source = new URL(window.JackPortfolioMedia?.codeFlowPath || '', document.baseURI); }
    catch (_) { return null; }
    if (source.origin !== window.location.origin || !/\.mp4$/i.test(source.pathname)) return null;
    const cleanups = [];
    let prepared = false;
    let destroyed = false;
    let failed = false;
    let requested = false;
    let decodedPlaying = false;
    let pointer = null;
    let frame = 0;
    let generation = 0;
    let focused = true;

    video.muted = video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    scene.dataset.codeflowState = maskSupported ? 'idle' : 'unsupported';

    function listen(target, event, handler, settings) {
      target.addEventListener(event, handler, settings);
      cleanups.push(() => target.removeEventListener(event, handler, settings));
    }
    function watch(query) {
      if (query.addEventListener) listen(query, 'change', refresh);
      else { query.addListener(refresh); cleanups.push(() => query.removeListener(refresh)); }
    }
    function eligible() {
      return !destroyed && !failed && maskSupported && focused && fine.matches && !reduce.matches &&
        !document.hidden && document.body.dataset.introState === 'complete' &&
        !document.body.classList.contains('motion-paused') &&
        !document.body.classList.contains('motion-suspended');
    }
    function containsPoint(rect) {
      return pointer && rect.width > 0 && rect.height > 0 &&
        pointer.x >= rect.left && pointer.x <= rect.left + rect.width &&
        pointer.y >= rect.top && pointer.y <= rect.top + rect.height;
    }
    function pointerInside(sceneRect = scene.getBoundingClientRect()) {
      return pointer && pointer.x >= 0 && pointer.y >= 0 &&
        pointer.x <= window.innerWidth && pointer.y <= window.innerHeight &&
        containsPoint(sceneRect) && containsPoint(hero.getBoundingClientRect());
    }
    function close() {
      character.classList.remove('is-codeflow-revealing');
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    }
    function stop() {
      close();
      if (requested || decodedPlaying || !video.paused) {
        generation++;
        requested = decodedPlaying = false;
        video.pause();
      }
      if (!failed && maskSupported) scene.dataset.codeflowState = video.readyState >= 2 ? 'ready' : prepared ? 'loading' : 'idle';
    }
    function fail() {
      failed = true;
      stop();
      scene.dataset.codeflowState = 'unavailable';
    }
    function prepare() {
      if (prepared) return true;
      prepared = true;
      video.preload = 'auto';
      video.src = source.href;
      scene.dataset.codeflowState = 'loading';
      try { video.load(); } catch (_) { fail(); return false; }
      return true;
    }
    function updatePosition(rect = scene.getBoundingClientRect()) {
      if (!pointerInside(rect) || !scene.clientWidth || !scene.clientHeight) return false;
      const scaleX = rect.width / scene.clientWidth;
      const scaleY = rect.height / scene.clientHeight;
      // Invert the shared live scene transform, including its ten-second float.
      const x = (pointer.x - rect.left) / scaleX;
      const y = (pointer.y - rect.top) / scaleY;
      const radius = Math.min(240, Math.max(160, scene.clientWidth * 0.16)) / scaleX;
      character.style.setProperty('--codeflow-x', `${x.toFixed(2)}px`);
      character.style.setProperty('--codeflow-y', `${y.toFixed(2)}px`);
      character.style.setProperty('--codeflow-radius', `${radius.toFixed(2)}px`);
      return true;
    }
    function schedule() {
      if (!frame && !destroyed && decodedPlaying && character.classList.contains('is-codeflow-revealing')) {
        frame = window.requestAnimationFrame(tick);
      }
    }
    function tick() {
      frame = 0;
      if (!eligible() || !requested || !decodedPlaying || !updatePosition()) {
        stop();
        return;
      }
      // A native loop seek can briefly lower readyState. Keep its last decoded
      // surface and playback intent; stopping here would cancel the loop itself.
      // No video drawing or pixel readback: only the mask's small coordinate update.
      schedule();
    }
    function requestPlayback() {
      if (requested) return;
      requested = true;
      const run = ++generation;
      try {
        video.play()?.catch?.(() => {
          if (!destroyed && requested && run === generation) fail();
        });
      } catch (_) { if (run === generation) fail(); }
    }
    function refresh() {
      if (!eligible()) { stop(); return; }
      if (!prepare()) return;
      if (!pointerInside()) { stop(); return; }
      requestPlayback();
      if (decodedPlaying && video.readyState >= 2 && updatePosition()) {
        character.classList.add('is-codeflow-revealing');
        schedule();
      }
    }
    function clearPointer() { pointer = null; stop(); }
    function onPointer(event) {
      if (event.pointerType && event.pointerType !== 'mouse') { clearPointer(); return; }
      if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      focused = true;
      pointer = { x: event.clientX, y: event.clientY };
      // Coalesce high-rate mouse events into the already-running display frame.
      if (decodedPlaying && requested) { schedule(); return; }
      refresh();
    }
    function onPlaying() {
      if (!requested || !eligible() || !pointerInside()) { stop(); video.pause(); return; }
      if (video.readyState < 2) return;
      decodedPlaying = true;
      scene.dataset.codeflowState = 'playing';
      if (updatePosition()) {
        character.classList.add('is-codeflow-revealing');
        schedule();
      }
    }
    listen(document, 'pointermove', onPointer, { passive: true });
    listen(document.documentElement, 'pointerleave', clearPointer);
    listen(hero, 'pointerleave', clearPointer);
    listen(document, 'pointercancel', clearPointer);
    listen(window, 'blur', () => { focused = false; clearPointer(); });
    listen(window, 'focus', () => { focused = true; refresh(); });
    listen(window, 'scroll', refresh, { passive: true });
    listen(window, 'resize', refresh, { passive: true });
    listen(document, 'visibilitychange', () => { if (document.hidden) clearPointer(); else refresh(); });
    listen(window, 'jack:intro-complete', refresh);
    listen(video, 'playing', onPlaying);
    listen(video, 'error', fail);
    watch(reduce);
    watch(fine);
    const stateObserver = new MutationObserver(refresh);
    stateObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-intro-state'] });
    cleanups.push(() => stateObserver.disconnect());

    const controller = {
      refresh,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        generation++;
        stop();
        cleanups.forEach(remove => remove());
        instances.delete(scene);
      }
    };
    instances.set(scene, controller);
    refresh();
    return controller;
  }
  window.JackCodeFlowReveal = Object.freeze({ mount });
  function boot() { window.jackCodeFlow = mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
