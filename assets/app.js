const STORAGE_KEY = "motionframe-project-v1";
const DB_NAME = "motionframe-assets";
const DB_VERSION = 1;
const STORE_NAME = "blobs";
const TRANSITION_MS = 320;
const FPS = 30;

const demoAssets = [
  new URL("./demo/dashboard.svg", import.meta.url).href,
  new URL("./demo/detail.svg", import.meta.url).href,
  new URL("./demo/report.svg", import.meta.url).href,
];

const dom = {
  fileInput: document.querySelector("#fileInput"),
  uploadButton: document.querySelector("#uploadButton"),
  captureButton: document.querySelector("#captureButton"),
  heroUploadButton: document.querySelector("#heroUploadButton"),
  heroCaptureButton: document.querySelector("#heroCaptureButton"),
  resetProjectButton: document.querySelector("#resetProjectButton"),
  mobileResetProjectButton: document.querySelector("#mobileResetProjectButton"),
  resetDialog: document.querySelector("#resetDialog"),
  confirmResetButton: document.querySelector("#confirmResetButton"),
  sceneList: document.querySelector("#sceneList"),
  sceneEmpty: document.querySelector("#sceneEmpty"),
  sceneCount: document.querySelector("#sceneCount"),
  canvas: document.querySelector("#previewCanvas"),
  canvasEmpty: document.querySelector("#canvasEmpty"),
  playButton: document.querySelector("#playButton"),
  playIcon: document.querySelector(".play-icon"),
  pauseIcon: document.querySelector(".pause-icon"),
  currentTime: document.querySelector("#currentTime"),
  totalTime: document.querySelector("#totalTime"),
  seekInput: document.querySelector("#seekInput"),
  timeline: document.querySelector("#timeline"),
  exportButton: document.querySelector("#exportButton"),
  exportProgress: document.querySelector("#exportProgress"),
  exportStatus: document.querySelector("#exportStatus"),
  supportBanner: document.querySelector("#supportBanner"),
  inspectorForm: document.querySelector("#inspectorForm"),
  inspectorEmpty: document.querySelector("#inspectorEmpty"),
  sceneNameInput: document.querySelector("#sceneNameInput"),
  durationInput: document.querySelector("#durationInput"),
  presetSelect: document.querySelector("#presetSelect"),
  startZoomInput: document.querySelector("#startZoomInput"),
  endZoomInput: document.querySelector("#endZoomInput"),
  endXInput: document.querySelector("#endXInput"),
  endYInput: document.querySelector("#endYInput"),
  startZoomOutput: document.querySelector("#startZoomOutput"),
  endZoomOutput: document.querySelector("#endZoomOutput"),
  endXOutput: document.querySelector("#endXOutput"),
  endYOutput: document.querySelector("#endYOutput"),
  cursorEnabledInput: document.querySelector("#cursorEnabledInput"),
  cursorControls: document.querySelector("#cursorControls"),
  cursorXInput: document.querySelector("#cursorXInput"),
  cursorYInput: document.querySelector("#cursorYInput"),
  cursorXOutput: document.querySelector("#cursorXOutput"),
  cursorYOutput: document.querySelector("#cursorYOutput"),
  duplicateButton: document.querySelector("#duplicateButton"),
  deleteButton: document.querySelector("#deleteButton"),
  toastStack: document.querySelector("#toastStack"),
  resolutionButtons: [...document.querySelectorAll(".resolution-button")],
  mobileMenuButton: document.querySelector("#mobileMenuButton"),
  mobileNavigation: document.querySelector("#mobileNavigation"),
};

const ctx = dom.canvas.getContext("2d", { alpha: false });
const imageCache = new Map();
const objectUrls = new Map();

