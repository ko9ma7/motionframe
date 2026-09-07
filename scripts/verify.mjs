import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = [];
const mustExist = [
  'index.html','404.html','favicon.svg','manifest.webmanifest','robots.txt','sitemap.xml','.nojekyll',
  'assets/styles.css','assets/app.js','assets/templates.js','assets/audio.js','assets/director.js','.github/workflows/deploy.yml'
];

for (const file of mustExist) {
  if (!fs.existsSync(path.join(root,file))) failures.push(`missing: ${file}`);
}

const read = (file) => fs.readFileSync(path.join(root,file),'utf8');
const html = read('index.html');
const app = read('assets/app.js');
const templateSource = read('assets/templates.js');
const audio = read('assets/audio.js');
const director = read('assets/director.js');
const css = read('assets/styles.css');
const workflow = read('.github/workflows/deploy.yml');
const domFunctionMatch = app.match(/const DOM_FUNCTION = `([\s\S]*?)`;/);
if (!domFunctionMatch) failures.push('DOM_FUNCTION not found');
else if (Buffer.byteLength(domFunctionMatch[1], 'utf8') > 1024) failures.push(`DOM_FUNCTION exceeds Microlink free function limit: ${Buffer.byteLength(domFunctionMatch[1], 'utf8')} bytes`);

function checkModuleSyntax(file) {
  const source = read(file);
  const result = spawnSync(process.execPath, ['--input-type=module','--check'], { input: source, encoding: 'utf8' });
  if (result.status !== 0) failures.push(`module syntax failed: ${file}\n${result.stderr.trim()}`);
}

checkModuleSyntax('assets/app.js');
checkModuleSyntax('assets/templates.js');
checkModuleSyntax('assets/audio.js');
checkModuleSyntax('assets/director.js');

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
const allowedTransitions = new Set(['crossfade','slide','zoom-out','page-flow','cut']);
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
  ['cinematic camera framing', app.includes('targetX - sw * clamp(anchorX') && app.includes('focusAnchorX') && app.includes('shotTiming')],
  ['same-page continuity', app.includes('sceneMediaIdentity') && app.includes('sameMedia') && app.includes("samePage ? 'cut'")],
  ['cursor source projection', app.includes('projectSourcePointToFrame') && app.includes('cursorStartX') && app.includes('clickStart')],
  ['page-flow transition', app.includes("scene.transition === 'page-flow'") && html.includes('value="page-flow"')],
  ['wall-synced WebM export', app.includes('captureStream(0)') && app.includes('requestFrame') && app.includes('wallStart') && app.includes('performance.now()-wallStart')],
  ['scene sound accents', audio.includes('addSceneAccents') && app.includes('addSceneAccents(createProceduralBuffer')],
  ['URL capture primary', app.includes('fetchMicrolinkCapture') && app.includes('screenshot.fullPage')],
  ['URL capture fallback', app.includes('fetchMshotsCapture') && app.includes('s.wordpress.com/mshots/v1')],
  ['URL capture feedback', html.includes('captureStatus') && app.includes('사이트 구조 분석 시작')],
  ['DOM geometry capture', app.includes('DOM_FUNCTION') && app.includes('getBoundingClientRect') && app.includes('data.headings.selectorAll') && html.includes('domAnalysis')],
  ['visual media detection', app.includes('main img') && app.includes("m?'media'") && director.includes("role === 'media'")],
  ['link-aware auto director', html.includes('directorFlow') && app.includes('createDirectorPlan') && app.includes('buildDirectorScenes') && director.includes('matchLinkToPage')],
  ['per-link behavior editor', html.includes('applyDirectorButton') && app.includes('director-behavior') && director.includes("behavior === 'navigate'")],
  ['auto follow internal pages', html.includes('autoFollowInput') && app.includes('suggestInternalLinks') && app.includes('queue.push(suggestion.href)') && app.includes('queue.length < 3')],
  ['template library UI', html.includes('templateGrid') && html.includes('templateSearchInput') && html.includes('24 BUILT-IN')],
  ['visual motion path editor', html.includes('motionPathOverlay') && html.includes('pathEditButton') && app.includes('sampleMotionPath') && app.includes('bindPathEditor')],
  ['template application', app.includes('applyTemplate(template)') && app.includes('directorTemplateId = template.id')],
  ['custom template persistence', app.includes('motionframe:v6:templates') && app.includes('updateCustomTemplate')],
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

