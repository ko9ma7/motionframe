import { builtinTemplates, hydrateMotion, motionPresets, templateCategories } from './templates.js';
import { soundPresets, createProceduralBuffer, applyFade } from './audio.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const STORAGE_KEY = 'motionframe:v2:project';
const TEMPLATE_KEY = 'motionframe:v2:templates';
const DB_NAME = 'motionframe-studio-v2';
const DB_STORE = 'assets';
const API_ENDPOINT = 'https://api.microlink.io/';

let dbPromise;
let state;
let selectedSceneId = null;
let currentTime = 0;
let playing = false;
let playStartStamp = 0;
let renderRaf = 0;
let templateFilter = 'all';
let exportInProgress = false;
let previewAudio = null;
let soundPreviewTimer = 0;
let customAudioBufferCache = null;
const assetUrlCache = new Map();
const imageCache = new Map();
const videoCache = new Map();
let screenRecording = null;

const canvas = $('#previewCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const createId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function putAsset(key, blob) {
  const db = await openDb();
  if (!db) throw new Error('이 브라우저에서는 IndexedDB를 사용할 수 없습니다.');
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(blob, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  if (assetUrlCache.has(key)) URL.revokeObjectURL(assetUrlCache.get(key));
  assetUrlCache.delete(key);
  imageCache.delete(key);
  videoCache.delete(key);
}

async function getAsset(key) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteAsset(key) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  if (assetUrlCache.has(key)) URL.revokeObjectURL(assetUrlCache.get(key));
  assetUrlCache.delete(key);
  imageCache.delete(key);
  const video = videoCache.get(key); if (video) { try { video.pause(); } catch {} }
  videoCache.delete(key);
}

async function getAssetUrl(key) {
  if (assetUrlCache.has(key)) return assetUrlCache.get(key);
  const blob = await getAsset(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  assetUrlCache.set(key, url);
  return url;
}

function demoSvg(title, accent, variant = 0) {
  const rows = variant === 0
    ? '<rect x="250" y="310" width="610" height="28" rx="10" fill="#e7ebf2"/><rect x="250" y="358" width="610" height="28" rx="10" fill="#e7ebf2"/><rect x="250" y="406" width="610" height="28" rx="10" fill="#e7ebf2"/>'
    : variant === 1
      ? '<rect x="250" y="286" width="180" height="154" rx="18" fill="#e8edf5"/><rect x="450" y="286" width="180" height="154" rx="18" fill="#e8edf5"/><rect x="650" y="286" width="210" height="154" rx="18" fill="#e8edf5"/>'
      : '<path d="M270 405 C340 330,390 380,450 302 S590 352,650 270 S760 310,850 230" fill="none" stroke="#7f8ba2" stroke-width="10" stroke-linecap="round"/><circle cx="650" cy="270" r="14" fill="'+accent+'"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750"><rect width="1200" height="750" fill="#f7f9fc"/><rect width="1200" height="70" fill="#fff"/><circle cx="34" cy="35" r="7" fill="#d8dee8"/><circle cx="56" cy="35" r="7" fill="#d8dee8"/><circle cx="78" cy="35" r="7" fill="#d8dee8"/><rect x="102" y="22" width="310" height="26" rx="9" fill="#eff2f6"/><rect x="30" y="96" width="165" height="620" rx="18" fill="#101827"/><text x="58" y="140" font-family="Arial" font-size="18" font-weight="700" fill="#f7f9fc">MotionFrame</text><rect x="55" y="178" width="100" height="10" rx="5" fill="#31405a"/><rect x="55" y="218" width="82" height="10" rx="5" fill="#31405a"/><rect x="55" y="258" width="110" height="10" rx="5" fill="#31405a"/><text x="250" y="145" font-family="Arial" font-size="36" font-weight="700" fill="#151c28">${title}</text><rect x="250" y="176" width="390" height="14" rx="7" fill="#d9dfe9"/><rect x="250" y="210" width="210" height="14" rx="7" fill="#d9dfe9"/><rect x="720" y="118" width="140" height="48" rx="14" fill="${accent}"/>${rows}<rect x="250" y="492" width="610" height="170" rx="18" fill="#eef2f7"/><rect x="280" y="528" width="190" height="18" rx="9" fill="#cfd7e3"/><rect x="280" y="566" width="450" height="12" rx="6" fill="#dbe1ea"/><rect x="280" y="594" width="390" height="12" rx="6" fill="#dbe1ea"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function baseScene(overrides = {}) {
  return hydrateMotion({
    id: createId('scene'),
    name: '새 장면',
    sourceType: 'demo',
    assetKey: null,
    imageUrl: '',
    sourceUrl: '',
    duration: 2.4,
    transition: 'crossfade',
    motionPreset: 'overview',
    startZoom: 100,
    endZoom: 116,
    startX: 50,
    startY: 50,
    endX: 50,
    endY: 46,
    cursorEnabled: false,
    cursorX: 66,
    cursorY: 52
  }, overrides.motionPreset || 'overview', overrides);
}

function demoProject() {
  return {
    version: 2,
    aspect: '16:9',
    resolution: '1280x720',
    frameStyle: 'browser',
    audio: { preset: 'softPulse', volume: 42, fade: true, assetKey: null, name: '' },
    scenes: [
      baseScene({ name: '전체 화면', imageUrl: demoSvg('Automation overview', '#8da5ff', 0), duration: 2.2, sourceType: 'demo', motionPreset: 'overview' }),
      baseScene({ name: '기능 포커스', imageUrl: demoSvg('Workflow builder', '#91d2b3', 1), duration: 2.4, sourceType: 'demo', motionPreset: 'focus', endX: 67, endY: 46, cursorX: 69, cursorY: 48 }),
      baseScene({ name: '결과 확인', imageUrl: demoSvg('Report analytics', '#efc87a', 2), duration: 2.2, sourceType: 'demo', motionPreset: 'pullout', transition: 'zoom-out' })
    ]
  };
}

function sanitizeProject(project) {
  const fallback = demoProject();
  if (!project || !Array.isArray(project.scenes)) return fallback;
  return {
    version: 2,
    aspect: ['16:9','9:16','1:1'].includes(project.aspect) ? project.aspect : '16:9',
    resolution: ['1280x720','1920x1080'].includes(project.resolution) ? project.resolution : '1280x720',
    frameStyle: ['browser','floating','none'].includes(project.frameStyle) ? project.frameStyle : 'browser',
    audio: {
      preset: project.audio?.preset || 'softPulse',
      volume: clamp(Number(project.audio?.volume ?? 42), 0, 100),
      fade: project.audio?.fade !== false,
      assetKey: project.audio?.assetKey || null,
      name: project.audio?.name || ''
    },
    scenes: project.scenes.map((scene) => baseScene({ ...scene, id: scene.id || createId('scene') }))
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitizeProject(raw ? JSON.parse(raw) : null);
  } catch {
    return demoProject();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  $('#saveState').textContent = '저장됨';
  clearTimeout(saveState.timer);
  saveState.timer = setTimeout(() => { $('#saveState').textContent = '로컬 저장'; }, 1300);
}

function loadCustomTemplates() {
  try {
    const data = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function storeCustomTemplates(templates) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
}

function currentTemplates() { return [...builtinTemplates, ...loadCustomTemplates()]; }

function totalDuration() { return state.scenes.reduce((sum, scene) => sum + Number(scene.duration || 0), 0); }

function formatTime(value) {
  const seconds = Math.max(0, value || 0);
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  const tenth = Math.floor((seconds % 1) * 10);
  return `${min}:${sec}.${tenth}`;
}

function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.textContent = message;
  $('#toastRoot').append(el);
  setTimeout(() => el.remove(), 3600);
}

function setCaptureStatus(title, text, mode = '') {
  const el = $('#captureStatus');
  el.className = `capture-status ${mode}`.trim();
  el.querySelector('strong').textContent = title;
  el.querySelector('p').textContent = text;
}

function normalizeUrl(value) {
  let text = String(value || '').trim();
  if (!text) throw new Error('사이트 URL을 입력해 주세요.');
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;
  const url = new URL(text);
  if (!['http:','https:'].includes(url.protocol)) throw new Error('http 또는 https URL만 사용할 수 있습니다.');
  return url.toString();
}

function parseUrlList(value) {
  const lines=String(value||'').split(/
+/).map(v=>v.trim()).filter(Boolean);
  if(!lines.length)throw new Error('사이트 URL을 입력해 주세요.');
  return lines.slice(0,8).map(normalizeUrl);
}

function sceneAssetRef(scene) { return scene.assetKey || scene.imageUrl; }

async function sourceUrlForScene(scene) {
  if (scene.assetKey) return getAssetUrl(scene.assetKey);
  return scene.imageUrl || null;
}

async function imageForScene(scene) {
  const key = sceneAssetRef(scene);
  if (!key) return null;
  if (imageCache.has(key)) return imageCache.get(key);
  const url = await sourceUrlForScene(scene);
  if (!url) return null;
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
    img.src = url;
  });
  imageCache.set(key, promise);
  return promise;
}

