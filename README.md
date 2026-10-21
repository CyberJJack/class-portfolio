# Jack / Cyan — Digital Portfolio

A digital portfolio for Jack / Cyan. Graphite, cyan, industrial glass, and nine real p5.js sketches from [Coding Class1](https://editor.p5js.org/jkan349/collections/qvees2nPr).

## Edit the portfolio

- `index.html`: introduction, About text, navigation and future digital work section.
- `styles.css`: responsive layout, color palette and typography.
- `projects.js`: all project titles, descriptions, p5.js IDs and thumbnails. To add a work, add its catalog entry here, its exact original `sketch-ID.js` file and required assets, plus an allowlist entry in `sketch-runtime.js`. Set `medium` to `p5js`; the gallery counts are calculated automatically. TouchDesigner currently has an honest empty state until real projects are added.
- `app.js`: filters, accessible project dialog and live p5.js previews.
- `sketch.html`, `sketch-runtime.js`, `sketch-*.js`: responsive live viewer and the nine original sketch scripts. Original code is preserved; display sizing adapts the canvas to the viewer.
- `p5.min.js`: the local official p5.js 2.3.2 runtime, with its original license header.
- `motion.js`: original Canvas 2D opening sequence and quiet hero animation, inspired by the coursework’s outlined squares, Bézier curves and orbital systems.
- The large Jack / small Cyan wordmark is selectable HTML text; no generated logo image is used.
- `favicon.svg`: the site icon.

The displayed titles are edited for readability; each project dialog also preserves the original p5.js title. AI-assisted coursework remains labeled. If a sketch screenshot is unavailable, its cover is explicitly marked “SCHEMATIC COVER”; the real sketch is shown in the project preview.

## Preview

Serve this folder with any static server, such as `python3 -m http.server 8080`, and visit `http://localhost:8080`.

## Publish

GitHub Pages: Settings → Pages → Deploy from a branch → `main` → `/ (root)`. There is no build step. All site paths are relative, so the site works at a repository subpath.

The live previews run the original source locally using the included p5.js runtime and model assets. They are loaded only when opening a project; closing a project stops its iframe. Original p5.js editor links remain available for every work. Google Fonts is optional, with system fonts as a fallback. Future digital works are described as upcoming rather than presented as completed projects.

Original coursework belongs to its respective creator. Referenced libraries and platforms retain their own terms and licenses.

## Motion

The opening runs once per browser session (about 2.4 seconds). Use Replay intro to see it again, Skip intro or Escape to dismiss it, and Pause motion to stop the ambient hero. System reduced-motion preferences skip the opening and show a static hero. Drawing pauses when hidden or offscreen. Optional session storage failures do not block navigation.

`window.cyanMotion` exposes `updateOptions`, `pause`, `resume`, `replayIntro`, and `destroy`. Settings in `motion.js` include speed, intensity, density, color, DPR cap, and intro duration. The animation is an original implementation; no third-party effect or shader source is copied.
