/* Optional video integration. Leave null until the actual Seedance export is added. */
window.JackPortfolioMedia = {
  videoPath: null // Example after adding the file: './assets/intro-raven.mp4'
};

(() => {
  'use strict';
  const video = document.getElementById('hero-background-video');
  const poster = document.getElementById('hero-poster');
  const wordmark = document.getElementById('hero-wordmark');
  const wordmarkImage = document.getElementById('hero-wordmark-image');
  const toggle = document.getElementById('toggle-motion');
  const hero = document.querySelector('.hero');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Retain real HTML Jack text and a black material stage if artwork is unavailable.
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

  const configuredPath = window.JackPortfolioMedia.videoPath;
  if (!video || typeof configuredPath !== 'string' || !configuredPath.trim()) return;
  let url;
  try { url = new URL(configuredPath, document.baseURI); } catch (_) { return; }
  if (url.origin !== window.location.origin || !/\.(mp4|webm)$/i.test(url.pathname)) return;
  let inView = true;
  let introFinished = document.body.classList.contains('intro-complete');
  let initialized = false;
  let failed = false;

  function syncPlayback() {
    const paused = toggle?.getAttribute('aria-pressed') === 'true';
    const canPlay = !failed && introFinished && !reduced.matches && !paused && !document.hidden && inView;
    if (!canPlay) { video.pause(); return; }
    if (!initialized) {
      initialized = true;
      video.src = url.href;
      video.load();
    }
    video.play().catch(() => { video.classList.remove('is-playing'); });
  }
  video.addEventListener('playing', () => {
    video.hidden = false;
    video.classList.add('is-playing');
  });
  video.addEventListener('error', () => {
    failed = true;
    video.hidden = true;
    video.classList.remove('is-playing');
    video.pause();
  });
  window.addEventListener('jack:intro-complete', () => { introFinished = true; syncPlayback(); });
  document.addEventListener('visibilitychange', syncPlayback);
  toggle?.addEventListener('click', () => { window.requestAnimationFrame(syncPlayback); });
  reduced.addEventListener('change', syncPlayback);
  if ('IntersectionObserver' in window && hero) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0.03 });
    observer.observe(hero);
  }
  syncPlayback();
})();
