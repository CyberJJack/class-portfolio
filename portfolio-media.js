/* Transparent name video and its codec-matched final frame share one plane. */
window.JackPortfolioMedia = Object.freeze({
  videoPath: './assets/intro-raven.mp4',
  codeFlowPath: './assets/hero-codeflow-red.mp4',
  overlayStart: 3.7,
  nameDepartAt: 1.1,
  departureDuration: 320,
  loadTimeout: 8,
  nameSize: { width: 1920, height: 1080 },
  nameCrop: { left: 372, top: 262, width: 1146, height: 475 },
  nameSources: {
    webm: { path: './assets/jack-ravens-alpha.webm', still: './assets/jack-ravens-final.webp' },
    hevc: { path: './assets/jack-ravens-alpha-hevc.mov', still: './assets/jack-ravens-hevc-final.webp' }
  }
});

(() => {
  'use strict';
  const poster = document.getElementById('hero-poster');
  const wordmark = document.getElementById('hero-wordmark');
  const wordmarkImage = document.getElementById('hero-wordmark-image');
  if (poster) poster.addEventListener('error', () => { poster.hidden = true; });
  if (wordmarkImage && wordmark) {
    const show = () => {
      if (!wordmarkImage.naturalWidth) return;
      wordmarkImage.hidden = false;
      wordmark.classList.add('has-image');
      wordmark.querySelector('.wordmark-text')?.classList.add('sr-only');
    };
    wordmarkImage.addEventListener('load', show);
    if (wordmarkImage.complete) show();
  }

  function create(video, options = {}) {
    if (!video) return null;
    let url;
    try { url = new URL(options.path || window.JackPortfolioMedia.videoPath, document.baseURI); }
    catch (_) { return null; }
    if (url.origin !== window.location.origin || !/\.(mp4|webm|mov)$/i.test(url.pathname)) return null;
    let status = 'idle';
    let prepared = false;
    let disposed = false;
    let wantsPlayback = false;
    let generation = 0;
    const listeners = [];
    function listen(name, callback) {
      video.addEventListener(name, callback);
      listeners.push(() => video.removeEventListener(name, callback));
    }
    function fail() {
      if (disposed || status === 'stopped') return;
      status = 'failed';
      wantsPlayback = false;
      video.pause();
      video.hidden = true;
      options.onError?.();
    }
    function play() {
      if (disposed || ['ended', 'failed', 'stopped', 'idle'].includes(status)) return;
      wantsPlayback = true;
      const run = generation;
      try { video.play()?.catch?.(() => { if (run === generation && wantsPlayback) fail(); }); }
      catch (_) { fail(); }
    }
    listen('playing', () => {
      if (disposed || !wantsPlayback || ['failed', 'stopped', 'ended'].includes(status)) {
        video.pause();
        return;
      }
      status = 'playing';
      video.hidden = false;
      options.onPlaying?.();
    });
    listen('ended', () => {
      if (disposed || !wantsPlayback || ['failed', 'stopped'].includes(status)) return;
      status = 'ended';
      wantsPlayback = false;
      // Keep the native decoded final frame visible until its still is ready.
      video.hidden = false;
      options.onEnded?.();
    });
    listen('error', fail);
    return {
      start() {
        if (disposed) return false;
        generation++;
        wantsPlayback = false;
        video.pause();
        status = 'loading';
        video.hidden = true;
        video.muted = video.defaultMuted = true;
        video.playsInline = true;
        video.loop = false;
        if (!prepared) { video.src = url.href; video.load(); prepared = true; }
        try { video.currentTime = 0; } catch (_) { /* Pending metadata. */ }
        play();
        return true;
      },
      sample: () => ({ status, time: Number.isFinite(video.currentTime) ? video.currentTime : 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0 }),
      pause() { generation++; wantsPlayback = false; video.pause(); },
      resume: play,
      stop() { generation++; wantsPlayback = false; video.pause(); if (status !== 'ended') status = 'stopped'; },
      destroy() { disposed = true; generation++; wantsPlayback = false; video.pause(); listeners.forEach(remove => remove()); video.hidden = true; }
    };
  }
  window.JackVideoIntro = Object.freeze({ create });
})();
