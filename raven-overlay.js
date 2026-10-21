/* Original deterministic raven choreography. Shared by the site and alpha export. */
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
  // The same strong ease-out / ease-in-out tokens as the portfolio CSS.
  function bezier(x1, y1, x2, y2) {
    const values = new Float32Array(257);
    const axis = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
    for (let i = 0; i <= 256; i++) {
      let low = 0, high = 1;
      for (let k = 0; k < 14; k++) { const mid = (low + high) / 2; if (axis(mid, x1, x2) < i / 256) low = mid; else high = mid; }
      values[i] = axis((low + high) / 2, y1, y2);
    }
    return n => { const p = clamp(n) * 256, i = Math.floor(p); return i === 256 ? 1 : lerp(values[i], values[i + 1], p - i); };
  }
  const out = bezier(0.23, 1, 0.32, 1), move = bezier(0.77, 0, 0.175, 1);

  function raven(ctx, x, y, size, phase, angle, opacity, crimson = true) {
    if (opacity <= 0 || size <= 0) return;
    const lift = Math.sin(phase) * 0.55;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size, size);
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    // A long raven body, narrow beak and fingered flight feathers, no cartoon eyes.
    ctx.moveTo(0.17, -0.05); ctx.lineTo(0.42, -0.11); ctx.lineTo(0.22, -0.2);
    ctx.lineTo(0.05, -0.18); ctx.lineTo(-0.19, -0.4 - lift);
    ctx.lineTo(-1.02, -0.91 - lift); ctx.lineTo(-0.85, -0.45 - lift * 0.65);
    ctx.lineTo(-1.12, -0.52 - lift * 0.5); ctx.lineTo(-0.86, -0.23 - lift * 0.42);
    ctx.lineTo(-1.02, -0.26 - lift * 0.3); ctx.lineTo(-0.64, 0.01);
    ctx.lineTo(-0.2, 0.1); ctx.lineTo(-0.55, 0.57); ctx.lineTo(-0.1, 0.31);
    ctx.lineTo(0.02, 0.22); ctx.lineTo(0.47, 0.06); ctx.lineTo(1.04, -0.22 - lift * 0.3);
    ctx.lineTo(0.87, -0.23 - lift * 0.42); ctx.lineTo(1.13, -0.51 - lift * 0.5);
    ctx.lineTo(0.86, -0.44 - lift * 0.65); ctx.lineTo(1.01, -0.9 - lift);
    ctx.lineTo(0.28, -0.38 - lift); ctx.lineTo(0.17, -0.05); ctx.closePath();
    ctx.fillStyle = crimson ? '#b91427' : '#171216'; ctx.fill();
    ctx.strokeStyle = crimson ? '#ff3446' : '#a72839'; ctx.lineWidth = 0.035; ctx.stroke();
    ctx.restore();
  }

  function create(options = {}) {
    const factory = options.canvasFactory || (() => document.createElement('canvas'));
    const sampler = factory(960, 360); sampler.width = 960; sampler.height = 360;
    const sample = sampler.getContext('2d', { willReadFrequently: true });
    sample.fillStyle = '#fff'; sample.textAlign = 'center'; sample.textBaseline = 'middle';
    sample.font = '900 300px Arial, sans-serif'; sample.fillText('Jack', 480, 176);
    const pixels = sample.getImageData(0, 0, 960, 360).data;
    const points = [];
    for (let y = 30; y < 320; y += 10) for (let x = 100; x < 860; x += 10) {
      if (pixels[(y * 960 + x) * 4 + 3] > 150) points.push({ x: (x - 480) / 760, y: (y - 176) / 760 });
    }
    // Stable order avoids distracting random changes on resize, replay or export.
    points.sort((a, b) => seed(a.x * 313 + a.y * 871) - seed(b.x * 313 + b.y * 871));
    const count = Math.min(options.count || 540, points.length);
    const birds = points.slice(0, count).map((p, i) => ({
      ...p, angle: seed(i + 17) * Math.PI * 2, distance: 0.65 + seed(i + 29) * 0.55,
      delay: seed(i + 49) * 0.36, bend: (seed(i + 71) - 0.5) * 0.2,
      phase: seed(i + 91) * Math.PI * 2, size: 3 + seed(i + 31) * 11
    }));
    let plate = options.image || null;
    function render(ctx, seconds, config = {}) {
      const width = config.width || 1920, height = config.height || 1080;
      const t = Math.max(0, seconds), entrance = out(t / 0.3);
      const shifted = config.shift === false ? 0 : move((t - 3.4) / 1.3);
      const startX = config.startX ?? width * 0.5, startY = config.startY ?? height * 0.48;
      const centerX = lerp(startX, config.finalX ?? width * 0.28, shifted);
      const centerY = lerp(startY, config.finalY ?? height * 0.48, shifted);
      const wordWidth = lerp(config.wordWidth || width * 0.55, config.finalWidth || width * 0.42, shifted);
      const plateAlpha = out((t - 1.9) / 0.8), birdAlpha = 1 - out((t - 2.35) / 0.65);
      ctx.clearRect(0, 0, width, height);
      if (config.blackBackground) { ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, width, height); }
      for (let i = 0; i < birds.length; i++) {
        const bird = birds[i], settled = out((t - bird.delay) / 1.95);
        const distance = (1 - settled) * Math.max(width, height) * bird.distance;
        const twist = Math.sin(settled * Math.PI) * bird.bend * width;
        const x = centerX + bird.x * wordWidth + Math.cos(bird.angle) * distance + twist;
        const y = centerY + bird.y * wordWidth + Math.sin(bird.angle) * distance;
        const size = lerp(bird.size * width / 1920, wordWidth / 420, settled);
        raven(ctx, x, y, size, t * 7 + bird.phase, (1 - settled) * (bird.angle + Math.PI / 2), entrance * birdAlpha * (0.55 + seed(i + 1) * 0.45), i % 5 !== 0);
      }
      if (plateAlpha > 0) {
        ctx.save(); ctx.globalAlpha = plateAlpha;
        if (plate) {
          const plateHeight = wordWidth * plate.height / plate.width;
          ctx.drawImage(plate, centerX - wordWidth / 2, centerY - plateHeight / 2, wordWidth, plateHeight);
        } else {
          ctx.fillStyle = '#e6dfe0'; ctx.font = `900 ${wordWidth / 2.15}px Arial, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Jack', centerX, centerY);
        }
        ctx.restore();
      }
      // A few last birds pass along the margins; no marks cross the future face.
      const stragglers = (1 - out((t - 4.7) / 0.8)) * out((t - 1.2) / 0.5);
      for (let i = 0; i < 9; i++) {
        const p = clamp((t - 1.2 - i * 0.1) / 3.8);
        const x = lerp(i % 2 ? width * 1.1 : -width * 0.1, centerX + (seed(i + 4) - 0.5) * wordWidth * 1.3, move(p));
        const y = height * (0.16 + seed(i + 12) * 0.66) + Math.sin(p * Math.PI) * height * 0.08;
        raven(ctx, x, y, (9 + seed(i + 25) * 18) * width / 1920, t * 6 + i, -0.12 + seed(i + 5) * 0.25, stragglers * (1 - p) * 0.75, false);
      }
      return { phase: t < 2.3 ? 'assembling' : t < 3.4 ? 'holding' : t < 4.7 ? 'moving' : 'complete', seconds: t };
    }
    return Object.freeze({ render, setImage(image) { plate = image; }, count });
  }
  return Object.freeze({ create, raven, easeOut: out, easeInOut: move });
});
