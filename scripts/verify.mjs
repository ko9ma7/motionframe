import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = [];
const mustExist = [
  'index.html','404.html','favicon.svg','manifest.webmanifest','robots.txt','sitemap.xml','.nojekyll',
  'assets/styles.css','assets/app.js','assets/templates.js','assets/audio.js','.github/workflows/deploy.yml'
];

for (const file of mustExist) {
  if (!fs.existsSync(path.join(root,file))) failures.push(`missing: ${file}`);
}

const read = (file) => fs.readFileSync(path.join(root,file),'utf8');
const html = read('index.html');
const app = read('assets/app.js');
const templateSource = read('assets/templates.js');
const audio = read('assets/audio.js');
const css = read('assets/styles.css');
const workflow = read('.github/workflows/deploy.yml');

function checkModuleSyntax(file) {
  const source = read(file);
  const result = spawnSync(process.execPath, ['--input-type=module','--check'], { input: source, encoding: 'utf8' });
  if (result.status !== 0) failures.push(`module syntax failed: ${file}\n${result.stderr.trim()}`);
}

checkModuleSyntax('assets/app.js');
checkModuleSyntax('assets/templates.js');
checkModuleSyntax('assets/audio.js');

const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id,index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) failures.push(`duplicate HTML ids: ${duplicateIds.join(', ')}`);
const idSet = new Set(ids);
const appStaticIds = [...app.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map((match) => match[1]);
const missingIds = [...new Set(appStaticIds.filter((id) => !idSet.has(id)))];
if (missingIds.length) failures.push(`app references missing HTML ids: ${missingIds.join(', ')}`);

const templatesModule = await import(`${pathToFileURL(path.join(root,'assets/templates.js')).href}?verify=${Date.now()}`);
const { builtinTemplates, motionPresets } = templatesModule;
if (builtinTemplates.length < 20) failures.push(`need at least 20 builtin templates, found ${builtinTemplates.length}`);
const templateIds = new Set();
const allowedTransitions = new Set(['crossfade','slide','zoom-out','cut']);
for (const template of builtinTemplates) {
  if (!template.id || templateIds.has(template.id)) failures.push(`duplicate/invalid template id: ${template.id}`);
  templateIds.add(template.id);
  if (!template.title || !template.description) failures.push(`template missing copy: ${template.id}`);
  if (!Array.isArray(template.sequence) || template.sequence.length < 3) failures.push(`template sequence too short: ${template.id}`);
  for (const [index, step] of (template.sequence || []).entries()) {
    if (!motionPresets[step.motion]) failures.push(`unknown motion ${step.motion} in ${template.id}#${index}`);
    if (!Number.isFinite(Number(step.duration)) || Number(step.duration) <= 0) failures.push(`invalid duration in ${template.id}#${index}`);
    if (!allowedTransitions.has(step.transition)) failures.push(`invalid transition in ${template.id}#${index}: ${String(step.transition)}`);
  }
}

const checks = [
  ['URL list parser', app.includes("split(/\\n+/)") && app.includes('parseUrlList')],
  ['URL capture primary', app.includes('fetchMicrolinkCapture') && app.includes('screenshot.fullPage')],
  ['URL capture fallback', app.includes('fetchMshotsCapture') && app.includes('s.wordpress.com/mshots/v1')],
  ['URL capture feedback', html.includes('captureStatus') && app.includes('사이트 브라우저 캡처 시작')],
  ['DOM-aware capture', app.includes('data.headings.selectorAll') && app.includes('data.buttons.selectorAll') && app.includes('buildSemanticStory') && html.includes('domAnalysis')],
  ['template library UI', html.includes('templateGrid') && html.includes('templateSearchInput') && html.includes('24 BUILT-IN')],
  ['visual motion path editor', html.includes('motionPathOverlay') && html.includes('pathEditButton') && app.includes('sampleMotionPath') && app.includes('bindPathEditor')],
  ['template application', app.includes('applyTemplate(template)') && app.includes('state = demoProject()')],
  ['custom template persistence', app.includes('motionframe:v4:templates') && app.includes('updateCustomTemplate')],
  ['audio presets', html.includes('soundPresetSelect') && html.includes('soundPresetGrid') && audio.includes('createProceduralBuffer') && audio.includes('Ambient Flow')],
  ['custom audio upload', html.includes('audioInput') && app.includes('decodeAudioData')],
  ['video scene support', html.includes('screenRecordButton') && app.includes('makeVideoSceneFromBlob')],
  ['screen recording', app.includes('getDisplayMedia') && app.includes('MediaRecorder(stream')],
  ['WebM audio/video mux', app.includes('createMediaStreamDestination') && app.includes('canvas.captureStream')],
  ['IndexedDB persistence', app.includes('indexedDB.open') && app.includes('createObjectStore')],
  ['responsive guards', css.includes('@media (max-width: 720px)') && css.includes('overflow-x: hidden')],
  ['boot watchdog', html.includes('__motionframeReady') && app.includes('window.__motionframeReady = true')],
  ['project backup', app.includes('motionframe-project') && html.includes('projectExportButton')],
  ['GitHub Pages workflow', workflow.includes('actions/deploy-pages@v4') && workflow.includes('node scripts/verify.mjs')]
];
for (const [name, ok] of checks) if (!ok) failures.push(`check failed: ${name}`);

if (/Lorem ipsum|TODO|FIXME/.test(html + app + templateSource + audio)) failures.push('placeholder/TODO text found');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Verification passed: ${builtinTemplates.length} templates, ${Object.keys(motionPresets).length} motion presets, ${checks.length} feature checks, ${mustExist.length} required files, ${appStaticIds.length} DOM references.`);
