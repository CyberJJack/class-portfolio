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
        const key = projectLinks.projectKey(project);
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
  const cardPreviews = window.JackCardPreviews?.mount({ root: grid, isBlocked: () => dialog.open });
  const format = number => String(number).padStart(2, '0');
  let activeFilter = 'p5js';
  let currentProject = null;
  let lastTrigger = null;
  const media = {
    p5js: { label: 'p5js', symbol: 'P5', title: 'Another experiment is on its way.', description: 'Future p5js work will appear here.' },
    touchdesigner: { label: 'TouchDesigner', symbol: 'TD', title: 'A new signal is on its way.', description: 'Future TouchDesigner work will appear here. For now, explore the p5js collection.' },
    threejs: { label: 'three.js', symbol: '3D', title: 'Room for another dimension.', description: 'Future three.js experiments will appear here. For now, explore the p5js collection.' }
  };

  const filteredProjects = () => projects.filter(project => (project.medium || 'p5js') === activeFilter);
  const externalLink = (id, mode) => `https://editor.p5js.org/jkan349/${mode}/${encodeURIComponent(id)}`;
  function projectPreview(project) {
    if (project.medium === 'threejs') {
      const link = projectLinks.parseThreeUrl(project.source);
      return {
        src: `./sketch.html?medium=threejs&source=${encodeURIComponent(link.source)}&title=${encodeURIComponent(project.title)}`,
        original: link.source,
        requiresCamera: false,
        label: 'three.js',
        code: '3D'
      };
    }
    const link = project.remote ? projectLinks?.parseP5Url(project.source) : null;
    const requiresCamera = !!link && project.requiresCamera === true;
    return {
      src: link
        ? `./sketch.html?source=${encodeURIComponent(link.source)}&title=${encodeURIComponent(project.title)}${requiresCamera ? '&camera=1' : ''}`
        : `./sketch.html?id=${encodeURIComponent(project.id)}`,
      original: link ? link.source : externalLink(project.id, 'sketches'),
      requiresCamera,
      label: 'p5.js',
      code: 'P5'
    };
  }

  // Schematic fallback covers are used only until an actual sketch capture is available.
  function drawCover(canvas, kind) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 720, H = 520;
    canvas.width = W; canvas.height = H;
    if (kind === 'threejs') {
      ctx.fillStyle = '#100b0e'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#ff3c4e'; ctx.lineWidth = 2;
      const points = [[360,100],[220,180],[220,340],[360,420],[500,340],[500,180],[360,260]];
      for (const [a,b] of [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[1,6],[5,6],[6,3]]) {
        ctx.beginPath(); ctx.moveTo(...points[a]); ctx.lineTo(...points[b]); ctx.stroke();
      }
      ctx.fillStyle = '#ff3c4e';
      points.forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill(); });
      return;
    }
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
    cardPreviews?.clear();
    grid.replaceChildren();
    document.querySelector('#empty-medium').hidden = visible.length > 0;
    grid.hidden = visible.length === 0;
    visible.forEach((project, index) => {
      const preview = projectPreview(project);
      const article = document.createElement('article'); article.className = 'project-card'; article.style.animationDelay = `${index * 25}ms`;
      const button = document.createElement('button'); button.className = 'project-button'; button.type = 'button'; button.setAttribute('aria-label', `Open ${project.title}`); button.setAttribute('aria-haspopup', 'dialog');
      const cover = document.createElement('div'); cover.className = 'project-cover';
      if (project.image) {
        const image = document.createElement('img'); image.src = project.image; image.alt = `${project.title} — project preview`; image.width = 720; image.height = 520; image.loading = 'lazy'; cover.append(image);
      } else {
        const canvas = document.createElement('canvas'); canvas.setAttribute('role','img'); canvas.setAttribute('aria-label',`${project.title} — schematic cover illustration; open to see the actual artwork`); cover.append(canvas); drawCover(canvas, project.medium === 'threejs' ? 'threejs' : project.cover || 'practice');
      }
      const id = document.createElement('span'); id.className = 'cover-id'; id.textContent = `${preview.code} / ${format(projects.indexOf(project) + 1)}`;
      cover.append(id);
      if (project.note || !project.image) {const badge=document.createElement('span');badge.className='cover-note';badge.textContent=project.image?project.note:(project.note?`${project.note} · SCHEMATIC COVER`:'SCHEMATIC COVER');cover.append(badge);}
      const meta = document.createElement('div'); meta.className = 'project-meta'; const title = document.createElement('h3'); title.textContent = project.title; const openIcon=document.createElement('span');openIcon.textContent='↗';openIcon.setAttribute('aria-hidden','true');meta.append(title,openIcon);
      const type = document.createElement('p'); type.className = 'project-type'; type.textContent = `${project.type} / ${preview.label.toUpperCase()}`;
      button.append(meta, type); button.addEventListener('click', () => openProject(project, button));
      article.append(cover, button); grid.append(article);
      if (cardPreviews) cardPreviews.register({ cover, title: project.title, src: preview.src, requiresCamera: preview.requiresCamera });
      else cover.addEventListener('click', () => openProject(project, button));
    });
    const medium = media[activeFilter] || media.p5js;
    const mediumLabel = medium.label;
    document.querySelector('#empty-symbol-label').textContent = medium.symbol;
    document.querySelector('#empty-kicker').textContent = `${mediumLabel.toUpperCase()} / COMING SOON`;
    document.querySelector('#empty-title').textContent = medium.title;
    document.querySelector('#empty-description').textContent = medium.description;
    document.querySelector('#empty-add-work').hidden = activeFilter !== 'threejs';
    document.querySelector('#filter-status').textContent = visible.length ? `${visible.length} ${mediumLabel} projects shown` : `${mediumLabel} work will be added here soon`;
    document.querySelector('#archive-count').textContent = format(projects.length);
    const threeCount = projects.filter(project => project.medium === 'threejs').length;
    document.querySelector('#threejs-work-state').textContent = threeCount ? `${format(threeCount)} ${threeCount === 1 ? 'WORK' : 'WORKS'} IN THE ARCHIVE` : 'WORK TO BE ADDED';
  }

  function openProject(project, trigger) {
    cardPreviews?.stop();
    currentProject = project;
    if (trigger) lastTrigger = trigger;
    document.querySelector('#detail-title').textContent = project.title;
    document.querySelector('#detail-description').textContent = project.description;
    document.querySelector('#detail-instructions').textContent = project.instructions;
    document.querySelector('#detail-category').textContent = project.type;
    document.querySelector('#detail-original').textContent = project.original;
    document.querySelector('#detail-index').textContent = `PROJECT ${format(projects.indexOf(project) + 1)} / CLASS ARCHIVE`;
    const visible = filteredProjects(); document.querySelector('#detail-position').textContent = `${format(visible.indexOf(project) + 1)} / ${format(visible.length)} IN THIS VIEW`;
    const preview = projectPreview(project);
    const isThree = project.medium === 'threejs';
    document.querySelector('#detail-source').href = preview.original;
    document.querySelector('#detail-source-label').textContent = isThree ? 'Open original work' : 'View source code';
    document.querySelector('#detail-medium').textContent = `${preview.label} / JavaScript`;
    document.querySelector('#detail-runtime-label').textContent = isThree ? 'LIVE THREE.JS WORK' : 'LIVE P5.JS SKETCH';
    document.querySelector('#detail-full').href = preview.src;
    document.querySelector('.preview-note').textContent = isThree
      ? 'Interactive three.js artwork. Use “Open full size” for more space. If its host blocks embedded previews, choose “Open original work”.'
      : 'Running the original sketch with p5.js. Use “Open full size” for more space, or view its original source in the editor.';
    const iframe = document.createElement('iframe'); iframe.title = `${project.title} interactive ${preview.label} artwork`; iframe.src = preview.src; iframe.allow = preview.requiresCamera ? 'camera; fullscreen' : 'fullscreen'; iframe.referrerPolicy = 'strict-origin-when-cross-origin'; iframe.setAttribute('allowfullscreen','');
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
  document.querySelectorAll('[data-medium-target]').forEach(link => {
    link.addEventListener('click', () => document.querySelector(`[data-filter="${link.dataset.mediumTarget}"]`)?.click());
  });
  document.querySelector('.nav-work span').textContent = format(projects.length);
  renderProjects();
})();