const state = {
  scenes: [],
  selectedId: null,
  playheadMs: 0,
  playing: false,
  playStartedAt: 0,
  playStartedFrom: 0,
  exportRunning: false,
  width: 1280,
  height: 720,
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

function formatTime(ms) {
  const total = Math.max(0, ms) / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  const tenths = Math.floor((total % 1) * 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function defaultScene(name, source, sourceType = "demo", blobId = null) {
  return {
    id: uid(),
    name,
    source,
    sourceType,
    blobId,
    duration: 3.2,
    preset: "push-in",
    startZoom: 100,
    endZoom: 126,
    startX: 50,
    startY: 50,
    endX: 50,
    endY: 50,
    cursorEnabled: true,
    cursorStartX: 22,
    cursorStartY: 76,
    cursorX: 66,
    cursorY: 48,
  };
}

function createDemoScenes() {
  const first = defaultScene("대시보드 전체", demoAssets[0]);
  first.duration = 3.4;
  first.preset = "push-in";
  first.endZoom = 122;
  first.cursorX = 59;
  first.cursorY = 42;

  const second = defaultScene("핵심 지표 포커스", demoAssets[1]);
  second.duration = 3.1;
  second.preset = "detail";
  second.startZoom = 108;
  second.endZoom = 148;
  second.endX = 68;
  second.endY = 38;
  second.cursorStartX = 35;
  second.cursorStartY = 72;
  second.cursorX = 70;
  second.cursorY = 38;

  const third = defaultScene("리포트 결과", demoAssets[2]);
  third.duration = 3.3;
  third.preset = "left-to-right";
  third.startZoom = 112;
  third.endZoom = 122;
  third.startX = 38;
  third.endX = 66;
  third.cursorStartX = 44;
  third.cursorStartY = 62;
  third.cursorX = 78;
  third.cursorY = 66;

  return [first, second, third];
}

function getSelectedScene() {
  return state.scenes.find((scene) => scene.id === state.selectedId) ?? null;
}

function totalDurationMs() {
  return state.scenes.reduce((sum, scene) => sum + scene.duration * 1000, 0);
}

function sceneStartMs(sceneId) {
  let total = 0;
  for (const scene of state.scenes) {
    if (scene.id === sceneId) return total;
    total += scene.duration * 1000;
  }
  return 0;
}

function locateTime(ms) {
  const total = totalDurationMs();
  if (!state.scenes.length) return null;
  const safe = clamp(ms, 0, Math.max(0, total - 0.001));
  let cursor = 0;
  for (let index = 0; index < state.scenes.length; index += 1) {
    const scene = state.scenes[index];
    const durationMs = scene.duration * 1000;
    if (safe < cursor + durationMs || index === state.scenes.length - 1) {
      return {
        index,
        scene,
        localMs: safe - cursor,
        durationMs,
        startMs: cursor,
      };
    }
    cursor += durationMs;
  }
  return null;
}

function sanitizePersistedScene(scene) {
  return {
    id: scene.id,
    name: scene.name,
    source: scene.sourceType === "demo" ? scene.source : "",
    sourceType: scene.sourceType,
    blobId: scene.blobId,
    duration: scene.duration,
    preset: scene.preset,
    startZoom: scene.startZoom,
    endZoom: scene.endZoom,
    startX: scene.startX,
    startY: scene.startY,
    endX: scene.endX,
    endY: scene.endY,
    cursorEnabled: scene.cursorEnabled,
    cursorStartX: scene.cursorStartX,
    cursorStartY: scene.cursorStartY,
    cursorX: scene.cursorX,
    cursorY: scene.cursorY,
  };
}

function saveProject() {
  try {
    const payload = {
      version: 1,
      selectedId: state.selectedId,
      width: state.width,
      height: state.height,
      scenes: state.scenes.map(sanitizePersistedScene),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Project metadata could not be saved", error);
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("이 브라우저는 IndexedDB를 지원하지 않습니다."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB를 열 수 없습니다."));
  });
}

async function putBlob(id, blob) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error ?? new Error("이미지를 저장할 수 없습니다."));
  });
  db.close();
}

async function getBlob(id) {
  const db = await openDb();
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error("이미지를 읽을 수 없습니다."));
  });
  db.close();
  return result;
}

async function deleteBlob(id) {
  if (!id) return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error ?? new Error("이미지를 삭제할 수 없습니다."));
  });
  db.close();
}

async function clearBlobs() {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error ?? new Error("저장된 이미지를 초기화할 수 없습니다."));
  });
  db.close();
}

async function restoreProject() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.scenes = createDemoScenes();
    state.selectedId = state.scenes[0].id;
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.scenes)) throw new Error("invalid project");
    const restored = [];
    for (const scene of parsed.scenes) {
      if (scene.sourceType === "upload" && scene.blobId) {
        const blob = await getBlob(scene.blobId);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        objectUrls.set(scene.id, url);
        restored.push({ ...scene, source: url });
      } else {
        restored.push(scene);
      }
    }
    state.scenes = restored.length ? restored : createDemoScenes();
    state.selectedId = state.scenes.some((scene) => scene.id === parsed.selectedId) ? parsed.selectedId : state.scenes[0]?.id ?? null;
    if (parsed.width === 1920 && parsed.height === 1080) {
      state.width = 1920;
      state.height = 1080;
    }
  } catch (error) {
    console.warn("Saved project was invalid; demo project loaded", error);
    state.scenes = createDemoScenes();
    state.selectedId = state.scenes[0].id;
  }
}

