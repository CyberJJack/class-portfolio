# Jack — Digital Portfolio

Jack's class portfolio: a black and crimson theme, a character background, a silver metal Jack wordmark with prominent raven feathers, and nine real p5.js works from [Coding Class1](https://editor.p5js.org/jkan349/collections/qvees2nPr). TouchDesigner has an empty state until real work is added. Original sketch colors and source files are preserved.

## Editing

- `index.html`: navigation, introduction, About text, and the future TouchDesigner section.
- `styles.css`: responsive layout, interface palette, typography, and the shared scene surface.
- `projects.js`: real project titles, descriptions, p5.js IDs, and cover images. To add work, add its catalog entry, original `sketch-ID.js` and assets, and an allowlist entry in `sketch-runtime.js`. Counts update automatically.
- `app.js`: filters, project dialog, and live sketch previews.
- `sketch.html`, `sketch-runtime.js`, `sketch-*.js`: the local viewer and nine original scripts. Display sizing adapts to the viewer; original artwork is unchanged.
- `p5.min.js`: official p5.js 2.3.2 with its license header.
- `hero-video-final.webp`: the supplied video's actual final frame, used only for static visits or interrupted/failed playback.
- `assets/intro-raven.mp4`: the supplied Seedance opening, optimized to 1080p H.264 for the web. The original export is preserved in the separate kit.
- `jack-wordmark.webp`: transparent silver/graphite metal wordmark based on v1, with larger black/red feathers. Selectable HTML Jack text remains the fallback.
- `raven-overlay.js`, `motion.js`: lightweight center-line flash and split reveal, with at most 24 straight particle traces (12 on phones). There are no animated birds, sampled text particles, blur passes or idle Canvas loop. The name layer remains separate from the character video.
- `portfolio-media.js`: video configuration and playback controller.
- `favicon.svg`: the crimson raven site mark.

Displayed project titles are edited for clarity; each dialog preserves the original title. AI-assisted coursework stays labeled. A missing sketch capture is labeled “SCHEMATIC COVER”; opening the project runs its real code.

## Supplied Seedance opening

The 4.333-second character clip plays once, muted and inline. The name effect starts at **3.7 seconds of actual video playback**: a horizontal crimson line flashes, a few traces gather inward, then the line separates upward/downward to reveal Jack from its middle. The name reveals over 0.35–1.05 seconds of the effect and immediately moves left over 1.05–2.00 seconds. There is no center hold. The interface appears on the exact completion frame at approximately **5.7 seconds overall**, with no full-scene fade or UI stagger.

The held character receives a subtle ten-second breathing movement: vertical offset ±0.4%, scale 1.012–1.020. The same video element remains visible throughout playback, its held end frame and the interface reveal. A single shared surface preserves crop, scale, brightness and float phase; the interface is added over it. Navigation and text remain separate HTML. The opening locks scrolling with stable scrollbar space, and Replay returns to the top before measuring the name destination.

Pause freezes both video and effects; Replay restarts and resumes the full sequence. Skip and Escape reveal the portfolio immediately, using the final poster if playback was interrupted before the last frame. Hidden tabs suspend the timeline; reduced motion uses a static background. Failed or stalled video playback uses the lightweight name reveal alone, with a deadline to keep content accessible. `jack:intro-complete` is dispatched after completion or Skip. Content is visible without JavaScript.

Production deployment target: https://cyanxart.github.io/class-portfolio/. The release includes the supplied video, feather metal wordmark, two-second light reveal and static red-feather details in the lower sections.

## Preview and publish

Serve this folder with a static server, for example `python3 -m http.server 8080`, and open `http://localhost:8080`.

For GitHub Pages, select Settings → Pages → Deploy from a branch → `main` → `/ (root)`. There is no build step. Paths are relative so the site works below a repository subpath.

Live previews load only when a project opens; closing it stops its iframe. Each project retains its original editor link. Google Fonts is optional, with system font fallbacks. Future work is described as upcoming.

## Motion and accessibility

The opening can be skipped, replayed, or dismissed with Escape. Pause motion stops ambient effects; system reduced-motion preferences skip the opening and retain a static background. Drawing pauses when hidden or offscreen. Optional session storage failures do not block the page.

The Jack name and light reveal are independent of the character video. Canvas drawing stops after the intro; the held character's subtle movement uses CSS. All primary navigation, categories, and project details remain HTML. Original coursework belongs to its creator; referenced libraries and platforms retain their own terms and licenses.
