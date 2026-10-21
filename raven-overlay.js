/* Lightweight crimson light reveal. Shared by the site and RGBA export. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JackRavenOverlay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, n) => a + (b - a) * n;
  const seed = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function bezier(x1, y1, x2, y2) {
    const values = new Float32Array(257);
    const axis = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
    for (let i = 0; i <= 256; i++) {
      let low = 0, high = 1;
      for (let k = 0; k < 14; k++) { const mid = (low + high) / 2; if (axis(mid, x1, x2) < i / 256) low = mid; else high = mid; }
      values[i] = axis((low + high) / 2, y1, y2);
    }
    return n => { if (n <= 0) return 0; if (n >= 1) return 1; const p = n * 256, i = Math.floor(p); return lerp(values[i], values[i + 1], p - i); };
  }
  const DURATION = 2;
  const REVEAL_START = 0.35, REVEAL_END = 1.05;
  const out = bezier(0.23, 1, 0.32, 1), move = bezier(0.77, 0, 0.175, 1);

  function create(options = {}) {
    // Fixed, bounded dots only: no text sampling, bird meshes or ambient loop.
    const count = Math.round(clamp(Number.isFinite(options.count) ? options.count : 24, 0, 24));
    const dots = Array.from({ length: count }, (_, i) => ({
      angle: (i / Math.max(1, count)) * Math.PI * 2 + (seed(i + 4) - 0.5) * 0.22,
      distance: 0.34 + seed(i + 19) * 0.2,
      delay: 0.05 + seed(i + 43) * 0.1,
      duration: 0.35 + seed(i + 71) * 0.15,
      size: 1 + seed(i + 31) * 1.4
    }));
    let plate = options.image || null;

    function render(ctx, seconds, config = {}) {
      const width = config.width || 1920, height = config.height || 1080;
      const t = Math.max(0, seconds);
      const shifted = config.shift === false ? 0 : move((t - REVEAL_END) / (DURATION - REVEAL_END));
      const startX = config.startX ?? width * 0.5, startY = config.startY ?? height * 0.48;
      const centerX = lerp(startX, config.finalX ?? width * 0.28, shifted);
      const centerY = lerp(startY, config.finalY ?? height * 0.48, shifted);
      const wordWidth = lerp(config.wordWidth || width * 0.55, config.finalWidth || width * 0.42, shifted);
      const plateHeight = plate ? wordWidth * plate.height / plate.width : wordWidth / 3;
      const reveal = move((t - REVEAL_START) / (REVEAL_END - REVEAL_START));
      const plateAlpha = out((t - REVEAL_START) / 0.16);
      const lineAlpha = out(t / 0.08) * (1 - out((t - 0.9) / 0.15));
      const screenScale = clamp(Math.min(width / 1600, height / 900), 0.6, 1.25);
      const visibleCount = width <= 700 ? Math.min(count, 12) : count;
      ctx.clearRect(0, 0, width, height);
      if (config.blackBackground) { ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, width, height); }

      // At most 24 short, straight traces converge once, then disappear.
      if (t > 0.05 && t < 0.65) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (let i = 0; i < visibleCount; i++) {
          const dot = dots[i], p = clamp((t - dot.delay) / dot.duration);
          if (t <= dot.delay || p >= 1) continue;
          const travel = out(p), remaining = 1 - travel;
          const dx = Math.cos(dot.angle) * width * dot.distance;
          const dy = Math.sin(dot.angle) * height * dot.distance;
          const x = startX + dx * remaining, y = startY + dy * remaining;
          const length = Math.hypot(dx, dy) || 1;
          const trace = (3 + (1 - p) * 7) * screenScale;
          ctx.globalAlpha = out(p / 0.15) * (1 - out((p - 0.82) / 0.18)) * 0.8;
          ctx.strokeStyle = i % 4 ? '#ff3150' : '#ffe1df';
          ctx.lineWidth = dot.size * screenScale;
          ctx.beginPath(); ctx.moveTo(x + dx / length * trace, y + dy / length * trace); ctx.lineTo(x, y); ctx.stroke();
        }
        ctx.restore();
      }

      // The material is unmasked from its middle; it is never scaled from zero.
      if (plateAlpha > 0 && reveal > 0) {
        ctx.save(); ctx.globalAlpha = plateAlpha;
        const halfHeight = plateHeight * 0.5 * reveal;
        ctx.beginPath(); ctx.rect(centerX - wordWidth / 2, centerY - halfHeight, wordWidth, halfHeight * 2); ctx.clip();
        if (plate) ctx.drawImage(plate, centerX - wordWidth / 2, centerY - plateHeight / 2, wordWidth, plateHeight);
        else {
          ctx.fillStyle = '#f1e8ec'; ctx.font = `900 ${wordWidth / 2.15}px Arial, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Jack', centerX, centerY);
        }
        ctx.restore();
      }

      // One luminous line opens horizontally, then separates above and below
      // the name. Three cheap strokes create a crisp flash without blur passes.
      if (lineAlpha > 0) {
        const halfWidth = wordWidth * 0.57 * out(t / 0.3);
        const split = plateHeight * 0.51 * reveal;
        const flash = 1 - clamp(Math.abs(t - 0.22) / 0.11);
        const gradient = ctx.createLinearGradient(centerX - halfWidth, 0, centerX + halfWidth, 0);
        gradient.addColorStop(0, 'rgba(255,35,65,0)');
        gradient.addColorStop(0.12, '#ff2341');
        gradient.addColorStop(0.5, '#ffe6e3');
        gradient.addColorStop(0.88, '#ff2341');
        gradient.addColorStop(1, 'rgba(255,35,65,0)');
        ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
        const positions = split < 0.5 ? [centerY] : [centerY - split, centerY + split];
        for (const y of positions) {
          ctx.beginPath(); ctx.moveTo(centerX - halfWidth, y); ctx.lineTo(centerX + halfWidth, y);
          ctx.globalAlpha = lineAlpha * 0.12; ctx.strokeStyle = '#ff163b'; ctx.lineWidth = (8 + flash * 4) * screenScale; ctx.stroke();
          ctx.globalAlpha = lineAlpha * 0.34; ctx.lineWidth = 3.5 * screenScale; ctx.stroke();
          ctx.globalAlpha = lineAlpha; ctx.strokeStyle = gradient; ctx.lineWidth = (1.15 + flash) * screenScale; ctx.stroke();
        }
        if (flash > 0) {
          ctx.globalAlpha = flash * lineAlpha; ctx.fillStyle = '#fff1ec';
          ctx.fillRect(centerX - 12 * screenScale, centerY - 0.8 * screenScale, 24 * screenScale, 1.6 * screenScale);
          ctx.fillRect(centerX - 0.7 * screenScale, centerY - 5 * screenScale, 1.4 * screenScale, 10 * screenScale);
        }
        ctx.restore();
      }
      return { phase: t < REVEAL_START ? 'line' : t < REVEAL_END ? 'revealing' : t < DURATION ? 'moving' : 'complete', seconds: t, particleCount: visibleCount };
    }
    return Object.freeze({ render, setImage(image) { plate = image; }, count, duration: DURATION });
  }
  return Object.freeze({ create, easeOut: out, easeInOut: move });
});