const directorModule = await import(`${pathToFileURL(path.join(root,'assets/director.js')).href}?verify=${Date.now()}`);
const syntheticPages = [
  { id:'p0', name:'Home', sourceUrl:'https://example.com/', sourceAnalysis:{ url:'https://example.com/', title:'Home', captureMode:'full', documentWidth:1440, documentHeight:3000, viewportWidth:1440, viewportHeight:1000, elements:[
    {id:'h1',tag:'h1',text:'Build faster',x:420,y:360,top:320,w:500,h:80,inNav:false},
    {id:'h2',tag:'h2',text:'Automation features',x:500,y:1300,top:1260,w:450,h:60,inNav:false},
    {id:'nav',tag:'a',text:'Features',href:'https://example.com/features',x:980,y:58,top:40,w:90,h:30,inNav:true}
  ]}},
  { id:'p1', name:'Features', sourceUrl:'https://example.com/features', sourceAnalysis:{ url:'https://example.com/features', title:'Features', captureMode:'full', documentWidth:1440, documentHeight:2600, viewportWidth:1440, viewportHeight:1000, elements:[
    {id:'h1b',tag:'h1',text:'Features',x:430,y:330,top:300,w:400,h:70,inNav:false},
    {id:'cta',tag:'a',text:'Start free',href:'https://example.com/signup',x:860,y:2020,top:1980,w:160,h:48,inNav:false}
  ]}}
];
const syntheticPlan = directorModule.createDirectorPlan(syntheticPages,{detail:'standard'});
const syntheticBeats = directorModule.buildBeatSpecs(syntheticPlan);
if (!syntheticPlan.pages[0].elements.some((item)=>item.behavior==='navigate' && item.text==='Features')) failures.push('director did not connect matching nav link to next page');
if (!syntheticBeats.some((item)=>item.behavior==='navigate' && item.targetPageIndex===1)) failures.push('director beats missing page navigation');
if (!syntheticBeats.some((item)=>item.label==='Automation features')) failures.push('director beats missing semantic section focus');
const editablePlan = structuredClone(syntheticPlan);
const homeSection = editablePlan.pages[0].elements.find((item)=>item.text==='Automation features');
directorModule.setElementBehavior(editablePlan,0,homeSection.id,'skip');
if (directorModule.buildBeatSpecs(editablePlan).some((item)=>item.label==='Automation features')) failures.push('director element override did not remove skipped beat');
const navElement = editablePlan.pages[0].elements.find((item)=>item.text==='Features');
directorModule.setElementBehavior(editablePlan,0,navElement.id,'click');
if (directorModule.buildBeatSpecs(editablePlan).some((item)=>item.behavior==='navigate' && item.pageIndex===0)) failures.push('director navigation override did not update route');

const homeOverview = syntheticBeats.find((item)=>item.pageIndex===0 && item.role==='overview');
const homeHero = syntheticBeats.find((item)=>item.pageIndex===0 && item.role==='hero');
if (!homeOverview || !(homeOverview.y > 10 && homeOverview.y < 20)) failures.push('director overview does not frame first viewport of full-page capture');
if (!homeHero || homeHero.zoom > 120) failures.push('director hero framing zoom is too aggressive');
if (!homeHero || !(homeHero.anchorX < .5)) failures.push('director hero framing does not preserve left-aligned copy context');
if (!syntheticBeats.some((item)=>item.intent==='navigate')) failures.push('director beats missing cinematic navigation intent');

if (/Lorem ipsum|TODO|FIXME/.test(html + app + templateSource + audio + director)) failures.push('placeholder/TODO text found');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Verification passed: ${builtinTemplates.length} templates, ${Object.keys(motionPresets).length} motion presets, ${checks.length} feature checks, ${mustExist.length} required files, ${appStaticIds.length} DOM references.`);
