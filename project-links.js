/* Shared by the archive and its owner-only publishing workflow. No credentials. */
(() => {
  'use strict';
  const forbiddenControl = /[\u0000-\u001f\u007f]/;
  const segment = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}$/;
  const text = (value, limit, fallback = '') => {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== 'string' || value.length > limit) return null;
    return value.trim();
  };

  function parseP5Url(raw) {
    if (typeof raw !== 'string' || raw.length > 2048 || forbiddenControl.test(raw) || raw.includes('\\')) return null;
    const input = raw.trim();
    if (!/^https:\/\//i.test(input)) return null;
    let url;
    try { url = new URL(input); } catch { return null; }
    if (url.protocol !== 'https:' || url.hostname !== 'editor.p5js.org' || url.port || url.username || url.password) return null;
    const rawPath = /^https:\/\/[^/]+(\/[^?#]*)/i.exec(input)?.[1];
    const match = /^\/([^/]+)\/(?:sketches|full|embed)\/([^/]+)\/?$/.exec(rawPath || '');
    if (!match || !segment.test(match[1]) || !segment.test(match[2])) return null;
    const [, owner, id] = match;
    return {
      owner,
      id,
      source: `https://editor.p5js.org/${owner}/sketches/${id}`,
      embed: `https://editor.p5js.org/${owner}/full/${id}`
    };
  }

  function validateCover(raw) {
    if (raw === undefined || raw === null || raw === '') return '';
    if (typeof raw !== 'string' || raw.length > 2048 || forbiddenControl.test(raw)) return null;
    const input = raw.trim();
    if (!input) return '';
    if (/^https:\/\//i.test(input)) {
      let url;
      try { url = new URL(input); } catch { return null; }
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    }
    if (/^[\/]|[:\\<>"'?#]/.test(input) || /\s/.test(input)) return null;
    let decoded;
    try { decoded = decodeURIComponent(input); } catch { return null; }
    if (/[:\\<>"'?#\s]/.test(decoded) || decoded.startsWith('/')) return null;
    const parts = decoded.replace(/^\.\//, '').split('/');
    if (parts.some(part => !part || part === '.' || part === '..')) return null;
    return input;
  }

  function validateProject(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const link = parseP5Url(raw.source);
    if (!link || (raw.owner !== undefined && raw.owner !== link.owner) || (raw.id !== undefined && raw.id !== link.id)) return null;
    if (raw.medium !== undefined && raw.medium !== 'p5js') return null;
    const title = text(raw.title, 120);
    const original = text(raw.original, 160, title);
    const type = text(raw.type, 80, 'P5.JS STUDY');
    const description = text(raw.description, 2000);
    const instructions = text(raw.instructions, 1000);
    const image = validateCover(raw.image);
    if (!title || original === null || !type || description === null || instructions === null || image === null) return null;
    return {
      id: link.id,
      owner: link.owner,
      title,
      original: original || title,
      medium: 'p5js',
      type,
      description,
      instructions,
      ...(image ? { image } : {}),
      ...(raw.requiresCamera === true ? { requiresCamera: true } : {}),
      source: link.source,
      remote: true
    };
  }

  function createDraft(existingEntries, newEntries) {
    if (!Array.isArray(existingEntries) || !Array.isArray(newEntries)) throw new Error('作品数据必须是 JSON 数组，请先修复原文件。');
    const seen = new Set();
    const entries = [];
    for (const [list, existing] of [[existingEntries, true], [newEntries, false]]) {
      for (const item of list) {
        const project = validateProject(item);
        if (!project) throw new Error(existing ? '已有作品数据有误；为保留原数据，已停止生成。请先检查 GitHub 文件。' : '新作品资料有误，请检查链接和必填字段。');
        const key = `${project.owner}/${project.id}`;
        if (seen.has(key)) throw new Error(`重复作品：${key} 已经在列表中。`);
        seen.add(key);
        // Preserve existing custom fields and text exactly; normalize new entries only.
        entries.push(existing ? JSON.parse(JSON.stringify(item)) : project);
      }
    }
    return { entries, json: `${JSON.stringify(entries, null, 2)}\n`, count: entries.length };
  }

  window.JackProjectLinks = Object.freeze({ parseP5Url, validateCover, validateProject, createDraft });
})();
