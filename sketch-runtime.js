/* Original coursework: https://editor.p5js.org/jkan349/collections/qvees2nPr
 * Viewer only: every sketch-ID.js file contains the unchanged public source.
 * Runtime: p5.js 2.3.2, matching each original project's index.html.
 * p5 source: https://cdn.jsdelivr.net/npm/p5@2.3.2/lib/p5.js
 * p5 runtime: https://cdn.jsdelivr.net/npm/p5@2.3.2/lib/p5.min.js
 * Upstream p5 license is preserved alongside the runtime in p5-LICENSE.txt.
 */
(() => {
  "use strict";

  const sketches = {
    "2i9M2vcNs": { title: "Sketch Practice in class1", hint: "Random lines accumulate automatically. Restart for a new drawing." },
    "nxapXw1iw": { title: "HW 1 someone portriat", hint: "A generative portrait. Restart to generate a new background palette." },
    "NEXOQO5t6": { title: "3D import1", hint: "Drag to orbit · Scroll to zoom" },
    "T269lyQ5j": { title: "With AI help with 3D import", hint: "Drag to orbit · Scroll to zoom · AI-assisted import" },
    "8hMHfeBry": { title: "HW  portriat 2 with AI", hint: "Animated portrait · AI-assisted version · 12 FPS" },
    "UgizZahU7": { title: "curve editor", hint: "Click four points to draw a Bézier curve · Backspace: undo · Space: clear" },
    "G8-N1jEYE": { title: "HW  portriat 2 without AI", hint: "Animated portrait · Original version labeled without AI · 12 FPS" },
    "_35jx3za4": { title: "particle system", hint: "200 moving square particles · Runs automatically" },
    "1Rfd31OI7": { title: "Solarsystem", hint: "Click the sun to add orbiting planets · Drag and release elsewhere to launch a planet" }
  };

  const parameters = new URLSearchParams(window.location.search);
  const inline = parameters.get("inline") === "1";
  if (inline) document.documentElement.classList.add("inline-preview");
  const id = parameters.get("id");
  const title = document.getElementById("sketch-title");
  const hint = document.getElementById("sketch-hint");
  const status = document.getElementById("status");
  const stage = document.getElementById("stage");
  const source = document.getElementById("source-link");
  const restart = document.getElementById("restart");

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && window.parent !== window) {
      window.parent.postMessage({ type: inline ? "jack:preview-escape" : "cyanx:close-project" }, window.location.origin);
    }
  });

  const showError = (heading, detail) => {
    status.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = heading;
    const paragraph = document.createElement("p");
    paragraph.textContent = detail;
    const back = document.createElement("a");
    back.href = "./index.html#work";
    back.textContent = "Back to selected work ↗";
    status.append(strong, paragraph, back);
    status.hidden = false;
    status.setAttribute("role", "alert");
  };

  // Linked works share this viewer's title, Restart and source controls.
  // The published sketch remains in its own sandboxed, cross-origin frame.
  const remoteSource = parameters.get("source");
  if (remoteSource !== null) {
    const remote = window.JackProjectLinks?.parseP5Url(remoteSource);
    if (!remote) {
      title.textContent = "Invalid sketch link";
      document.title = "Invalid sketch link · Jack";
      hint.textContent = "Open a published p5.js work from the portfolio.";
      showError("This p5.js link is not valid.", "Choose a project from the portfolio, or use a valid HTTPS p5.js sketch link.");
      return;
    }
    const workTitle = parameters.get("title")?.trim().slice(0, 120) || `${remote.owner} / ${remote.id}`;
    title.textContent = workTitle;
    document.title = `${workTitle} · ${remote.owner}`;
    hint.textContent = `Live p5.js sketch · ${remote.owner}`;
    source.href = remote.source;
    const imports = {
      "jkan349/NolU8wAo-": { path: "./imported-NolU8wAo-.html", camera: false },
      "jkan349/KnCmwGAff": { path: "./imported-KnCmwGAff.html", camera: true },
      "jkan349/I1NmzFSh3": { path: "./imported-I1NmzFSh3.html", camera: true }
    };
    const imported = imports[`${remote.owner}/${remote.id}`];
    const playerPath = imported ? imported.path : remote.embed;
    const requiresCamera = imported?.camera === true || parameters.get("camera") === "1";
    let frame;
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin || !frame || event.source !== frame.contentWindow || event.data?.type !== "jack:runner-escape") return;
      if (window.parent !== window) window.parent.postMessage({ type: inline ? "jack:preview-escape" : "cyanx:close-project" }, window.location.origin);
    });
    const startPreview = () => {
      if (frame) return;
      frame = document.createElement("iframe");
      frame.title = `${workTitle} interactive p5.js sketch`;
      frame.src = playerPath;
      frame.allow = requiresCamera ? "camera; fullscreen" : "fullscreen";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.setAttribute("allowfullscreen", "");
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock");
      stage.append(frame);
      status.hidden = true;
      restart.hidden = false;
      if (requiresCamera && window.parent !== window) window.parent.postMessage({ type: "jack:camera-preview-started" }, window.location.origin);
    };
    restart.addEventListener("click", () => { if (frame) frame.src = playerPath; });
    if (requiresCamera) {
      hint.textContent = `Camera-based p5.js sketch · ${remote.owner}`;
      status.className = "camera-prompt";
      status.replaceChildren();
      const heading = document.createElement("strong");
      heading.textContent = "Camera-based artwork";
      const explanation = document.createElement("p");
      explanation.textContent = "This work uses your camera for hand tracking. Start the preview to choose whether to allow access.";
      const start = document.createElement("button");
      start.type = "button";
      start.className = "camera-start";
      start.textContent = "Start camera preview";
      start.addEventListener("click", startPreview);
      const original = document.createElement("a");
      original.href = remote.embed;
      original.target = "_blank";
      original.rel = "noopener noreferrer";
      original.textContent = "Open on p5.js ↗";
      status.append(heading, explanation, start, original);
      status.hidden = false;
    } else startPreview();
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(sketches, id)) {
    title.textContent = "Sketch not found";
    document.title = "Sketch not found · jkan349";
    hint.textContent = "Choose a project from the portfolio or the original p5.js collection.";
    showError("This sketch was not found.", "The link is missing a valid sketch ID. Choose a project from the portfolio to open its live preview.");
    return;
  }

  const sketch = sketches[id];
  title.textContent = sketch.title;
  document.title = `${sketch.title} · jkan349`;
  hint.textContent = sketch.hint;
  source.href = `https://editor.p5js.org/jkan349/sketches/${id}`;
  restart.hidden = false;
  restart.addEventListener("click", () => window.location.reload());

  const observer = new MutationObserver(() => {
    const canvas = stage.querySelector("canvas");
    if (!canvas) return;
    canvas.setAttribute("aria-label", `${sketch.title}, live artwork by jkan349`);
    canvas.setAttribute("tabindex", "0");
    const fitCanvas = () => {
      const bounds = stage.getBoundingClientRect();
      const scale = Math.min(bounds.width / canvas.width, bounds.height / canvas.height);
      if (!Number.isFinite(scale) || scale <= 0) return;
      canvas.style.setProperty("width", `${canvas.width * scale}px`, "important");
      canvas.style.setProperty("height", `${canvas.height * scale}px`, "important");
    };
    // Resize the displayed canvas only. Original drawing coordinates and p5's
    // pointer coordinate conversion retain the source sketch's dimensions.
    const resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(stage);
    fitCanvas();
    status.hidden = true;
    observer.disconnect();
  });
  observer.observe(stage, { childList: true, subtree: true });

  window.addEventListener("error", (event) => {
    if (!event.message) return;
    showError("The sketch could not finish loading.", "Try Restart, or open the original p5.js source using the link above.");
  });
  window.addEventListener("unhandledrejection", () => {
    showError("The sketch could not finish loading.", "A model or drawing asset may be unavailable. Try Restart, or open the original p5.js source above.");
  });

  const loadScript = (file) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = file;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${file}`));
    document.head.append(script);
  });

  // Install the original global setup()/draw() first. p5 then starts global
  // mode automatically once both the source and the document are ready.
  loadScript(`./sketch-${id}.js`)
    .then(() => loadScript("./p5.min.js"))
    .catch(() => showError("The sketch could not be loaded.", "Check the connection and try Restart. The original p5.js source is also available above."));
})();