async function videoForScene(scene) {
  const key = sceneAssetRef(scene);
  if (!key) return null;
  if (videoCache.has(key)) return videoCache.get(key);
  const url = await sourceUrlForScene(scene);
  if (!url) return null;
  const promise = new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto'; video.muted = true; video.playsInline = true; video.src = url;
    video.addEventListener('loadedmetadata', () => resolve(video), { once:true });
    video.addEventListener('error', () => reject(new Error('영상 클립을 불러오지 못했습니다.')), { once:true });
    video.load();
  });
  videoCache.set(key, promise);
  return promise;
}

async function syncVideoFrame(video, targetTime, duration) {
  const maxTime = Math.max(0, Math.min(video.duration || duration || 0, targetTime));
  if (playing || exportInProgress) {
    if (Math.abs(video.currentTime - maxTime) > .35) video.currentTime = maxTime;
    video.playbackRate = clamp((video.duration || duration || 1) / Math.max(duration || 1, .1), .25, 4);
    if (video.paused) video.play().catch(() => {});
    return;
  }
  video.pause();
  if (Math.abs(video.currentTime - maxTime) <= .03) return;
  await new Promise(resolve => {
    let done = false;
    const finish = () => { if (done) return; done = true; video.removeEventListener('seeked', finish); resolve(); };
    video.addEventListener('seeked', finish, { once:true });
    video.currentTime = maxTime;
    setTimeout(finish, 160);
  });
}

function getOutputSize() {
  const high = state.resolution === '1920x1080';
  if (state.aspect === '9:16') return high ? [1080,1920] : [720,1280];
  if (state.aspect === '1:1') return high ? [1080,1080] : [720,720];
  return high ? [1920,1080] : [1280,720];
}

function syncCanvasSize() {
  const [w,h] = getOutputSize();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const shell = $('#canvasShell');
  shell.classList.toggle('portrait', state.aspect === '9:16');
  shell.classList.toggle('square', state.aspect === '1:1');
  $('#previewBadge').textContent = `${state.resolution === '1920x1080' ? '1080p' : '720p'} · 30fps`;
}

function roundedRect(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}