function toast(message, type = "info") {
  const element = document.createElement("div");
  element.className = `toast ${type}`;
  element.textContent = message;
  dom.toastStack.append(element);
  requestAnimationFrame(() => element.classList.add("show"));
  setTimeout(() => {
    element.classList.remove("show");
    setTimeout(() => element.remove(), 220);
  }, 3200);
}

function showSupportInfo() {
  const missing = [];
  if (!window.MediaRecorder) missing.push("WebM 녹화");
  if (!HTMLCanvasElement.prototype.captureStream) missing.push("Canvas 영상 스트림");
  if (!navigator.mediaDevices?.getDisplayMedia) missing.push("화면 캡처");
  if (missing.length) {
    dom.supportBanner.className = "status-banner notice";
    dom.supportBanner.textContent = `현재 브라우저에서 일부 기능이 제한됩니다: ${missing.join(", ")}. 최신 Chrome 또는 Edge를 권장합니다.`;
  }
}

function getSupportedMimeType() {
  if (!window.MediaRecorder) return "";
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

async function preloadScenes() {
  await Promise.allSettled(state.scenes.map((scene) => loadImage(scene.source)));
}

function drawBaseBackground() {
  ctx.save();
  ctx.fillStyle = "#060a13";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();
}

function sourceRectForCamera(image, scene, progress) {
  const p = easeInOutCubic(clamp(progress, 0, 1));
  const zoom = lerp(scene.startZoom, scene.endZoom, p) / 100;
  const focusX = lerp(scene.startX, scene.endX, p) / 100;
  const focusY = lerp(scene.startY, scene.endY, p) / 100;
  const canvasAspect = state.width / state.height;
  const imageAspect = image.naturalWidth / image.naturalHeight;

  let baseWidth;
  let baseHeight;
  if (imageAspect >= canvasAspect) {
    baseHeight = image.naturalHeight;
    baseWidth = baseHeight * canvasAspect;
  } else {
    baseWidth = image.naturalWidth;
    baseHeight = baseWidth / canvasAspect;
  }

  const sourceWidth = baseWidth / zoom;
  const sourceHeight = baseHeight / zoom;
  const centerX = focusX * image.naturalWidth;
  const centerY = focusY * image.naturalHeight;
  const sx = clamp(centerX - sourceWidth / 2, 0, Math.max(0, image.naturalWidth - sourceWidth));
  const sy = clamp(centerY - sourceHeight / 2, 0, Math.max(0, image.naturalHeight - sourceHeight));
  return { sx, sy, sourceWidth, sourceHeight };
}

function drawSceneImage(image, scene, progress, alpha = 1) {
  const rect = sourceRectForCamera(image, scene, progress);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, rect.sx, rect.sy, rect.sourceWidth, rect.sourceHeight, 0, 0, state.width, state.height);
  ctx.restore();
}

