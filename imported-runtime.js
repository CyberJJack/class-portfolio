/* Viewer lifecycle only. The original artwork source is kept byte-for-byte. */
(() => {
  'use strict';
  const status = document.getElementById('imported-status');
  const streams = new Set();
  let disposed = false;
  let failed = false;
  let setupReady = false;
  let captureRequested = false;
  const stopTracks = stream => stream?.getTracks?.().forEach(track => track.stop());
  function showError() {
    if (!status || disposed) return;
    failed = true;
    const title = document.createElement('strong');
    title.textContent = 'The artwork could not start.';
    const text = document.createElement('p');
    text.textContent = captureRequested
      ? 'Check camera permission and your connection, then use Restart.'
      : 'Check your connection, then use Restart to load the artwork again.';
    status.replaceChildren(title, text);
    status.hidden = false;
  }
  function finishLoading() {
    if (status && !failed && !disposed && setupReady && (!captureRequested || streams.size)) status.hidden = true;
  }
  const devices = navigator.mediaDevices;
  if (devices?.getUserMedia) {
    const getUserMedia = devices.getUserMedia;
    devices.getUserMedia = function (...args) {
      captureRequested = true;
      return getUserMedia.apply(this, args).then(stream => {
        if (disposed) stopTracks(stream);
        else { streams.add(stream); finishLoading(); }
        return stream;
      }, error => { showError(); throw error; });
    };
  }
  function fitCanvas() {
    const canvas = document.querySelector('canvas');
    if (!canvas?.width || !canvas.height) return;
    const scale = Math.min(document.documentElement.clientWidth / canvas.width, document.documentElement.clientHeight / canvas.height);
    if (!Number.isFinite(scale) || scale <= 0) return;
    canvas.style.setProperty('width', `${canvas.width * scale}px`, 'important');
    canvas.style.setProperty('height', `${canvas.height * scale}px`, 'important');
  }
  const resize = new ResizeObserver(fitCanvas);
  resize.observe(document.documentElement);
  const mutations = new MutationObserver(fitCanvas);
  mutations.observe(document.body, { childList: true, subtree: true });
  const originalSetup = window.setup;
  if (typeof originalSetup === 'function') {
    window.setup = async function (...args) {
      try {
        await originalSetup.apply(this, args);
        setupReady = true;
        fitCanvas();
        finishLoading();
      } catch (error) { showError(); throw error; }
    };
  }
  function stop() {
    if (disposed) return;
    disposed = true;
    streams.forEach(stopTracks);
    streams.clear();
    document.querySelectorAll('video,audio').forEach(media => { stopTracks(media.srcObject); media.pause(); });
    try { if (typeof handPose !== 'undefined') handPose?.detectStop?.(); } catch (_) { /* The model may still be loading. */ }
    try { if (typeof noLoop === 'function') noLoop(); } catch (_) { /* p5 may not have started. */ }
    resize.disconnect();
    mutations.disconnect();
  }
  window.addEventListener('pagehide', stop);
  window.addEventListener('beforeunload', stop);
  window.addEventListener('error', showError);
  window.addEventListener('unhandledrejection', showError);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && window.parent !== window) window.parent.postMessage({ type: 'jack:runner-escape' }, window.location.origin);
  });
})();