function drawFocusedMedia(context, img, x, y, w, h, zoom, focusX, focusY) {
  const sourceWidth = img.naturalWidth || img.videoWidth;
  const sourceHeight = img.naturalHeight || img.videoHeight;
  const targetRatio = w / h;
  const imageRatio = sourceWidth / sourceHeight;
  let baseW, baseH;
  if (imageRatio > targetRatio) { baseH = sourceHeight; baseW = baseH * targetRatio; }
  else { baseW = sourceWidth; baseH = baseW / targetRatio; }
  const z = Math.max(1, zoom / 100);
  const sw = Math.min(sourceWidth, baseW / z);
  const sh = Math.min(sourceHeight, baseH / z);
  const sx = clamp((sourceWidth - sw) * (focusX / 100), 0, sourceWidth - sw);
  const sy = clamp((sourceHeight - sh) * (focusY / 100), 0, sourceHeight - sh);
  context.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawCursor(context, x, y, size, clickProgress) {
  context.save();
  if (clickProgress > 0 && clickProgress < 1) {
    context.strokeStyle = `rgba(142,168,255,${(1 - clickProgress) * .9})`;
    context.lineWidth = Math.max(2, size * .08);
    context.beginPath();
    context.arc(x, y, size * (.35 + clickProgress * .7), 0, Math.PI * 2);
    context.stroke();
  }
  context.translate(x, y);
  context.scale(size / 34, size / 34);
  context.beginPath();
  context.moveTo(0, 0); context.lineTo(0, 31); context.lineTo(8, 23); context.lineTo(14, 34); context.lineTo(20, 31); context.lineTo(14, 20); context.lineTo(26, 20); context.closePath();
  context.fillStyle = '#ffffff';
  context.strokeStyle = '#0b1019';
  context.lineWidth = 2.4;
  context.fill(); context.stroke();
  context.restore();
}

function frameGeometry(width, height) {
  if (state.frameStyle === 'none') return { x:0, y:0, w:width, h:height, chrome:0, radius:0 };
  const portrait = height > width;
  const mx = state.frameStyle === 'floating' ? width * (portrait ? .10 : .07) : width * (portrait ? .075 : .055);
  const my = state.frameStyle === 'floating' ? height * .08 : height * .065;
  const chrome = state.frameStyle === 'browser' ? Math.max(24, height * .045) : 0;
  return { x:mx, y:my, w:width - mx*2, h:height - my*2, chrome, radius: Math.max(12, width * .012) };
}

async function drawScene(scene, progress, opacity = 1, transform = {}) {
  let img;
  if (scene.sourceType === 'video') {
    img = await videoForScene(scene).catch(() => null);
    if (!img) return;
    const mediaDuration = Number(scene.mediaDuration || img.duration || scene.duration || 1);
    await syncVideoFrame(img, clamp(progress,0,1) * mediaDuration, Number(scene.duration || mediaDuration));
  } else {
    img = await imageForScene(scene).catch(() => null);
    if (!img) return;
  }
  const w = canvas.width, h = canvas.height;
  const p = easeInOut(clamp(progress,0,1));
  const zoom = lerp(Number(scene.startZoom), Number(scene.endZoom), p);
  const focusX = lerp(Number(scene.startX), Number(scene.endX), p);
  const focusY = lerp(Number(scene.startY), Number(scene.endY), p);
  const geom = frameGeometry(w,h);
  const contentY = geom.y + geom.chrome;
  const contentH = geom.h - geom.chrome;
  ctx.save();
  ctx.globalAlpha = opacity;
  const scale = transform.scale ?? 1;
  const tx = transform.x ?? 0;
  const ty = transform.y ?? 0;
  ctx.translate(w/2 + tx, h/2 + ty); ctx.scale(scale, scale); ctx.translate(-w/2, -h/2);

  if (state.frameStyle !== 'none') {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.38)'; ctx.shadowBlur = Math.max(18, w*.024); ctx.shadowOffsetY = Math.max(8,h*.012);
    roundedRect(ctx, geom.x, geom.y, geom.w, geom.h, geom.radius); ctx.fillStyle = '#0d131e'; ctx.fill();
    ctx.restore();
  }
  if (state.frameStyle === 'browser') {
    roundedRect(ctx, geom.x, geom.y, geom.w, geom.h, geom.radius); ctx.clip();
    ctx.fillStyle = '#171f2d'; ctx.fillRect(geom.x, geom.y, geom.w, geom.chrome);
    const dot = geom.chrome * .13; const cy = geom.y + geom.chrome / 2;
    ['#647087','#647087','#647087'].forEach((color,i) => { ctx.beginPath(); ctx.arc(geom.x + geom.chrome*.36 + i*dot*2.2, cy, dot, 0, Math.PI*2); ctx.fillStyle=color; ctx.fill(); });
    const host = (() => { try { return scene.sourceUrl ? new URL(scene.sourceUrl).hostname : 'product.local'; } catch { return 'product.local'; }})();
    ctx.fillStyle = '#273144'; roundedRect(ctx, geom.x + geom.w*.28, geom.y + geom.chrome*.24, geom.w*.44, geom.chrome*.52, geom.chrome*.18); ctx.fill();
    ctx.fillStyle = '#8e9aaf'; ctx.font = `${Math.max(9,geom.chrome*.24)}px system-ui`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(host, geom.x + geom.w*.5, cy);
  } else if (state.frameStyle === 'floating') {
    roundedRect(ctx, geom.x, geom.y, geom.w, geom.h, geom.radius); ctx.clip();
  }

  drawFocusedMedia(ctx, img, geom.x, contentY, geom.w, contentH, zoom, focusX, focusY);
  ctx.restore();

  if (scene.cursorEnabled) {
    const cursorT = clamp((progress - .08) / .68, 0, 1);
    const cp = easeInOut(cursorT);
    const startCX = 18, startCY = 24;
    const cx = lerp(startCX, Number(scene.cursorX), cp) / 100 * w;
    const cy = lerp(startCY, Number(scene.cursorY), cp) / 100 * h;
    const click = progress > .70 && progress < .88 ? (progress - .70) / .18 : 0;
    drawCursor(ctx, cx, cy, Math.max(26,w*.025), click);
  }
}

function locateTime(time) {
  let acc = 0;
  for (let i=0;i<state.scenes.length;i+=1) {
    const d = Number(state.scenes[i].duration || 0);
    if (time <= acc + d || i === state.scenes.length - 1) return { index:i, local: clamp(time-acc,0,d), duration:d, start:acc };
    acc += d;
  }
  return { index:0, local:0, duration:1, start:0 };
}

async function renderAt(time) {
  syncCanvasSize();
  const w = canvas.width, h = canvas.height;
  const bg = ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,'#0c111b'); bg.addColorStop(1,'#161f2e'); ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
  if (!state.scenes.length) { $('#canvasMessage').hidden = false; return; }
  $('#canvasMessage').hidden = true;
  const loc = locateTime(clamp(time,0,totalDuration()));
  const scene = state.scenes[loc.index];
  const p = loc.duration ? loc.local / loc.duration : 0;
  const transitionLength = Math.min(.5, loc.duration * .22);
  const transitionStart = 1 - transitionLength / loc.duration;
  const transP = p > transitionStart && loc.index < state.scenes.length-1 ? clamp((p-transitionStart)/(1-transitionStart),0,1) : 0;
  const next = state.scenes[loc.index+1];

  if (!transP || scene.transition === 'cut' || !next) {
    await drawScene(scene,p,1);
  } else if (scene.transition === 'crossfade') {
    await drawScene(scene,p,1-transP);
    await drawScene(next,0,transP);
  } else if (scene.transition === 'zoom-out') {
    await drawScene(scene,p,1-transP*.35,{ scale:1-transP*.08 });
    await drawScene(next,0,transP,{ scale:.92+transP*.08 });
  } else if (scene.transition === 'slide') {
    await drawScene(scene,p,1,{ x:-w*transP });
    await drawScene(next,0,1,{ x:w*(1-transP) });
  }
}

async function updatePreview() { await renderAt(currentTime); }

function selectScene(id) {
  selectedSceneId = id;
  const index = state.scenes.findIndex(s => s.id === id);
  if (index >= 0) {
    currentTime = state.scenes.slice(0,index).reduce((sum,s)=>sum+Number(s.duration),0) + .001;
  }
  renderAll();
}

function selectedScene() { return state.scenes.find(s => s.id === selectedSceneId) || null; }

