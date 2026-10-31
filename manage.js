(() => {
  'use strict';
  const links = window.JackProjectLinks;
  const form = document.querySelector('#work-form');
  const fields = document.querySelector('#work-fields');
  const loadStatus = document.querySelector('#load-status');
  const formStatus = document.querySelector('#form-status');
  const copyStatus = document.querySelector('#copy-status');
  const output = document.querySelector('#json-output');
  const copyButton = document.querySelector('#copy-json');
  const workList = document.querySelector('#work-list');
  const count = document.querySelector('#draft-count');
  const mediumField = document.querySelector('#work-medium');
  const builtIns = window.PORTFOLIO_PROJECTS || [];
  let existing = [];
  let pending = [];
  let ready = false;
  const value = id => document.querySelector(id).value;
  const key = project => links.projectKey(project);
  const medium = () => mediumField.value === 'threejs' ? 'threejs' : 'p5js';
  const requestedMedium = new URL(window.location?.href || 'https://example.invalid/').searchParams.get('medium');
  mediumField.value = requestedMedium === 'threejs' ? 'threejs' : 'p5js';

  function updateMedium() {
    const three = medium() === 'threejs';
    document.querySelector('#form-title').textContent = three ? '添加一个 three.js 作品' : '添加一个 p5.js 作品';
    document.querySelector('#link-help').textContent = three
      ? '填写已发布的 three.js 作品运行页（HTTPS），例如 GitHub Pages、Netlify 或 Vercel 的页面。不要填 GitHub 仓库、编辑器或本地地址；先确认未登录也能运行。部分网站禁止嵌入，届时可打开原网页。'
      : '支持 editor.p5js.org 的 sketches、full、embed 链接。请在 p5.js 中确认作品已公开，访客才能播放。';
    document.querySelector('#work-link').placeholder = three ? 'https://你的账号.github.io/你的threejs作品/' : 'https://editor.p5js.org/你的账号/sketches/作品ID';
    const type = document.querySelector('#work-type');
    if (!type.value || ['CREATIVE CODING', 'WEBGL STUDY'].includes(type.value)) type.value = three ? 'WEBGL STUDY' : 'CREATIVE CODING';
  }
  mediumField.addEventListener('change', updateMedium);
  updateMedium();

  function status(element, message, error = false) {
    element.textContent = message;
    element.classList.toggle('error', error);
  }

  function listItem(project, index, saved) {
    const item = document.createElement('div');
    item.className = 'work-item';
    const copy = document.createElement('div');
    copy.className = 'work-item-copy';
    const state = document.createElement('span');
    state.className = 'item-state';
    state.textContent = saved ? '已有作品 · 保留' : '待添加 · 尚未提交';
    const title = document.createElement('h3');
    title.textContent = project.title;
    const link = document.createElement('a');
    const three = project.medium === 'threejs';
    const address = three ? links.parseThreeUrl(project.source) : links.parseP5Url(project.source);
    link.href = address.source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = three ? `three.js · ${address.source}` : `p5.js · ${key(project)}`;
    const meta = document.createElement('p');
    meta.append(link);
    copy.append(state, title, meta);
    item.append(copy);
    if (!saved) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-work';
      remove.textContent = '移除';
      remove.setAttribute('aria-label', `移除待添加作品 ${project.title}`);
      remove.addEventListener('click', () => {
        pending.splice(index, 1);
        render();
        status(formStatus, '已移除这次待添加的作品。GitHub 中的已有作品保持原样。');
        status(copyStatus, '列表已改变，请重新复制完整 JSON。');
      });
      item.append(remove);
    }
    return item;
  }

  function render() {
    const draft = links.createDraft(existing, pending);
    output.value = draft.json;
    count.textContent = String(draft.count).padStart(2, '0');
    copyButton.disabled = !ready;
    const items = existing.map((project, index) => listItem(project, index, true));
    items.push(...pending.map((project, index) => listItem(project, index, false)));
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-list';
      empty.textContent = `还没有新增作品。原有 ${builtIns.length} 个内置作品不在此文件中，会继续保留。`;
      items.push(empty);
    }
    workList.replaceChildren(...items);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!ready) return;
    const selectedMedium = medium();
    const link = selectedMedium === 'threejs' ? links.parseThreeUrl(value('#work-link')) : links.parseP5Url(value('#work-link'));
    if (!link) {
      status(formStatus, selectedMedium === 'threejs' ? '请填写公开的 HTTPS three.js 作品运行页链接，不能使用本地地址或带账号密码的链接。' : '请填写完整的 HTTPS p5.js 作品链接（sketches、full 或 embed）。', true);
      document.querySelector('#work-link').focus();
      return;
    }
    const project = links.validateProject({
      id: link.id,
      owner: link.owner,
      source: link.source,
      title: value('#work-title'),
      type: value('#work-type'),
      description: value('#work-description'),
      instructions: value('#work-instructions'),
      image: value('#work-image'),
      medium: selectedMedium,
      remote: true
    });
    if (!project) {
      status(formStatus, '请检查作品名称、类型和封面。封面只能使用 HTTPS 图片网址或仓库内的相对路径。', true);
      return;
    }
    if (builtIns.some(item => key(item) === key(project))) {
      status(formStatus, '这个作品已经在原有作品集中，不需要重复添加。', true);
      return;
    }
    try {
      links.createDraft(existing, [...pending, project]);
      pending.push(project);
      render();
      form.reset();
      mediumField.value = selectedMedium;
      updateMedium();
      document.querySelector('#work-link').focus();
      status(formStatus, `「${project.title}」已加入待添加列表。请复制完整 JSON 并到 GitHub 提交，网站才会更新。`);
      status(copyStatus, '');
    } catch (error) {
      status(formStatus, error.message, true);
    }
  });

  copyButton.addEventListener('click', async () => {
    if (!ready) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(output.value);
      status(copyStatus, '完整 JSON 已复制。下一步：打开 GitHub，全选原文件内容、粘贴并 Commit。');
    } catch {
      output.focus();
      output.select();
      status(copyStatus, '浏览器没有开放剪贴板，已选中完整内容。请按 ⌘ C（Windows：Ctrl C）复制。');
    }
  });

  async function loadExisting() {
    if (!links) throw new Error('资料工具未加载，请刷新页面。');
    const response = await fetch(`./additional-projects.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('无法读取现有作品文件，请检查网络或 GitHub 文件是否存在。');
    const data = await response.json();
    links.createDraft(data, []);
    existing = data;
    ready = true;
    render();
    fields.disabled = false;
    status(loadStatus, `现有作品已读取：${existing.length} 个新增作品；原有 ${builtIns.length} 个内置作品继续保留。`);
  }

  loadExisting().catch(error => {
    ready = false;
    fields.disabled = true;
    copyButton.disabled = true;
    output.value = '';
    status(loadStatus, `读取失败：${error.message} 为防止覆盖已有资料，暂时不能生成文件。修复后请刷新。`, true);
  });
})();