function drawCursor(scene, progress, alpha = 1) {
  if (!scene.cursorEnabled) return;
  const moveT = easeOutQuint(clamp(progress / 0.62, 0, 1));
  const startX = scene.cursorStartX / 100 * state.width;
  const startY = scene.cursorStartY / 100 * state.height;
  const endX = scene.cursorX / 100 * state.width;
  const endY = scene.cursorY / 100 * state.height;
  const x = lerp(startX, endX, moveT);
  const y = lerp(startY, endY, moveT);
  const scale = state.width / 1280;

  ctx.save();
  ctx.globalAlpha = alpha;

  const clickProgress = clamp((progress - 0.60) / 0.18, 0, 1);
  if (clickProgress > 0 && clickProgress < 1) {
    ctx.beginPath();
    ctx.arc(endX, endY, (10 + 24 * clickProgress) * scale, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(111, 140, 255, ${0.82 * (1 - clickProgress)})`;
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.stroke();
  }

  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 27);
  ctx.lineTo(7.4, 20.4);
  ctx.lineTo(12.8, 31.5);
  ctx.lineTo(18.2, 28.9);
  ctx.lineTo(12.9, 17.9);
  ctx.lineTo(23, 17.2);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#15213c";
  ctx.lineWidth = 1.9;
  ctx.stroke();
  ctx.restore();
}

function drawPolishOverlay(alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(state.width / 2, state.height / 2, state.width * .18, state.width / 2, state.height / 2, state.width * .72);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(1,6,18,.10)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();
}

async function renderAtTime(ms) {
  drawBaseBackground();
  if (!state.scenes.length) return;

  const located = locateTime(ms);
  if (!located) return;
  const { scene, index, localMs, durationMs } = located;
  const progress = clamp(localMs / durationMs, 0, 1);

  try {
    const currentImage = await loadImage(scene.source);
    const transitionRatio = index > 0 ? clamp(localMs / TRANSITION_MS, 0, 1) : 1;

    if (index > 0 && transitionRatio < 1) {
      const previous = state.scenes[index - 1];
      const previousImage = await loadImage(previous.source);
      drawSceneImage(previousImage, previous, 1, 1);
      drawSceneImage(currentImage, scene, progress, easeInOutCubic(transitionRatio));
      drawCursor(previous, 1, 1 - transitionRatio);
      drawCursor(scene, progress, transitionRatio);
    } else {
      drawSceneImage(currentImage, scene, progress, 1);
      drawCursor(scene, progress, 1);
    }
    drawPolishOverlay();
  } catch (error) {
    ctx.save();
    ctx.fillStyle = "#101827";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#d5dceb";
    ctx.font = `${Math.round(state.width / 50)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("이미지를 불러올 수 없습니다.", state.width / 2, state.height / 2);
    ctx.restore();
  }
}

function updateTransport() {
  const total = totalDurationMs();
  dom.seekInput.max = String(Math.max(total, 1));
  dom.seekInput.value = String(clamp(state.playheadMs, 0, Math.max(total, 1)));
  dom.currentTime.textContent = formatTime(state.playheadMs);
  dom.totalTime.textContent = formatTime(total);
  dom.playIcon.hidden = state.playing;
  dom.pauseIcon.hidden = !state.playing;
  dom.playButton.setAttribute("aria-label", state.playing ? "일시정지" : "재생");
}

function play() {
  if (!state.scenes.length || state.exportRunning) return;
  const total = totalDurationMs();
  if (state.playheadMs >= total - 20) state.playheadMs = 0;
  state.playing = true;
  state.playStartedAt = performance.now();
  state.playStartedFrom = state.playheadMs;
  updateTransport();
  requestAnimationFrame(playLoop);
}

function pause() {
  state.playing = false;
  updateTransport();
}

async function playLoop(now) {
  if (!state.playing) return;
  const total = totalDurationMs();
  state.playheadMs = state.playStartedFrom + (now - state.playStartedAt);
  if (state.playheadMs >= total) {
    state.playheadMs = total;
    pause();
    await renderAtTime(Math.max(0, total - 0.001));
    return;
  }
  await renderAtTime(state.playheadMs);
  updateTransport();
  requestAnimationFrame(playLoop);
}

function applyPreset(scene, preset) {
  scene.preset = preset;
  if (preset === "custom") return;
  const presets = {
    "push-in": { startZoom: 100, endZoom: 126, startX: 50, startY: 50, endX: 50, endY: 50 },
    "pull-out": { startZoom: 138, endZoom: 104, startX: 50, startY: 50, endX: 50, endY: 50 },
    "left-to-right": { startZoom: 116, endZoom: 122, startX: 34, startY: 50, endX: 68, endY: 50 },
    "right-to-left": { startZoom: 116, endZoom: 122, startX: 68, startY: 50, endX: 34, endY: 50 },
    "top-to-bottom": { startZoom: 116, endZoom: 122, startX: 50, startY: 30, endX: 50, endY: 70 },
    detail: { startZoom: 108, endZoom: 148, startX: 50, startY: 50, endX: 68, endY: 38 },
  };
  Object.assign(scene, presets[preset]);
}

function updateInspector() {
  const scene = getSelectedScene();
  const hasScene = Boolean(scene);
  dom.inspectorForm.hidden = !hasScene;
  dom.inspectorEmpty.hidden = hasScene;
  if (!scene) return;

  dom.sceneNameInput.value = scene.name;
  dom.durationInput.value = String(scene.duration);
  dom.presetSelect.value = scene.preset;
  dom.startZoomInput.value = String(scene.startZoom);
  dom.endZoomInput.value = String(scene.endZoom);
  dom.endXInput.value = String(scene.endX);
  dom.endYInput.value = String(scene.endY);
  dom.cursorEnabledInput.checked = scene.cursorEnabled;
  dom.cursorXInput.value = String(scene.cursorX);
  dom.cursorYInput.value = String(scene.cursorY);
  dom.cursorControls.hidden = !scene.cursorEnabled;
  dom.startZoomOutput.textContent = `${scene.startZoom}%`;
  dom.endZoomOutput.textContent = `${scene.endZoom}%`;
  dom.endXOutput.textContent = `${scene.endX}%`;
  dom.endYOutput.textContent = `${scene.endY}%`;
  dom.cursorXOutput.textContent = `${scene.cursorX}%`;
  dom.cursorYOutput.textContent = `${scene.cursorY}%`;
}

function renderSceneList() {
  dom.sceneList.innerHTML = "";
  dom.sceneCount.textContent = String(state.scenes.length);
  dom.sceneEmpty.hidden = state.scenes.length > 0;
  dom.canvasEmpty.hidden = state.scenes.length > 0;

  state.scenes.forEach((scene, index) => {
    const item = document.createElement("div");
    item.className = `scene-item${scene.id === state.selectedId ? " selected" : ""}`;
    item.dataset.sceneId = scene.id;
    item.innerHTML = `
      <button class="scene-select" type="button" data-action="select" aria-label="${escapeHtml(scene.name)} 장면 선택"></button>
      <span class="scene-thumb"><img src="${scene.source}" alt="" /></span>
      <span class="scene-copy"><strong>${escapeHtml(scene.name)}</strong><span>${scene.duration.toFixed(1)}초 · ${presetLabel(scene.preset)}</span></span>
      <span class="scene-order">
        <button type="button" data-action="up" title="앞으로 이동" aria-label="${escapeHtml(scene.name)} 장면을 앞으로 이동" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-action="down" title="뒤로 이동" aria-label="${escapeHtml(scene.name)} 장면을 뒤로 이동" ${index === state.scenes.length - 1 ? "disabled" : ""}>↓</button>
      </span>
    `;
    dom.sceneList.append(item);
  });
}

function renderTimeline() {
  dom.timeline.innerHTML = "";
  for (const scene of state.scenes) {
    const segment = document.createElement("div");
    segment.className = `timeline-segment${scene.id === state.selectedId ? " selected" : ""}`;
    segment.style.flexGrow = String(Math.max(1, scene.duration));
    segment.innerHTML = `<button type="button" data-scene-id="${scene.id}" aria-label="${escapeHtml(scene.name)} 위치로 이동"><img src="${scene.source}" alt="" /></button><span>${scene.duration.toFixed(1)}s</span>`;
    dom.timeline.append(segment);
  }
}

function presetLabel(preset) {
  const labels = {
    "push-in": "중앙 줌인",
    "pull-out": "줌아웃",
    "left-to-right": "좌→우",
    "right-to-left": "우→좌",
    "top-to-bottom": "상→하",
    detail: "디테일",
    custom: "직접 설정",
  };
  return labels[preset] ?? "직접 설정";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]);
}