async function renderSceneCards() {
  const list = $('#sceneList'); const timeline = $('#timeline');
  list.innerHTML = ''; timeline.innerHTML = '';
  $('#sceneCountBadge').textContent = state.scenes.length;
  $('#sceneEmpty').hidden = state.scenes.length > 0;
  for (let i=0;i<state.scenes.length;i+=1) {
    const scene = state.scenes[i];
    const card = document.createElement('button');
    card.type='button'; card.className=`scene-card ${scene.id===selectedSceneId?'active':''}`; card.draggable=true; card.dataset.id=scene.id;
    card.innerHTML=`<span class="scene-thumb"></span><span class="scene-copy"><strong>${escapeHtml(scene.name)}</strong><span>${Number(scene.duration).toFixed(1)}s · ${escapeHtml(motionPresets[scene.motionPreset]?.label || '직접 설정')}</span></span>`;
    card.addEventListener('click',()=>selectScene(scene.id));
    card.addEventListener('dragstart',(e)=>e.dataTransfer.setData('text/plain',scene.id));
    card.addEventListener('dragover',(e)=>e.preventDefault());
    card.addEventListener('drop',(e)=>{e.preventDefault(); reorderScene(e.dataTransfer.getData('text/plain'),scene.id);});
    list.append(card);

    const item=document.createElement('button'); item.type='button'; item.className=`timeline-item ${scene.id===selectedSceneId?'active':''}`; item.dataset.id=scene.id; item.style.flexBasis=`${clamp(Number(scene.duration)*52,82,190)}px`;
    item.innerHTML=`<span class="timeline-image"></span><span>${Number(scene.duration).toFixed(1)}s</span><strong>${escapeHtml(scene.name)}</strong>`;
    item.addEventListener('click',()=>selectScene(scene.id)); timeline.append(item);
    sourceUrlForScene(scene).then(url=>{ if(!url)return; card.querySelector('.scene-thumb').style.backgroundImage=`url("${url.replaceAll('"','%22')}")`; item.querySelector('.timeline-image').style.backgroundImage=`url("${url.replaceAll('"','%22')}")`; });
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function reorderScene(fromId,toId) {
  if (!fromId || fromId===toId) return;
  const from=state.scenes.findIndex(s=>s.id===fromId), to=state.scenes.findIndex(s=>s.id===toId);
  if (from<0||to<0)return;
  const [moved]=state.scenes.splice(from,1); state.scenes.splice(to,0,moved); saveState(); renderAll(); toast('장면 순서를 변경했습니다.');
}

function renderInspector() {
  const scene = selectedScene(); const has=Boolean(scene);
  $('#inspectorContent').hidden=!has; $('#inspectorEmpty').hidden=has;
  if (!scene) return;
  $('#sceneNameInput').value=scene.name; $('#durationInput').value=scene.duration; $('#transitionSelect').value=scene.transition;
  $('#motionPresetSelect').value=scene.motionPreset || 'custom';
  const pairs=[['startZoom',scene.startZoom,'%'],['endZoom',scene.endZoom,'%'],['startX',scene.startX,'%'],['startY',scene.startY,'%'],['endX',scene.endX,'%'],['endY',scene.endY,'%'],['cursorX',scene.cursorX,'%'],['cursorY',scene.cursorY,'%']];
  pairs.forEach(([key,val,suffix])=>{ const input=$(`#${key}Input`), output=$(`#${key}Output`); if(input)input.value=val; if(output)output.textContent=`${val}${suffix}`; });
  $('#cursorEnabledInput').checked=Boolean(scene.cursorEnabled); $('#cursorControls').style.opacity=scene.cursorEnabled?'1':'.45';
}

function renderSound() {
  $('#soundPresetSelect').value=state.audio.preset;
  $('#volumeInput').value=state.audio.volume; $('#volumeOutput').textContent=`${state.audio.volume}%`; $('#fadeAudioInput').checked=state.audio.fade;
  const preset=soundPresets.find(s=>s.id===state.audio.preset);
  $('#audioHelper').textContent=state.audio.preset==='custom' ? (state.audio.name ? `사용 중: ${state.audio.name}` : '오디오 파일을 업로드해 주세요.') : (preset?.description || '');
}

function renderMeta() {
  const duration=totalDuration(); $('#sceneSummary').textContent=`${state.scenes.length} scenes`; $('#durationSummary').textContent=`${duration.toFixed(1)} sec`; $('#sceneCountBadge').textContent=state.scenes.length;
  $('#timeTotal').textContent=formatTime(duration); $('#timeCurrent').textContent=formatTime(currentTime);
  $('#seekInput').max=Math.max(duration,.001); $('#seekInput').value=clamp(currentTime,0,duration);
  $('#aspectSelect').value=state.aspect; $('#frameStyleSelect').value=state.frameStyle; $('#resolutionSelect').value=state.resolution;
}

async function renderAll() {
  if (state.scenes.length && !state.scenes.some(s=>s.id===selectedSceneId)) selectedSceneId=state.scenes[0].id;
  renderMeta(); renderInspector(); renderSound(); await renderSceneCards(); await updatePreview();
}

function setupSelectOptions() {
  $('#motionPresetSelect').innerHTML=Object.entries(motionPresets).map(([id,p])=>`<option value="${id}">${escapeHtml(p.label)}</option>`).join('');
  $('#soundPresetSelect').innerHTML=soundPresets.map(p=>`<option value="${p.id}">${escapeHtml(p.label)}</option>`).join('');
  const templates=currentTemplates(); $('#captureTemplateSelect').innerHTML=templates.filter(t=>t.category!=='custom').map(t=>`<option value="${t.id}" ${t.id==='web-story'?'selected':''}>${escapeHtml(t.title)}</option>`).join('');
}

function renderTemplateFilters() {
  $('#templateFilters').innerHTML='';
  templateCategories.forEach(([id,label])=>{ const b=document.createElement('button'); b.type='button'; b.className=`template-filter ${templateFilter===id?'active':''}`; b.textContent=label; b.addEventListener('click',()=>{templateFilter=id; renderTemplates(); renderTemplateFilters();}); $('#templateFilters').append(b); });
}

function renderTemplates() {
  const grid=$('#templateGrid'); grid.innerHTML='';
  const templates=currentTemplates().filter(t=>templateFilter==='all'||t.category===templateFilter);
  templates.forEach(template=>{
    const card=document.createElement('article'); card.className='template-card'; card.dataset.motion=template.motion || 'zoom';
    const isCustom=String(template.id).startsWith('custom-');
    card.innerHTML=`${isCustom?'<span class="template-custom-badge">Saved</span>':''}<div class="template-visual"><i></i></div><div class="template-meta"><span>${escapeHtml(template.category)}</span><span>${escapeHtml(template.durationLabel||`${template.sequence?.reduce((a,s)=>a+Number(s.duration||0),0).toFixed(1)} sec`)}</span></div><h3>${escapeHtml(template.title)}</h3><p>${escapeHtml(template.description||'저장한 프로젝트 연출 설정입니다.')}</p><div class="template-actions"></div>`;
    const actions=card.querySelector('.template-actions');
    const apply=document.createElement('button'); apply.type='button'; apply.textContent='적용'; apply.addEventListener('click',()=>applyTemplate(template)); actions.append(apply);
    if (isCustom) {
      const update=document.createElement('button'); update.type='button'; update.textContent='현재 설정으로 갱신'; update.addEventListener('click',()=>updateCustomTemplate(template.id)); actions.append(update);
      const download=document.createElement('button'); download.type='button'; download.textContent='JSON'; download.addEventListener('click',()=>downloadJson(template,`${safeFileName(template.title)}.motionframe-template.json`)); actions.append(download);
      const del=document.createElement('button'); del.type='button'; del.textContent='삭제'; del.addEventListener('click',()=>deleteCustomTemplate(template.id)); actions.append(del);
    } else {
      const clone=document.createElement('button'); clone.type='button'; clone.textContent='내 템플릿으로 복제'; clone.addEventListener('click',()=>cloneBuiltinTemplate(template)); actions.append(clone);
    }
    grid.append(card);
  });
}

function templateSequenceFromState() {
  return state.scenes.map(scene=>({ motion: scene.motionPreset || 'custom', duration:Number(scene.duration), transition:scene.transition, startZoom:scene.startZoom,endZoom:scene.endZoom,startX:scene.startX,startY:scene.startY,endX:scene.endX,endY:scene.endY,cursorEnabled:scene.cursorEnabled,cursorX:scene.cursorX,cursorY:scene.cursorY }));
}

function cloneBuiltinTemplate(template) {
  const customs=loadCustomTemplates(); customs.unshift({ ...structuredClone(template), id:createId('custom'), category:'custom', title:`${template.title} Copy`, description:'기본 템플릿을 복제해 수정할 수 있는 사용자 템플릿입니다.' }); storeCustomTemplates(customs); templateFilter='custom'; setupSelectOptions(); renderTemplateFilters(); renderTemplates(); toast('내 템플릿으로 복제했습니다.');
}

function updateCustomTemplate(id) {
  const customs=loadCustomTemplates(); const index=customs.findIndex(t=>t.id===id); if(index<0)return;
  customs[index]={ ...customs[index], sequence:templateSequenceFromState(), aspect:state.aspect, frameStyle:state.frameStyle, audioPreset:state.audio.preset, durationLabel:`${totalDuration().toFixed(1)} sec` };
  storeCustomTemplates(customs); renderTemplates(); toast('현재 편집 상태로 템플릿을 갱신했습니다.');
}

function deleteCustomTemplate(id) {
  const customs=loadCustomTemplates().filter(t=>t.id!==id); storeCustomTemplates(customs); setupSelectOptions(); renderTemplates(); toast('사용자 템플릿을 삭제했습니다.');
}

function applyTemplate(template) {
  if (!state.scenes.length) { toast('먼저 URL이나 이미지를 장면으로 추가해 주세요.','error'); return; }
  const sequence=template.sequence?.length?template.sequence:[{motion:'overview',duration:2.4,transition:'crossfade'}];
  const originals=[...state.scenes]; const targetCount=Math.max(originals.length,sequence.length); const next=[];
  for(let i=0;i<targetCount;i+=1){
    const source=structuredClone(originals[Math.min(i,originals.length-1)]); source.id=createId('scene');
    const spec=sequence[i%sequence.length];
    next.push(hydrateMotion(source,spec.motion || 'overview',{ ...spec, id:source.id, name: originals.length===1 ? `${originals[0].name} · ${i+1}` : source.name }));
  }
  state.scenes=next; state.aspect=template.aspect||state.aspect; state.frameStyle=template.frameStyle||state.frameStyle; if(template.audioPreset)state.audio.preset=template.audioPreset;
  selectedSceneId=state.scenes[0]?.id||null; currentTime=0; saveState(); renderAll(); toast(`“${template.title}” 템플릿을 적용했습니다.`); location.hash='studio';
}

function saveCurrentTemplate(name,category='custom') {
  const customs=loadCustomTemplates();
  customs.unshift({ id:createId('custom'), title:name, category, motion:'zoom', description:'현재 프로젝트에서 저장한 사용자 연출 템플릿.', durationLabel:`${totalDuration().toFixed(1)} sec`, aspect:state.aspect, frameStyle:state.frameStyle, audioPreset:state.audio.preset, sequence:templateSequenceFromState() });
  storeCustomTemplates(customs); setupSelectOptions(); templateFilter='custom'; renderTemplateFilters(); renderTemplates(); toast('현재 연출을 내 템플릿으로 저장했습니다.');
}

async function fetchUrlCapture(url, mode, viewport) {
  const [width,height]=viewport.split('x').map(Number);
  const params=new URLSearchParams({ url, screenshot:'true', meta:'false', embed:'screenshot.url', 'viewport.width':String(width), 'viewport.height':String(height) });
  if(mode==='full')params.set('screenshot.fullPage','true');
  if(width<=430){params.set('viewport.isMobile','true');params.set('viewport.hasTouch','true');}
  const response=await fetch(`${API_ENDPOINT}?${params.toString()}`, { mode:'cors' });
  if(!response.ok){ const detail=await response.text().catch(()=> ''); throw new Error(`URL 캡처 실패 (${response.status})${detail?`: ${detail.slice(0,120)}`:''}`); }
  const blob=await response.blob();
  if(!blob.type.startsWith('image/'))throw new Error('캡처 서비스가 이미지 대신 다른 응답을 반환했습니다.');
  return blob;
}

async function makeImageSceneFromBlob(blob,{name='캡처 장면',sourceType='upload',sourceUrl=''}={}) {
  const key=createId('asset'); await putAsset(key,blob);
  const scene=baseScene({ name, sourceType, sourceUrl, assetKey:key, imageUrl:'', motionPreset:'overview' });
  await imageForScene(scene);
  return scene;
}

async function makeVideoSceneFromBlob(blob,{name='영상 클립'}={}) {
  const key=createId('asset'); await putAsset(key,blob);
  const scene=baseScene({ name, sourceType:'video', assetKey:key, imageUrl:'', sourceUrl:'', motionPreset:'calmFloat', duration:4 });
  const video=await videoForScene(scene);
  scene.mediaDuration = Number.isFinite(video.duration) ? video.duration : 4;
  scene.duration = clamp(scene.mediaDuration, .8, 30);
  video.currentTime = Math.min(.15, scene.mediaDuration || 0);
  await new Promise(resolve => { const done=()=>resolve(); video.addEventListener('seeked',done,{once:true}); setTimeout(done,180); });
  const poster=document.createElement('canvas'); const ratio=(video.videoWidth||16)/(video.videoHeight||9); poster.width=320; poster.height=Math.max(120,Math.round(320/ratio));
  poster.getContext('2d').drawImage(video,0,0,poster.width,poster.height); scene.posterUrl=poster.toDataURL('image/jpeg',.72);
  video.currentTime=0; return scene;
}

async function captureUrl(asStory) {
  let urls; try{urls=parseUrlList($('#urlInput').value);}catch(err){toast(err.message,'error');$('#urlInput').focus();return;}
  if(!asStory)urls=urls.slice(0,1);
  const mode=$('#captureModeSelect').value, viewport=$('#viewportSelect').value;
  setCaptureStatus('사이트를 렌더링하는 중', `${urls.length}개 URL · ${mode==='full'?'전체 페이지':'첫 화면'} 캡처`, 'loading');
  $('#urlStoryButton').disabled=true; $('#urlSingleButton').disabled=true;
  try{
    const bases=[];
    for(let i=0;i<urls.length;i+=1){
      const url=urls[i]; setCaptureStatus(`URL 캡처 중 ${i+1}/${urls.length}`, new URL(url).hostname, 'loading');
      const blob=await fetchUrlCapture(url,mode,viewport);
      bases.push(await makeImageSceneFromBlob(blob,{name:new URL(url).hostname,sourceType:'url',sourceUrl:url}));
    }
    const isDemo=state.scenes.length && state.scenes.every(s=>s.sourceType==='demo');
    if(asStory){
      const template=currentTemplates().find(t=>t.id===$('#captureTemplateSelect').value)||builtinTemplates[0];
      const old=isDemo?[]:[...state.scenes]; state.scenes=bases;
      applyTemplate(template);
      if(old.length){state.scenes=[...old,...state.scenes];selectedSceneId=state.scenes[old.length]?.id||state.scenes[0]?.id;saveState();await renderAll();}
      setCaptureStatus('URL 쇼릴 생성 완료', `${urls.length}개 URL · ${template.title} · ${state.scenes.length}개 장면`, '');
    } else {
      if(isDemo)state.scenes=[]; state.scenes.push(...bases); selectedSceneId=bases[0].id; currentTime=Math.max(0,totalDuration()-bases[0].duration); saveState(); await renderAll(); setCaptureStatus('URL 캡처 완료','새 장면을 편집기에 추가했습니다.',''); location.hash='studio';
    }
  }catch(err){console.error(err);setCaptureStatus('URL 캡처에 실패했습니다',err.message,'error');toast(err.message,'error');}
  finally{$('#urlStoryButton').disabled=false;$('#urlSingleButton').disabled=false;}
}


async function handleMediaFiles(files) {
  const list=[...files].filter(file=>file.type.startsWith('image/')||file.type.startsWith('video/'));
  if(!list.length){toast('지원하는 이미지 또는 영상 파일이 없습니다.','error');return;}
  const isDemo=state.scenes.length&&state.scenes.every(s=>s.sourceType==='demo'); if(isDemo)state.scenes=[];
  for(const file of list){
    let scene;
    if(file.type.startsWith('video/')) scene=await makeVideoSceneFromBlob(file,{name:file.name.replace(/\.[^.]+$/,'')});
    else scene=await makeImageSceneFromBlob(file,{name:file.name.replace(/\.[^.]+$/,''),sourceType:'upload'});
    state.scenes.push(scene); selectedSceneId=scene.id;
  }
  saveState(); await renderAll(); toast(`${list.length}개 미디어를 추가했습니다.`); location.hash='studio';
}


async function captureScreen() {
  if(!navigator.mediaDevices?.getDisplayMedia){toast('이 브라우저에서는 화면 캡처를 지원하지 않습니다.','error');return;}
  let stream;
  try{
    stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
    const video=document.createElement('video'); video.srcObject=stream; video.muted=true; await video.play();
    await new Promise(resolve=>setTimeout(resolve,180));
    const shot=document.createElement('canvas'); shot.width=video.videoWidth; shot.height=video.videoHeight; shot.getContext('2d').drawImage(video,0,0);
    const blob=await new Promise(resolve=>shot.toBlob(resolve,'image/png',.94));
    const scene=await makeImageSceneFromBlob(blob,{name:`화면 캡처 ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}`,sourceType:'capture'});
    if(state.scenes.length&&state.scenes.every(s=>s.sourceType==='demo'))state.scenes=[]; state.scenes.push(scene); selectedSceneId=scene.id; saveState(); await renderAll(); toast('현재 화면을 장면으로 추가했습니다.'); location.hash='studio';
  }catch(err){ if(err?.name!=='NotAllowedError')toast(`화면 캡처 실패: ${err.message}`,'error'); }
  finally{stream?.getTracks().forEach(t=>t.stop());}
}

async function recordScreenClip() {
  const button=$('#screenRecordButton');
  if(screenRecording){
    try{screenRecording.recorder.stop();}catch{} screenRecording.stream.getTracks().forEach(t=>t.stop()); return;
  }
  if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder){toast('이 브라우저에서는 화면 녹화를 지원하지 않습니다.','error');return;}
  try{
    const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:false});
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';
    const recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:5_000_000}:undefined); const chunks=[];
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    recorder.onstop=async()=>{
      clearTimeout(screenRecording?.timer); button.textContent='화면 녹화 클립'; button.disabled=false;
      const blob=new Blob(chunks,{type:mime||'video/webm'}); screenRecording=null;
      if(!blob.size){toast('녹화된 데이터가 없습니다.','error');return;}
      try{const scene=await makeVideoSceneFromBlob(blob,{name:`화면 녹화 ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}`});if(state.scenes.length&&state.scenes.every(s=>s.sourceType==='demo'))state.scenes=[];state.scenes.push(scene);selectedSceneId=scene.id;saveState();await renderAll();toast('화면 녹화 클립을 장면으로 추가했습니다.');location.hash='studio';}catch(err){toast(`녹화 클립 처리 실패: ${err.message}`,'error');}
    };
    stream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(recorder.state!=='inactive')recorder.stop();},{once:true});
    recorder.start(250); screenRecording={stream,recorder,timer:setTimeout(()=>{if(recorder.state!=='inactive'){recorder.stop();stream.getTracks().forEach(t=>t.stop());}},30000)}; button.textContent='녹화 종료'; toast('화면 녹화를 시작했습니다. 최대 30초 후 자동 종료됩니다.');
  }catch(err){if(err?.name!=='NotAllowedError')toast(`화면 녹화 실패: ${err.message}`,'error');screenRecording=null;button.textContent='화면 녹화 클립';}
}

