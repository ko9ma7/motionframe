import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mustExist = [
  'index.html','404.html','favicon.svg','manifest.webmanifest','robots.txt','sitemap.xml','.nojekyll',
  'assets/styles.css','assets/app.js','assets/templates.js','assets/audio.js','.github/workflows/deploy.yml'
];
const failures = [];
for (const file of mustExist) if (!fs.existsSync(path.join(root,file))) failures.push(`missing: ${file}`);
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const js = fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
const templates = fs.readFileSync(path.join(root,'assets/templates.js'),'utf8');
const css = fs.readFileSync(path.join(root,'assets/styles.css'),'utf8');
const checks = [
  ['URL capture UI', html.includes('urlStoryButton') && js.includes('api.microlink.io') && js.includes('screenshot.fullPage') && js.includes('parseUrlList')],
  ['template library', html.includes('templateGrid') && templates.includes('Website Story') && templates.includes('Launch Cuts')],
  ['custom template persistence', js.includes('motionframe:v2:templates') && js.includes('updateCustomTemplate')],
  ['audio presets', html.includes('soundPresetSelect') && js.includes('createProceduralBuffer')],
  ['custom audio upload', html.includes('audioInput') && js.includes('decodeAudioData')],
  ['video scene support', html.includes('screenRecordButton') && js.includes('makeVideoSceneFromBlob') && js.includes('videoForScene')],
  ['screen recording', js.includes('getDisplayMedia') && js.includes('screenRecording') && js.includes('MediaRecorder(stream')],
  ['WebM audio/video mux', js.includes('createMediaStreamDestination') && js.includes('MediaRecorder') && js.includes('canvas.captureStream')],
  ['IndexedDB persistence', js.includes('indexedDB.open') && js.includes("createObjectStore")],
  ['responsive guards', css.includes('@media (max-width: 720px)') && css.includes('overflow-x: hidden')],
  ['project backup', js.includes('motionframe-project') && html.includes('projectExportButton')],
  ['GitHub Pages workflow', fs.readFileSync(path.join(root,'.github/workflows/deploy.yml'),'utf8').includes('actions/deploy-pages@v4')]
];
for (const [name,ok] of checks) if (!ok) failures.push(`check failed: ${name}`);
if (/Lorem ipsum|TODO|FIXME/.test(html + js + templates)) failures.push('placeholder/TODO text found');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Verification passed (${checks.length} feature checks, ${mustExist.length} required files).`);
