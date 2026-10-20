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

  const id = new URLSearchParams(window.location.search).get("id");
  const title = document.getElementById("sketch-title");
  const hint = document.getElementById("sketch-hint");
  const status = document.getElementById("status");
  const stage = document.getElementById("stage");
  const source = document.getElementById("source-link");
  const restart = document.getElementById("restart");

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && window.parent !== window) {
      window.parent.postMessage({ type: "cyanx:close-project" }, window.location.origin);
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
