# Jack — Digital Portfolio

Jack's class portfolio: a black and crimson raven theme, a character background, machined silver and frosted glass details, and nine real p5.js works from [Coding Class1](https://editor.p5js.org/jkan349/collections/qvees2nPr). TouchDesigner has an empty state until real work is added. Original sketch colors and source files are preserved.

## Editing

- `index.html`: navigation, introduction, About text, and the future TouchDesigner section.
- `styles.css`: responsive layout, interface palette, typography, and the brief staggered interface entrance.
- `projects.js`: real project titles, descriptions, p5.js IDs, and cover images. To add work, add its catalog entry, original `sketch-ID.js` and assets, and an allowlist entry in `sketch-runtime.js`. Counts update automatically.
- `app.js`: filters, project dialog, and live sketch previews.
- `sketch.html`, `sketch-runtime.js`, `sketch-*.js`: the local viewer and nine original scripts. Display sizing adapts to the viewer; original artwork is unchanged.
- `p5.min.js`: official p5.js 2.3.2 with its license header.
- `hero-raven.webp`: static character background and the video fallback.
- `jack-wordmark.webp`: independent transparent name artwork. Selectable HTML Jack text remains the fallback.
- `raven-overlay.js`, `motion.js`: independent canvas crow and particle effects. The name layer is separate from the character background and video.
- `portfolio-media.js`: optional video configuration and pause / reduced-motion handling.
- `favicon.svg`: the crimson raven site mark.

Displayed project titles are edited for clarity; each dialog preserves the original title. AI-assisted coursework stays labeled. A missing sketch capture is labeled “SCHEMATIC COVER”; opening the project runs its real code.

## Character video: awaiting the Seedance export

The site currently uses the static `hero-raven.webp` poster. No Seedance video has been generated or supplied. The hidden background video has no source, so it does not request a missing file.

When the final video is ready:

1. Save the export as `assets/intro-raven.mp4` inside this folder (create `assets` if needed). Use an H.264 MP4 for broad browser support; a local `.webm` is also accepted.
2. Change `videoPath: null` in `portfolio-media.js` to `videoPath: './assets/intro-raven.mp4'`.
3. Keep the character render composed on the right. Jack and the particles are drawn as their own layer; do not bake the website navigation or body text into the video.
4. Serve and preview the site. The video starts muted after the opening finishes, loops behind the interface, pauses offscreen / in a hidden tab / with Pause motion, and stays off for reduced motion. If playback fails, the static poster stays visible.

`#hero-background-video` is the source-free muted, playsinline video element; `#hero-poster` is its permanent poster layer. `jack:intro-complete` is dispatched by `motion.js` when the opening finishes or is skipped. The `intro-complete` body class triggers the interface's 260 ms entrance, staggered by 50 ms. Content is visible when JavaScript is unavailable.

## Preview and publish

Serve this folder with a static server, for example `python3 -m http.server 8080`, and open `http://localhost:8080`.

For GitHub Pages, select Settings → Pages → Deploy from a branch → `main` → `/ (root)`. There is no build step. Paths are relative so the site works below a repository subpath.

Live previews load only when a project opens; closing it stops its iframe. Each project retains its original editor link. Google Fonts is optional, with system font fallbacks. Future work is described as upcoming.

## Motion and accessibility

The opening can be skipped, replayed, or dismissed with Escape. Pause motion stops ambient effects; system reduced-motion preferences skip the opening and retain a static background. Drawing pauses when hidden or offscreen. Optional session storage failures do not block the page.

The Jack name and crow particle layer are independent of the character still or future video. All primary navigation, categories, and project details remain HTML. Original coursework belongs to its creator; referenced libraries and platforms retain their own terms and licenses.