function updateSelectedScene(patch, render=true) {
  const scene=selectedScene(); if(!scene)return; Object.assign(scene,patch); saveState(); if(render)renderAll();
}

function duplicateSelectedScene() {
  const scene=selectedScene(); if(!scene)return; const idx=state.scenes.findIndex(s=>s.id===scene.id); const copy={...structuredClone(scene),id:createId('scene'),name:`${scene.name} 복사`}; state.scenes.splice(idx+1,0,copy); selectedSceneId=copy.id; saveState(); renderAll(); toast('장면을 복제했습니다.');
}

async function deleteSelectedScene() {
  const scene=selectedScene(); if(!scene)return; const idx=state.scenes.findIndex(s=>s.id===scene.id); state.scenes.splice(idx,1);
  if(scene.assetKey && !state.scenes.some(s=>s.assetKey===scene.assetKey))await deleteAsset(scene.assetKey).catch(()=>{});
  selectedSceneId=state.scenes[Math.min(idx,state.scenes.length-1)]?.id||null; currentTime=clamp(currentTime,0,totalDuration()); saveState(); renderAll(); toast('장면을 삭제했습니다.');
}

async function audioBufferForContext(context) {
  const duration=Math.max(totalDuration(),1);
  if(state.audio.preset==='none')return null;
  if(state.audio.preset==='custom'){
    if(!state.audio.assetKey)return null;
    if(customAudioBufferCache)return customAudioBufferCache;
    const blob=await getAsset(state.audio.assetKey); if(!blob)return null;
    const arr=await blob.arrayBuffer(); customAudioBufferCache=await context.decodeAudioData(arr.slice(0)); return customAudioBufferCache;
  }
  return createProceduralBuffer(context,state.audio.preset,duration);
}

