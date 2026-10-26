(async () => {
  'use strict';
  const originals = window.PORTFOLIO_PROJECTS || [];
  const projectLinks = window.JackProjectLinks;
  const projects = [...originals];
  const seen = new Set(originals.map(project => `${project.owner || 'jkan349'}/${project.id}`));
  const loadController = new AbortController();
  const loadTimeout = setTimeout(() => loadController.abort(), 4000);
  try {
    const response = await fetch('./additional-projects.json', { cache: 'no-store', signal: loadController.signal });
    if (response.ok) {
      const additional = await response.json();
      if (Array.isArray(additional) && projectLinks) additional.forEach(entry => {
        const project = projectLinks.validateProject(entry);
        if (!project) return;
        const key = `${project.owner}/${project.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        projects.push(project);
      });
    }
  } catch (_) { /* Original coursework remains available if the extra list is unavailable. */ }
  finally { clearTimeout(loadTimeout); }
  const grid = document.querySelector('#project-grid');
  const dialog = document.querySelector('#project-dialog');
  const previewHost = document.querySelector('#preview-host');
  const format = number => String(number).padStart(2, '0');
  let activeFilter = 'p5js';
  let currentProject = null;
  let lastTrigger = null;

  const filteredProjects = () => projects.filter(project => (project.medium || 'p5js') === activeFilter);
  const externalLink = (id, mode) => `https://editor.p5js.org/jkan349/${mode}/${encodeURIComponent(id)}`;

  // Schematic fallback covers are used only until an actual sketch capture is available.
  function drawCover(canvas, kind) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 720, H = 520;
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = '#0b151c'; ctx.fillRect(0, 0, W, H);
    const halo = ctx.createRadialGradient(380, 270, 0, 380, 270, 400);
    halo.addColorStop(0, '#193c4c'); halo.addColorStop(1, '#071016');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = '#5b9bb313';
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (kind === 'solar') {
      ctx.save();ctx.translate(360, 260);ctx.rotate(-.28);
      [90, 145, 205, 265].forEach((r, i) => {ctx.strokeStyle = i % 2 ? '#587f9d77' : '#78dcec44';ctx.beginPath();ctx.ellipse(0, 0, r, r * .59, 0, 0, Math.PI * 2);ctx.stroke();});
      [[-69, -34, 10], [120, -58, 16], [-180, 59, 12], [221, 85, 24]].forEach(([x,y,r],i) => { const p=ctx.createRadialGradient(x-r/3,y-r/3,0,x,y,r);p.addColorStop(0,'#d1f7ff');p.addColorStop(.35,['#6fc4f3','#b7d8ec','#7c9edd','#58aabe'][i]);p.addColorStop(1,'#17364e');ctx.fillStyle=p;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill(); });
      ctx.shadowColor='#82eafd';ctx.shadowBlur=40;ctx.fillStyle='#a6f4fd';ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fill();ctx.restore();
    } else if (kind === 'particles') {
      for(let i=0;i<155;i++){const x=(i*137.51)%W,y=(i*73.79)%H,s=4+(i%7)*3;ctx.strokeStyle=['#66f1e799','#609eee88','#da8fe387','#f2d79588'][i%4];ctx.lineWidth=1.3;ctx.strokeRect(x,y,s,s);ctx.strokeRect(x+3,y+3,Math.max(1,s-6),Math.max(1,s-6));}
    } else if (kind === 'curve') {
      ctx.strokeStyle='#d0ecf54d';ctx.setLineDash([5,8]);ctx.beginPath();ctx.moveTo(100,380);ctx.lineTo(230,90);ctx.lineTo(490,430);ctx.lineTo(630,130);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#67e6f5';ctx.lineWidth=4;ctx.shadowColor='#43bfd7';ctx.shadowBlur=15;ctx.beginPath();ctx.moveTo(100,380);ctx.bezierCurveTo(230,90,490,430,630,130);ctx.stroke();ctx.shadowBlur=0;[[100,380],[230,90],[490,430],[630,130]].forEach(([x,y],i)=>{ctx.fillStyle=i%3?'#0c1d27':'#67e6f5';ctx.strokeStyle='#8eeefb';ctx.lineWidth=2;ctx.fillRect(x-6,y-6,12,12);ctx.strokeRect(x-6,y-6,12,12);});
    } else if (kind.startsWith('portrait')) {
      const offset=kind==='portrait-ai'?25:kind==='portrait-first'?-24:0;ctx.fillStyle='#385b70';ctx.beginPath();ctx.ellipse(360,490,155,170,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bfd0ce';ctx.beginPath();ctx.ellipse(360,265,90+offset/3,125,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#19313f';ctx.beginPath();ctx.arc(355,205,98,Math.PI,Math.PI*2);ctx.lineTo(452,235);ctx.lineTo(397,206);ctx.lineTo(302,244);ctx.lineTo(260,243);ctx.fill();ctx.strokeStyle='#2e4c5b';ctx.lineWidth=4;ctx.strokeRect(295,254,53,29);ctx.strokeRect(372,254,53,29);ctx.beginPath();ctx.moveTo(348,265);ctx.lineTo(372,265);ctx.stroke();ctx.beginPath();ctx.moveTo(344,331);ctx.quadraticCurveTo(363,343,383,328);ctx.stroke();
    } else if (kind.startsWith('model')) {
      ctx.save();ctx.translate(360,260);ctx.rotate(kind==='model-ai'?.35:-.2);for(let i=0;i<12;i++){ctx.strokeStyle=`rgba(101,209,236,${.25+i*.05})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,145,45+i*8,(i/12)*Math.PI,0,Math.PI*2);ctx.stroke();}ctx.restore();
    } else { ctx.strokeStyle='#76dce7';ctx.lineWidth=3;ctx.strokeRect(170,115,245,245);ctx.fillStyle='#7cc8d0';ctx.beginPath();ctx.arc(430,310,90,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#cddee8';ctx.beginPath();ctx.moveTo(200,410);ctx.lineTo(510,120);ctx.stroke(); }
  }

  function renderProjects() {
    const visible = filteredProjects();
    grid.replaceChildren();
    document.querySelector('#empty-medium').hidden = visible.length > 0;
    grid.hidden = visible.length === 0;
    visible.forEach((project, index) => {
      const article = document.createElement('article'); article.className = 'project-card'; article.style.animationDelay = `${index * 25}ms`;
      const button = document.createElement('button'); button.className = 'project-button'; button.type = 'button'; button.setAttribute('aria-label', `Open ${project.title}`); button.setAttribute('aria-haspopup', 'dialog');
      const cover = document.createElement('div'); cover.className = 'project-cover';
      if (project.image) {
        const image = document.createElement('img'); image.src = project.image; image.alt = `${project.title} — capture of the original p5.js sketch`; image.width = 720; image.height = 520; image.loading = 'lazy'; cover.append(image);
      } else {
        const canvas = document.createElement('canvas'); canvas.setAttribute('role','img'); canvas.setAttribute('aria-label',`${project.title} — schematic cover illustration; open to see the actual sketch`); cover.append(canvas); drawCover(canvas, project.cover || 'practice');
      }
      const id = document.createElement('span'); id.className = 'cover-id'; id.textContent = `P5 / ${format(projects.indexOf(project) + 1)}`;
      const arrow = document.createElement('span'); arrow.className = 'cover-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true'); cover.append(id, arrow);
      if (project.note || !project.image) {const badge=document.createElement('span');badge.className='cover-note';badge.textContent=project.image?project.note:(project.note?`${project.note} · SCHEMATIC COVER`:'SCHEMATIC COVER');cover.append(badge);}
      const meta = document.createElement('div'); meta.className = 'project-meta'; const title = document.createElement('h3'); title.textContent = project.title; const openIcon=document.createElement('span');openIcon.textContent='↗';openIcon.setAttribute('aria-hidden','true');meta.append(title,openIcon);
      const type = document.createElement('p'); type.className = 'project-type'; type.textContent = `${project.type} / P5.JS`;
      button.append(cover, meta, type); button.addEventListener('click', () => openProject(project, button)); article.append(button); grid.append(article);
    });
    const mediumLabel = activeFilter === 'touchdesigner' ? 'TouchDesigner' : 'p5js';
    document.querySelector('#filter-status').textContent = visible.length ? `${visible.length} ${mediumLabel} projects shown` : `${mediumLabel} work will be added here soon`;
    document.querySelector('#archive-count').textContent = format(projects.length);
  }

  function openProject(project, trigger) {
    currentProject = project;
    if (trigger) lastTrigger = trigger;
    document.querySelector('#detail-title').textContent = project.title;
    document.querySelector('#detail-description').textContent = project.description;
    document.querySelector('#detail-instructions').textContent = project.instructions;
    document.querySelector('#detail-category').textContent = project.type;
    document.querySelector('#detail-original').textContent = project.original;
    document.querySelector('#detail-index').textContent = `PROJECT ${format(projects.indexOf(project) + 1)} / CLASS ARCHIVE`;
    const visible = filteredProjects(); document.querySelector('#detail-position').textContent = `${format(visible.indexOf(project) + 1)} / ${format(visible.length)} IN THIS VIEW`;
    const remote = project.remote ? projectLinks?.parseP5Url(project.source) : null;
    const requiresCamera = !!remote && project.requiresCamera === true;
    const preview = remote
      ? `./sketch.html?source=${encodeURIComponent(remote.source)}&title=${encodeURIComponent(project.title)}${requiresCamera ? '&camera=1' : ''}`
      : `./sketch.html?id=${encodeURIComponent(project.id)}`;
    document.querySelector('#detail-source').href = remote ? remote.source : externalLink(project.id, 'sketches');
    document.querySelector('#detail-full').href = preview;
    document.querySelector('.preview-note').textContent = remote
      ? 'Running the published sketch from p5.js. If the preview is unavailable, use “Open full size”. Keep the original p5.js sketch publicly shared.'
      : 'Running the original sketch with p5.js. Use “Open full size” for more space, or view its original source in the editor.';
    const iframe = document.createElement('iframe'); iframe.title = `${project.title} interactive p5.js sketch`; iframe.src = preview; iframe.allow = requiresCamera ? 'camera; fullscreen' : 'fullscreen'; iframe.referrerPolicy = 'strict-origin-when-cross-origin'; iframe.setAttribute('allowfullscreen','');
    previewHost.replaceChildren(iframe);
    if (!dialog.open) {dialog.showModal();document.body.classList.add('dialog-open');document.querySelector('#close-dialog').focus();}
    dialog.scrollTop = 0;
  }
  function changeProject(direction) {const visible=filteredProjects();const index=visible.indexOf(currentProject);openProject(visible[(index+direction+visible.length)%visible.length]);}
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  window.addEventListener('message', event => {
    const frame = previewHost.querySelector('iframe');
    if (event.origin === window.location.origin && event.source === frame?.contentWindow && event.data?.type === 'cyanx:close-project' && dialog.open) dialog.close();
  });
  dialog.addEventListener('close', () => {previewHost.replaceChildren();document.body.classList.remove('dialog-open');if(lastTrigger?.isConnected)lastTrigger.focus();});
  dialog.addEventListener('click', event => {if(event.target!==dialog)return;const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();});
  document.querySelector('#previous-project').addEventListener('click',()=>changeProject(-1));
  document.querySelector('#next-project').addEventListener('click',()=>changeProject(1));
  document.querySelectorAll('.filter').forEach(button=>{
    const count=projects.filter(project=>(project.medium || 'p5js')===button.dataset.filter).length;
    button.querySelector('span').textContent=format(count);
    button.addEventListener('click',()=>{activeFilter=button.dataset.filter;document.querySelectorAll('.filter').forEach(filter=>{const active=filter===button;filter.classList.toggle('active',active);filter.setAttribute('aria-pressed',String(active));});renderProjects();});
  });
  document.querySelector('#show-p5js').addEventListener('click', () => document.querySelector('[data-filter="p5js"]').click());
  document.querySelector('.nav-work span').textContent = format(projects.length);
  renderProjects();
})();
