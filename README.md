# Jack — Digital Portfolio

Jack's class portfolio: a black and crimson theme, a character background, an organic black-metal Jack wordmark and nine original p5.js works from [Coding Class1](https://editor.p5js.org/jkan349/collections/qvees2nPr). TouchDesigner has an empty state until real work is added. Original artwork and sketch source files are preserved.

## Editing

- `index.html`, `styles.css`: page content, responsive layout and the shared scene.
- `projects.js`, `app.js`: project metadata, filters and the project dialog.
- `sketch.html`, `sketch-runtime.js`, `sketch-*.js`: local viewer and original coursework. Display sizing adapts to the viewer; artwork is unchanged.
- `p5.min.js`, `p5-LICENSE.txt`: locally bundled p5.js and its license.
- `assets/intro-raven.mp4`: supplied 4.333-second character clip, optimized to 1080p H.264.
- `hero-video-final.webp`: actual character-video final frame for static/fallback visits.
- `assets/jack-ravens-alpha.webm`: supplied raven/name animation, 1920×1080, 30fps, 2.6 seconds, VP9 with alpha, no audio.
- `assets/jack-ravens-alpha-hevc.mov`: native 1080p HEVC with alpha for Safari/iOS. This is an alpha-preserving native export, not an opaque FFmpeg transcode.
- `assets/jack-ravens-final.webp`, `assets/jack-ravens-hevc-final.webp`: lossless, codec-matched decoded final frames of the two transparent videos.
- `jack-wordmark.webp`: cropped actual WebM final frame for layout, static visits and fallbacks.
- `portfolio-media.js`: source selection, timing, crop metadata and guarded media playback.
- `motion.js`: intro lifecycle and the single transparent name plane. The former particle/line overlay is no longer loaded.
- `favicon.svg`: crimson raven site mark.

## Opening and seamless handoff

The character clip plays muted and inline. At **3.7 seconds of actual character playback**, the transparent raven/name video starts over the same scene. At **1.1 seconds of name playback**, once the incoming birds have fused, its single parent plane moves into the hero wordmark slot over **320ms**. The interface becomes visible as the name arrives, around **5.12 seconds overall**. There is no central hold and no new particle rendering.

The name video continues playing in its final position until its natural end at 2.6 seconds. Its exact decoded final image is preloaded and decoded before replacing the native video. Both retain the same full 1920×1080 source rectangle, `object-fit: contain`, parent transform and crop registration. The tight hero crop is `{left:372, top:262, width:1146, height:475}`. Do not replace the full-frame tail with a cropped image inside this plane or substitute the earlier reference PNG: their geometry/letter contours differ.

The character video stays on one persistent background surface and holds its native final frame. A subtle ten-second CSS float continues without restarting when UI appears. The alpha name uses native video compositing; there is no per-frame Canvas drawing or idle JavaScript animation loop after arrival.

Pause and hidden-tab suspension freeze both videos and the name movement. Skip/Escape, decoding failure, autoplay rejection, or a stalled load reveal accessible static content. Replay resets both videos and returns to the top before measuring the destination. Reduced motion uses static images. The intro runs once per session; Replay remains available. Content and the Jack text fallback are accessible without JavaScript.

## Preview and publish

Serve this folder with a static server, for example `python3 -m http.server 8080`, then open `http://localhost:8080`.

Production target: https://cyberjjack.github.io/class-portfolio/. GitHub Pages uses `main` → `/ (root)` with no build step. All asset paths are relative and work below a repository subpath.

Live sketch previews load only when a project opens; closing it stops the iframe. Each project retains its original editor link. Google Fonts is optional, with system font fallbacks. Future work is labeled as upcoming. Referenced libraries and platforms retain their own terms and licenses.