async function startPreviewAudio(offset=0, output=true) {
  stopPreviewAudio();
  if(state.audio.preset==='none')return null;
  const context=new (window.AudioContext||window.webkitAudioContext)(); await context.resume();
  const buffer=await audioBufferForContext(context); if(!buffer){context.close();return null;}
  const source=context.createBufferSource(); source.buffer=buffer; source.loop=state.audio.preset==='custom'&&buffer.duration<Math.max(totalDuration(),1);
  const gain=context.createGain(); applyFade(gain.gain,context,state.audio.volume/100,totalDuration(),state.audio.fade,offset); source.connect(gain); if(output)gain.connect(context.destination);
  source.start(0,offset % buffer.duration);
  previewAudio={context,source,gain}; return previewAudio;
}

function stopPreviewAudio(){ if(!previewAudio)return; try{previewAudio.source.stop();}catch{} try{previewAudio.context.close();}catch{} previewAudio=null; }

async function togglePlay() {
  if(!state.scenes.length)return;
  if(playing){ pausePlayback(); return; }
  if(currentTime>=totalDuration()-.02)currentTime=0;
  playing=true; playStartStamp=performance.now()-currentTime*1000; $('#playButton .icon-play').hidden=true; $('#playButton .icon-pause').hidden=false;
  try{await startPreviewAudio(currentTime,true);}catch(err){console.warn('audio preview',err);}
  playbackLoop();
}