async function syncUi({ renderCanvas = true } = {}) {
  renderSceneList();
  renderTimeline();
  updateInspector();
  updateTransport();
  updateResolutionButtons();
  saveProject();
  if (renderCanvas) await renderAtTime(state.playheadMs);
}

function selectScene(id) {
  if (!state.scenes.some((scene) => scene.id === id)) return;
  state.selectedId = id;
  state.playheadMs = sceneStartMs(id);
  pause();
  syncUi();
}

async function addImageBlob(blob, name) {
  const id = uid();
  const blobId = `asset-${id}`;
  await putBlob(blobId, blob);
  const url = URL.createObjectURL(blob);
  objectUrls.set(id, url);
  const scene = defaultScene(name, url, "upload", blobId);
  scene.id = id;
  state.scenes.push(scene);
  state.selectedId = scene.id;
  state.playheadMs = sceneStartMs(scene.id);
  await loadImage(url);
  await syncUi();
}

async function handleFiles(files) {
  const supported = [...files].filter((file) => file.type.startsWith("image/"));
  if (!supported.length) {
    toast("PNG, JPG, WebP 같은 이미지 파일을 선택해 주세요.", "error");
    return;
  }
  try {
    for (const file of supported) {
      await addImageBlob(file, file.name.replace(/\.[^.]+$/, ""));
    }
    toast(`${supported.length}개 장면을 추가했습니다.`, "success");
  } catch (error) {
    console.error(error);
    toast("이미지를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.", "error");
  }
}

