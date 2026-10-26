/* One native sketch iframe at a time. Hover is temporary; camera/manual play
 * stays put until Stop, navigation, or the card leaves the visible archive. */
(() => {
  'use strict';
  const instances = new WeakMap();
  function mount({ root, isBlocked = () => false } = {}) {
    if (!root) return null;
    if (instances.has(root)) return instances.get(root);
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const records = new Set();
    const cleanups = [];
    let active = null;
    let destroyed = false;
    function listen(target, name, fn, bucket = cleanups, options) {
      target.addEventListener(name, fn, options);
      bucket.push(() => target.removeEventListener(name, fn, options));
    }
    function cancel(record) {
      if (record.timer) clearTimeout(record.timer);
      record.timer = 0;
    }
    function stop({ suppress = true, focus = false } = {}) {
      for (const record of records) cancel(record);
      if (!active) return;
      const record = active;
      active = null;
      record.frame.remove();
      record.frame = null;
      record.pinned = false;
      record.suppressed = suppress;
      record.cover.classList.remove('is-previewing');
      record.cover.dataset.previewState = 'idle';
      record.play.hidden = false;
      record.stop.hidden = true;
      record.status.hidden = true;
      if (focus && record.play.isConnected) record.play.focus();
    }
    function available(record) {
      return !destroyed && !document.hidden && record.cover.isConnected !== false && !isBlocked();
    }
    function start(record, manual) {
      cancel(record);
      if (!available(record) || (!manual && record.suppressed)) return;
      if (active === record) {
        if (manual) { record.pinned = true; record.frame.focus(); }
        return;
      }
      // Do not replace a deliberately started camera/touch preview just because
      // the pointer crosses a different card on its way to the Stop control.
      if (active?.pinned && !manual) return;
      stop({ suppress: false });
      const frame = document.createElement('iframe');
      frame.className = 'card-preview-frame';
      frame.title = `${record.title} interactive inline preview`;
      frame.src = record.src;
      frame.allow = record.requiresCamera ? 'camera; fullscreen' : 'fullscreen';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('tabindex', '0');
      record.frame = frame;
      record.pinned = manual;
      record.suppressed = false;
      active = record;
      record.cover.classList.add('is-previewing');
      record.cover.dataset.previewState = 'loading';
      record.play.hidden = true;
      record.stop.hidden = false;
      record.status.textContent = 'Loading preview…';
      record.status.hidden = false;
      frame.addEventListener('load', () => {
        if (active !== record || record.frame !== frame) return;
        record.cover.dataset.previewState = 'playing';
        record.status.textContent = record.requiresCamera ? 'Camera starts only when you choose Start' : 'Live · move, click or drag';
      });
      record.cover.append(frame);
      if (manual) frame.focus();
    }
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) continue;
        for (const record of records) if (record.cover === entry.target) {
          cancel(record);
          if (active === record) stop();
        }
      }
    }, { threshold: 0 }) : null;
    function register({ cover, title, src, requiresCamera = false }) {
      if (!cover || destroyed) return null;
      let url;
      try { url = new URL(src, document.baseURI || window.location.href || window.location.origin); }
      catch (_) { return null; }
      if (url.origin !== window.location.origin || !url.pathname.endsWith('/sketch.html')) return null;
      url.searchParams.set('inline', '1');
      const play = document.createElement('button');
      play.type = 'button'; play.className = 'card-preview-play';
      play.textContent = requiresCamera ? 'Preview · camera artwork' : 'Play preview';
      play.setAttribute('aria-label', `Play ${title} inline`);
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'card-preview-stop'; close.hidden = true;
      close.textContent = 'Stop ×'; close.setAttribute('aria-label', `Stop ${title} preview`);
      const status = document.createElement('span');
      status.className = 'card-preview-status'; status.hidden = true;
      status.setAttribute('role', 'status');
      cover.setAttribute('role', 'group');
      cover.setAttribute('aria-label', `${title} preview`);
      cover.dataset.previewState = 'idle';
      cover.append(play, close, status);
      const record = { cover, title, src: url.href, requiresCamera: requiresCamera === true, play, stop: close, status, frame: null, timer: 0, pinned: false, suppressed: false, cleanups: [] };
      records.add(record);
      listen(cover, 'pointerenter', event => {
        if (event.pointerType === 'touch' || !fine.matches || reduce.matches || !available(record) || record.suppressed) return;
        cancel(record);
        record.timer = setTimeout(() => { record.timer = 0; start(record, false); }, 120);
      }, record.cleanups);
      listen(cover, 'pointerleave', event => {
        const rect = cover.getBoundingClientRect();
        // Browsers may send pointerleave when entering a child browsing context.
        // It is still an interaction inside this same cover rectangle.
        if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) return;
        cancel(record);
        record.suppressed = false;
        if (active === record && !record.pinned) stop({ suppress: false });
      }, record.cleanups);
      listen(play, 'click', () => start(record, true), record.cleanups);
      listen(close, 'click', () => stop({ focus: true }), record.cleanups);
      observer?.observe(cover);
      return record;
    }
    function clear() {
      stop();
      for (const record of records) {
        observer?.unobserve(record.cover);
        for (const cleanup of record.cleanups) cleanup();
        record.play.remove(); record.stop.remove(); record.status.remove();
      }
      records.clear();
    }
    listen(window, 'message', event => {
      if (!active || event.origin !== window.location.origin || event.source !== active.frame?.contentWindow) return;
      if (event.data?.type === 'jack:camera-preview-started' && active.requiresCamera) {
        active.pinned = true;
        active.status.textContent = 'Camera preview started · Stop to close';
      } else if (['jack:preview-escape', 'cyanx:close-project'].includes(event.data?.type)) stop({ focus: true });
    });
    const trackOutside = event => {
      if (!active || active.pinned || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      const rect = active.cover.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) stop({ suppress: false });
    };
    // A child iframe can consume its own pointer events. The first pointer event
    // back in the parent must still close a temporary hover preview.
    listen(document, 'pointermove', trackOutside, cleanups, { passive: true });
    listen(document, 'pointerleave', trackOutside, cleanups, { passive: true });
    listen(document, 'keydown', event => { if (event.key === 'Escape' && active) stop({ focus: true }); });
    listen(document, 'visibilitychange', () => { if (document.hidden) stop(); });
    listen(window, 'pagehide', () => stop());
    const api = { register, stop, clear, destroy() {
      if (destroyed) return;
      clear(); destroyed = true;
      observer?.disconnect();
      for (const cleanup of cleanups) cleanup();
      instances.delete(root);
    } };
    instances.set(root, api);
    return api;
  }
  window.JackCardPreviews = Object.freeze({ mount });
})();
