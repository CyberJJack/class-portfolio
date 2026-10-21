/* One persistent video surface plays once and holds under the revealed UI.
 * The poster is used only before decode, on failure or for reduced motion.
 */
window.JackPortfolioMedia = Object.freeze({
  videoPath: './assets/intro-raven.mp4',
  overlayStart: 3.7,
  overlayDuration: 2,
  loadTimeout: 8,
  wordmarkPath: './jack-wordmark.webp?v=seamless-line-1'
});

(() => {
  'use strict';
  const poster = document.getElementById('hero-poster');
  const wordmark = document.getElementById('hero-wordmark');
  const wordmarkImage = document.getElementById('hero-wordmark-image');
  if (poster) {
    poster.addEventListener('error', () => { poster.hidden = true; });
    if (poster.complete && !poster.naturalWidth) poster.hidden = true;
  }
  if (wordmarkImage && wordmark) {
    const showWordmark = () => {
      if (!wordmarkImage.naturalWidth) return;
      wordmarkImage.hidden = false;
      wordmark.classList.add('has-image');
      wordmark.querySelector('.wordmark-text')?.classList.add('sr-only');
    };
    wordmarkImage.addEventListener('load', showWordmark);
    wordmarkImage.addEventListener('error', () => { wordmarkImage.hidden = true; });
    if (wordmarkImage.complete) showWordmark();
  }

  function create(video) {
    const config = window.JackPortfolioMedia;
    if (!video || typeof config.videoPath !== 'string') return null;
    let url;
    try { url = new URL(config.videoPath, document.baseURI); } catch (_) { return null; }
    if (url.origin !== window.location.origin || !/\.(mp4|webm)$/i.test(url.pathname)) return null;
    let status = 'idle';
    let prepared = false;
    let disposed = false;
    let generation = 0;
    const listeners = [];
    const listen = (name, handler) => {
      video.addEventListener(name, handler);
      listeners.push(() => video.removeEventListener(name, handler));
    };
    function failed() {
      if (disposed) return;
      status = 'failed';
      video.pause();
      video.hidden = true;
      video.classList.remove('is-playing');
    }
    function play() {
      if (disposed || status === 'ended' || status === 'failed' || status === 'stopped') return;
      const run = generation;
      try {
        const result = video.play();
        if (result?.catch) result.catch(() => { if (run === generation) failed(); });
      } catch (_) { failed(); }
    }
    listen('playing', () => {
      if (disposed || status === 'failed' || status === 'stopped') return;
      status = 'playing';
      video.hidden = false;
      video.classList.add('is-playing');
    });
    listen('ended', () => {
      if (disposed || status === 'failed' || status === 'stopped') return;
      status = 'ended';
      video.hidden = false;
    });
    listen('error', failed);
    return {
      start() {
        if (disposed) return false;
        generation++;
        status = 'loading';
        video.pause();
        video.hidden = true;
        video.classList.remove('is-playing');
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = false;
        if (!prepared) {
          video.src = url.href;
          video.load();
          prepared = true;
        }
        try { video.currentTime = 0; } catch (_) { /* Metadata may still be loading. */ }
        play();
        return true;
      },
      sample() {
        return {
          status,
          time: Number.isFinite(video.currentTime) ? video.currentTime : 0,
          duration: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
        };
      },
      pause() { if (!disposed) { generation++; video.pause(); } },
      resume: play,
      stop() {
        generation++;
        video.pause();
        if (status !== 'ended' && status !== 'failed') status = 'stopped';
      },
      destroy() {
        if (disposed) return;
        disposed = true;
        generation++;
        video.pause();
        listeners.forEach(remove => remove());
        video.hidden = true;
        video.classList.remove('is-playing');
      }
    };
  }
  window.JackVideoIntro = Object.freeze({ create });
})();