function pausePlayback(){ playing=false; cancelAnimationFrame(renderRaf); stopPreviewAudio(); videoCache.forEach(async p=>{try{(await p).pause();}catch{}}); $('#playButton .icon-play').hidden=false; $('#playButton .icon-pause').hidden=true; renderMeta(); }

async function playbackLoop(){
  if(!playing)return; currentTime=(performance.now()-playStartStamp)/1000; const total=totalDuration(); if(currentTime>=total){currentTime=total; await renderAt(currentTime); renderMeta(); pausePlayback(); return;} await renderAt(currentTime); renderMeta(); renderRaf=requestAnimationFrame(playbackLoop);
}

async function previewSoundOnly(){
  clearTimeout(soundPreviewTimer); stopPreviewAudio(); if(state.audio.preset==='none'){toast('사운드 없음이 선택되어 있습니다.');return;}
  try{await startPreviewAudio(0,true); $('#soundPreviewButton').textContent='정지'; soundPreviewTimer=setTimeout(()=>{stopPreviewAudio();$('#soundPreviewButton').textContent='미리듣기';},Math.min(6000,totalDuration()*1000||6000));}catch(err){toast(`사운드 재생 실패: ${err.message}`,'error');}
}

async function handleAudioFile(file){
  if(!file||!file.type.startsWith('audio/')){toast('오디오 파일을 선택해 주세요.','error');return;}
  if(state.audio.assetKey)await deleteAsset(state.audio.assetKey).catch(()=>{});
  const key=createId('audio'); await putAsset(key,file); state.audio={...state.audio,preset:'custom',assetKey:key,name:file.name}; customAudioBufferCache=null; saveState(); renderSound(); toast('오디오 파일을 프로젝트에 연결했습니다.');
}

function supportedMimeType(){ return ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type))||''; }

async function exportWebM(){
  if(exportInProgress)return; if(!state.scenes.length){toast('내보낼 장면이 없습니다.','error');return;} if(!canvas.captureStream||!window.MediaRecorder){toast('이 브라우저는 WebM 렌더링을 지원하지 않습니다. Chrome/Edge 최신 버전을 권장합니다.','error');return;}
  exportInProgress=true; pausePlayback(); currentTime=0; syncCanvasSize(); $('#exportButton').disabled=true; $('#exportStatus').textContent='렌더링 준비 중…'; $('#exportProgress').style.width='0%';
  let audioContext=null, audioSource=null;
  try{
    const videoStream=canvas.captureStream(30); const tracks=[...videoStream.getVideoTracks()];
    if(state.audio.preset!=='none'){
      audioContext=new (window.AudioContext||window.webkitAudioContext)(); await audioContext.resume(); const buffer=await audioBufferForContext(audioContext);
      if(buffer){ const dest=audioContext.createMediaStreamDestination(); const gain=audioContext.createGain(); applyFade(gain.gain,audioContext,state.audio.volume/100,totalDuration(),state.audio.fade,0); audioSource=audioContext.createBufferSource(); audioSource.buffer=buffer; audioSource.loop=state.audio.preset==='custom'&&buffer.duration<totalDuration(); audioSource.connect(gain).connect(dest); tracks.push(...dest.stream.getAudioTracks()); }
    }
    const stream=new MediaStream(tracks); const mimeType=supportedMimeType(); const recorder=new MediaRecorder(stream,mimeType?{mimeType,videoBitsPerSecond:state.resolution==='1920x1080'?9_000_000:5_000_000}:undefined); const chunks=[];
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);}; const stopped=new Promise(resolve=>recorder.addEventListener('stop',resolve,{once:true})); recorder.start(250); audioSource?.start(0);
    const total=totalDuration(); const start=performance.now();
    await new Promise((resolve,reject)=>{
      const frame=async()=>{ try{ const t=Math.min((performance.now()-start)/1000,total); currentTime=t; await renderAt(t); $('#exportProgress').style.width=`${total?Math.round(t/total*100):100}%`; $('#exportStatus').textContent=`렌더링 중 · ${Math.round(total?t/total*100:100)}%`; if(t>=total){resolve();return;} requestAnimationFrame(frame);}catch(err){reject(err);} }; frame();
    });
    recorder.stop(); await stopped; audioSource?.stop(); const blob=new Blob(chunks,{type:mimeType||'video/webm'}); const link=document.createElement('a'); const url=URL.createObjectURL(blob); link.href=url; link.download=`motionframe-${new Date().toISOString().slice(0,10)}.webm`; document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),10000); $('#exportStatus').textContent=`완료 · ${(blob.size/1024/1024).toFixed(1)} MB`; $('#exportProgress').style.width='100%'; toast('WebM 영상과 사운드 렌더링이 완료되었습니다.');
  }catch(err){console.error(err);$('#exportStatus').textContent='렌더링 실패';toast(`내보내기 실패: ${err.message}`,'error');}
  finally{try{audioContext?.close();}catch{} exportInProgress=false; $('#exportButton').disabled=false; currentTime=0; renderAll();}
}

function safeFileName(name){return String(name||'motionframe').replace(/[^a-z0-9가-힣_-]+/gi,'-').replace(/^-+|-+$/g,'')||'motionframe';}
function downloadJson(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
function dataUrlToBlob(dataUrl){const [meta,data]=dataUrl.split(',');const type=(meta.match(/data:([^;]+)/)||[])[1]||'application/octet-stream';const binary=atob(data);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type});}

async function exportProject(){
  const keys=[...new Set([...state.scenes.map(s=>s.assetKey).filter(Boolean),state.audio.assetKey].filter(Boolean))]; const assets={};
  for(const key of keys){const blob=await getAsset(key);if(blob)assets[key]={type:blob.type,data:await blobToDataUrl(blob)};}
  downloadJson({kind:'motionframe-project',version:2,createdAt:new Date().toISOString(),project:state,assets,customTemplates:loadCustomTemplates()},`motionframe-project-${new Date().toISOString().slice(0,10)}.json`); toast('프로젝트 백업 파일을 만들었습니다.');
}

async function importProjectFile(file){
  try{const data=JSON.parse(await file.text());if(data.kind!=='motionframe-project'||!data.project)throw new Error('MotionFrame 프로젝트 파일이 아닙니다.');for(const [key,item] of Object.entries(data.assets||{})){await putAsset(key,dataUrlToBlob(item.data));}state=sanitizeProject(data.project);if(Array.isArray(data.customTemplates))storeCustomTemplates(data.customTemplates);selectedSceneId=state.scenes[0]?.id||null;currentTime=0;saveState();setupSelectOptions();renderTemplates();renderTemplateFilters();await renderAll();toast('프로젝트를 불러왔습니다.');}catch(err){toast(`프로젝트 불러오기 실패: ${err.message}`,'error');}
}