async function captureScreenFrame() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    toast("이 브라우저는 화면 캡처를 지원하지 않습니다. 최신 Chrome 또는 Edge를 사용해 주세요.", "error");
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 30 } },
      audio: false,
    });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    await new Promise((resolve) => {
      if (video.readyState >= 2) resolve();
      else video.addEventListener("loadeddata", resolve, { once: true });
    });

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const temp = document.createElement("canvas");
    temp.width = width;
    temp.height = height;
    const tempCtx = temp.getContext("2d");
    tempCtx.drawImage(video, 0, 0, width, height);
    const blob = await new Promise((resolve) => temp.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("capture failed");
    await addImageBlob(blob, `화면 캡처 ${state.scenes.length + 1}`);
    toast("선택한 화면의 현재 프레임을 장면으로 추가했습니다.", "success");
  } catch (error) {
    if (error?.name !== "NotAllowedError") console.error(error);
    toast(error?.name === "NotAllowedError" ? "화면 공유가 취소되었습니다." : "화면을 캡처하지 못했습니다.", error?.name === "NotAllowedError" ? "info" : "error");
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

async function duplicateSelectedScene() {
  const scene = getSelectedScene();
  if (!scene) return;
  let clone;
  if (scene.sourceType === "upload" && scene.blobId) {
    const blob = await getBlob(scene.blobId);
    if (!blob) {
      toast("원본 이미지를 찾지 못해 복제할 수 없습니다.", "error");
      return;
    }
    const id = uid();
    const blobId = `asset-${id}`;
    await putBlob(blobId, blob);
    const url = URL.createObjectURL(blob);
    objectUrls.set(id, url);
    clone = { ...scene, id, blobId, source: url, name: `${scene.name} 복사본` };
  } else {
    clone = { ...scene, id: uid(), name: `${scene.name} 복사본` };
  }
  const index = state.scenes.findIndex((item) => item.id === scene.id);
  state.scenes.splice(index + 1, 0, clone);
  state.selectedId = clone.id;
  state.playheadMs = sceneStartMs(clone.id);
  await syncUi();
  toast("장면을 복제했습니다.", "success");
}

async function deleteSelectedScene() {
  const scene = getSelectedScene();
  if (!scene) return;
  const index = state.scenes.findIndex((item) => item.id === scene.id);
  state.scenes.splice(index, 1);
  if (scene.sourceType === "upload") {
    await deleteBlob(scene.blobId).catch(console.warn);
    const objectUrl = objectUrls.get(scene.id);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrls.delete(scene.id);
  }
  const next = state.scenes[Math.min(index, state.scenes.length - 1)] ?? null;
  state.selectedId = next?.id ?? null;
  state.playheadMs = next ? sceneStartMs(next.id) : 0;
  pause();
  await syncUi();
  toast("장면을 삭제했습니다.", "success");
}

function moveScene(id, direction) {
  const index = state.scenes.findIndex((scene) => scene.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= state.scenes.length) return;
  const [scene] = state.scenes.splice(index, 1);
  state.scenes.splice(target, 0, scene);
  state.playheadMs = sceneStartMs(state.selectedId);
  syncUi();
}

function updateSelectedScene(patch, custom = true) {
  const scene = getSelectedScene();
  if (!scene) return;
  Object.assign(scene, patch);
  if (custom && !Object.prototype.hasOwnProperty.call(patch, "preset")) scene.preset = "custom";
  pause();
  saveProject();
  renderSceneList();
  renderTimeline();
  updateInspector();
  renderAtTime(state.playheadMs);
}

function updateResolutionButtons() {
  const value = `${state.width}x${state.height}`;
  dom.resolutionButtons.forEach((button) => button.classList.toggle("active", button.dataset.resolution === value));
  dom.canvas.width = state.width;
  dom.canvas.height = state.height;
}

async function setResolution(value) {
  const [width, height] = value.split("x").map(Number);
  state.width = width;
  state.height = height;
  updateResolutionButtons();
  saveProject();
  await renderAtTime(state.playheadMs);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exportWebM() {
  if (state.exportRunning || !state.scenes.length) return;
  const mimeType = getSupportedMimeType();
  if (!mimeType || !dom.canvas.captureStream) {
    toast("이 브라우저에서는 WebM 내보내기를 사용할 수 없습니다. 최신 Chrome 또는 Edge를 사용해 주세요.", "error");
    return;
  }

  pause();
  state.exportRunning = true;
  dom.exportButton.disabled = true;
  dom.uploadButton.disabled = true;
  dom.captureButton.disabled = true;
  dom.exportProgress.style.width = "0%";

  const originalPlayhead = state.playheadMs;
  const totalMs = totalDurationMs();
  const stream = dom.canvas.captureStream(FPS);
  const chunks = [];
  let recorder;

  try {
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: state.width >= 1920 ? 10_000_000 : 6_000_000,
    });
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(recorder.error ?? new Error("WebM 인코딩 오류"));
    });
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };

    recorder.start(1000);
    const frameMs = 1000 / FPS;
    const totalFrames = Math.max(1, Math.ceil(totalMs / frameMs));
    const exportStartedAt = performance.now();

    for (let frame = 0; frame < totalFrames; frame += 1) {
      const targetMs = Math.min(totalMs - .001, frame * frameMs);
      await renderAtTime(targetMs);
      const progress = (frame + 1) / totalFrames;
      dom.exportProgress.style.width = `${Math.round(progress * 100)}%`;
      dom.exportStatus.textContent = `렌더링 중 ${Math.round(progress * 100)}% · 탭을 닫지 마세요`;

      const expectedElapsed = (frame + 1) * frameMs;
      const actualElapsed = performance.now() - exportStartedAt;
      const wait = expectedElapsed - actualElapsed;
      if (wait > 0) await sleep(wait);
      else await sleep(0);
    }

    await sleep(120);
    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: mimeType });
    if (!blob.size) throw new Error("empty webm");
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    anchor.download = `motionframe-${state.width}x${state.height}-${stamp}.webm`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 10_000);
    dom.exportStatus.textContent = `완료 · ${(blob.size / 1024 / 1024).toFixed(1)}MB`;
    toast("WebM 렌더링이 완료되어 다운로드를 시작했습니다.", "success");
  } catch (error) {
    console.error(error);
    try {
      if (recorder?.state === "recording") recorder.stop();
    } catch {}
    dom.exportStatus.textContent = "내보내기 실패";
    toast("WebM을 만들지 못했습니다. 브라우저 지원 여부와 메모리를 확인해 주세요.", "error");
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    state.exportRunning = false;
    dom.exportButton.disabled = false;
    dom.uploadButton.disabled = false;
    dom.captureButton.disabled = false;
    state.playheadMs = originalPlayhead;
    await renderAtTime(state.playheadMs);
    updateTransport();
  }
}

async function resetProject() {
  pause();
  for (const url of objectUrls.values()) URL.revokeObjectURL(url);
  objectUrls.clear();
  imageCache.clear();
  await clearBlobs().catch(console.warn);
  localStorage.removeItem(STORAGE_KEY);
  state.scenes = createDemoScenes();
  state.selectedId = state.scenes[0].id;
  state.playheadMs = 0;
  state.width = 1280;
  state.height = 720;
  await preloadScenes();
  await syncUi();
  toast("기본 데모 프로젝트로 초기화했습니다.", "success");
}

function openResetDialog() {
  if (typeof dom.resetDialog.showModal === "function") dom.resetDialog.showModal();
  else if (window.confirm("프로젝트를 초기화하고 기본 데모로 돌아갈까요?")) resetProject();
}

function bindEvents() {
  [dom.uploadButton, dom.heroUploadButton].forEach((button) => button.addEventListener("click", () => dom.fileInput.click()));
  [dom.captureButton, dom.heroCaptureButton].forEach((button) => button.addEventListener("click", captureScreenFrame));
  dom.fileInput.addEventListener("change", async () => {
    await handleFiles(dom.fileInput.files);
    dom.fileInput.value = "";
  });

  dom.sceneList.addEventListener("click", (event) => {
    const item = event.target.closest(".scene-item");
    if (!item) return;
    const actionButton = event.target.closest("[data-action]");
    const action = actionButton?.dataset.action ?? "select";
    if (action === "up") moveScene(item.dataset.sceneId, -1);
    else if (action === "down") moveScene(item.dataset.sceneId, 1);
    else selectScene(item.dataset.sceneId);
  });

  dom.timeline.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scene-id]");
    if (button) selectScene(button.dataset.sceneId);
  });

  dom.playButton.addEventListener("click", () => state.playing ? pause() : play());
  dom.seekInput.addEventListener("input", async () => {
    pause();
    state.playheadMs = Number(dom.seekInput.value);
    updateTransport();
    await renderAtTime(state.playheadMs);
  });

  dom.sceneNameInput.addEventListener("input", () => updateSelectedScene({ name: dom.sceneNameInput.value || "이름 없는 장면" }, false));
  dom.durationInput.addEventListener("change", () => {
    const value = clamp(Number(dom.durationInput.value) || 3, 1, 12);
    updateSelectedScene({ duration: value }, false);
    state.playheadMs = sceneStartMs(state.selectedId);
    updateTransport();
  });
  dom.presetSelect.addEventListener("change", () => {
    const scene = getSelectedScene();
    if (!scene) return;
    applyPreset(scene, dom.presetSelect.value);
    state.playheadMs = sceneStartMs(scene.id);
    pause();
    syncUi();
  });
  dom.startZoomInput.addEventListener("input", () => updateSelectedScene({ startZoom: Number(dom.startZoomInput.value) }));
  dom.endZoomInput.addEventListener("input", () => updateSelectedScene({ endZoom: Number(dom.endZoomInput.value) }));
  dom.endXInput.addEventListener("input", () => updateSelectedScene({ endX: Number(dom.endXInput.value) }));
  dom.endYInput.addEventListener("input", () => updateSelectedScene({ endY: Number(dom.endYInput.value) }));
  dom.cursorEnabledInput.addEventListener("change", () => updateSelectedScene({ cursorEnabled: dom.cursorEnabledInput.checked }, false));
  dom.cursorXInput.addEventListener("input", () => updateSelectedScene({ cursorX: Number(dom.cursorXInput.value) }, false));
  dom.cursorYInput.addEventListener("input", () => updateSelectedScene({ cursorY: Number(dom.cursorYInput.value) }, false));
  dom.duplicateButton.addEventListener("click", duplicateSelectedScene);
  dom.deleteButton.addEventListener("click", deleteSelectedScene);
  dom.exportButton.addEventListener("click", exportWebM);

  dom.resolutionButtons.forEach((button) => button.addEventListener("click", () => setResolution(button.dataset.resolution)));

  dom.resetProjectButton.addEventListener("click", openResetDialog);
  dom.mobileResetProjectButton.addEventListener("click", openResetDialog);
  dom.resetDialog.addEventListener("close", () => {
    if (dom.resetDialog.returnValue === "confirm") resetProject();
  });

  dom.mobileMenuButton.addEventListener("click", () => {
    const open = dom.mobileMenuButton.getAttribute("aria-expanded") === "true";
    dom.mobileMenuButton.setAttribute("aria-expanded", String(!open));
    dom.mobileMenuButton.setAttribute("aria-label", open ? "메뉴 열기" : "메뉴 닫기");
    dom.mobileNavigation.hidden = open;
  });
  dom.mobileNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      dom.mobileNavigation.hidden = true;
      dom.mobileMenuButton.setAttribute("aria-expanded", "false");
      dom.mobileMenuButton.setAttribute("aria-label", "메뉴 열기");
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.mobileNavigation.hidden) {
      dom.mobileNavigation.hidden = true;
      dom.mobileMenuButton.setAttribute("aria-expanded", "false");
      dom.mobileMenuButton.setAttribute("aria-label", "메뉴 열기");
      dom.mobileMenuButton.focus();
    }
  });
}

async function init() {
  showSupportInfo();
  bindEvents();
  await restoreProject();
  updateResolutionButtons();
  await preloadScenes();
  await syncUi();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    const swUrl = new URL("../service-worker.js", import.meta.url);
    navigator.serviceWorker.register(swUrl).catch((error) => console.warn("Service worker registration failed", error));
  }
}

init().catch((error) => {
  console.error(error);
  toast("편집기를 초기화하지 못했습니다. 페이지를 새로고침해 주세요.", "error");
});