async function importTemplateFile(file){
  try{const data=JSON.parse(await file.text());const templates=Array.isArray(data)?data:[data];const valid=templates.filter(t=>t&&Array.isArray(t.sequence));if(!valid.length)throw new Error('유효한 템플릿이 없습니다.');const customs=loadCustomTemplates();valid.forEach(t=>customs.unshift({...t,id:createId('custom'),category:'custom'}));storeCustomTemplates(customs);setupSelectOptions();templateFilter='custom';renderTemplateFilters();renderTemplates();toast(`${valid.length}개 템플릿을 가져왔습니다.`);}catch(err){toast(`템플릿 가져오기 실패: ${err.message}`,'error');}
}

async function resetProject(){
  pausePlayback(); const oldKeys=[...new Set([...state.scenes.map(s=>s.assetKey).filter(Boolean),state.audio.assetKey].filter(Boolean))]; for(const key of oldKeys)await deleteAsset(key).catch(()=>{}); state=demoProject();selectedSceneId=state.scenes[0].id;currentTime=0;customAudioBufferCache=null;saveState();await renderAll();toast('데모 프로젝트로 초기화했습니다.');
}

function bindInspector(){
  $('#sceneNameInput').addEventListener('input',e=>updateSelectedScene({name:e.target.value},false)); $('#sceneNameInput').addEventListener('change',()=>renderAll());
  $('#durationInput').addEventListener('change',e=>updateSelectedScene({duration:clamp(Number(e.target.value)||2.4,.8,15)})); $('#transitionSelect').addEventListener('change',e=>updateSelectedScene({transition:e.target.value}));
  $('#motionPresetSelect').addEventListener('change',e=>{const scene=selectedScene();if(!scene)return;const next=hydrateMotion(scene,e.target.value,{motionPreset:e.target.value,id:scene.id,name:scene.name});Object.assign(scene,next);saveState();renderAll();});
  ['startZoom','endZoom','startX','startY','endX','endY','cursorX','cursorY'].forEach(key=>{const input=$(`#${key}Input`);input.addEventListener('input',e=>{const scene=selectedScene();if(!scene)return;scene[key]=Number(e.target.value);scene.motionPreset='custom';const out=$(`#${key}Output`);if(out)out.textContent=`${e.target.value}%`;saveState();updatePreview();renderSceneCards();});});
  $('#cursorEnabledInput').addEventListener('change',e=>updateSelectedScene({cursorEnabled:e.target.checked,motionPreset:'custom'}));
}

function bindEvents(){
  $('#menuButton').addEventListener('click',()=>{const nav=$('#mobileNav');const open=nav.hidden;nav.hidden=!open;$('#menuButton').setAttribute('aria-expanded',String(open));});
  $$('#mobileNav a').forEach(a=>a.addEventListener('click',()=>{$('#mobileNav').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');}));
  $('#urlStoryButton').addEventListener('click',()=>captureUrl(true)); $('#urlSingleButton').addEventListener('click',()=>captureUrl(false)); $('#urlInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();captureUrl(true);}});
  $('#imageUploadButton').addEventListener('click',()=>$('#imageInput').click()); $('#imageInput').addEventListener('change',e=>{handleMediaFiles(e.target.files);e.target.value='';}); $('#screenCaptureButton').addEventListener('click',captureScreen); $('#screenRecordButton').addEventListener('click',recordScreenClip);
  $('#saveTemplateButton').addEventListener('click',()=>{$('#templateNameInput').value='';$('#templateSaveDialog').showModal();setTimeout(()=>$('#templateNameInput').focus(),30);});
  $('#templateSaveForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#templateNameInput').value.trim();if(!name)return;saveCurrentTemplate(name,$('#templateCategoryInput').value);$('#templateSaveDialog').close();});
  $('#importTemplateButton').addEventListener('click',()=>$('#templateFileInput').click()); $('#templateFileInput').addEventListener('change',e=>{if(e.target.files[0])importTemplateFile(e.target.files[0]);e.target.value='';});
  $('#aspectSelect').addEventListener('change',e=>{state.aspect=e.target.value;saveState();renderAll();}); $('#frameStyleSelect').addEventListener('change',e=>{state.frameStyle=e.target.value;saveState();updatePreview();}); $('#resolutionSelect').addEventListener('change',e=>{state.resolution=e.target.value;saveState();renderAll();});
  $('#duplicateSceneButton').addEventListener('click',duplicateSelectedScene); $('#deleteSceneButton').addEventListener('click',deleteSelectedScene);
  $('#playButton').addEventListener('click',togglePlay); $('#seekInput').addEventListener('input',e=>{pausePlayback();currentTime=Number(e.target.value);renderMeta();updatePreview();});
  $('#soundPresetSelect').addEventListener('change',e=>{stopPreviewAudio();state.audio.preset=e.target.value;saveState();renderSound();}); $('#volumeInput').addEventListener('input',e=>{state.audio.volume=Number(e.target.value);$('#volumeOutput').textContent=`${e.target.value}%`;saveState();}); $('#fadeAudioInput').addEventListener('change',e=>{state.audio.fade=e.target.checked;saveState();});
  $('#soundPreviewButton').addEventListener('click',()=>{if(previewAudio){stopPreviewAudio();clearTimeout(soundPreviewTimer);$('#soundPreviewButton').textContent='미리듣기';}else previewSoundOnly();}); $('#audioUploadButton').addEventListener('click',()=>$('#audioInput').click()); $('#audioInput').addEventListener('change',e=>{if(e.target.files[0])handleAudioFile(e.target.files[0]);e.target.value='';});
  $('#exportButton').addEventListener('click',exportWebM);
  $('#projectExportButton').addEventListener('click',exportProject); $('#mobileProjectExportButton').addEventListener('click',exportProject); $('#projectImportButton').addEventListener('click',()=>$('#projectFileInput').click()); $('#projectFileInput').addEventListener('change',e=>{if(e.target.files[0])importProjectFile(e.target.files[0]);e.target.value='';});
  $('#resetButton').addEventListener('click',()=>$('#resetDialog').showModal()); $('#confirmResetButton').addEventListener('click',()=>{setTimeout(resetProject,0);});
  window.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)){e.preventDefault();togglePlay();}if(e.key==='Escape'&&!$('#mobileNav').hidden){$('#mobileNav').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');}});
  window.addEventListener('beforeunload',()=>{stopPreviewAudio();assetUrlCache.forEach(url=>URL.revokeObjectURL(url));});
}

function browserSupportCheck(){
  const missing=[]; if(!('indexedDB'in window))missing.push('IndexedDB'); if(!window.MediaRecorder)missing.push('MediaRecorder'); if(!HTMLCanvasElement.prototype.captureStream)missing.push('Canvas captureStream');
  if(missing.length)setCaptureStatus('일부 기능 제한',`${missing.join(', ')} 기능이 없습니다. 최신 Chrome/Edge를 권장합니다.`,'error');
}

async function init(){
  state=loadState(); selectedSceneId=state.scenes[0]?.id||null; setupSelectOptions(); renderTemplateFilters(); renderTemplates(); bindInspector(); bindEvents(); browserSupportCheck(); await renderAll();
}

init().catch(err=>{console.error(err);toast(`초기화 실패: ${err.message}`,'error');});
