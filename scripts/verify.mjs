import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const failures=[];
const required=['index.html','404.html','favicon.svg','manifest.webmanifest','robots.txt','sitemap.xml','.nojekyll','assets/styles.css','assets/app.js','assets/templates.js','assets/audio.js','assets/director.js','.github/workflows/deploy.yml'];
for(const file of required)if(!fs.existsSync(path.join(root,file)))failures.push(`missing: ${file}`);
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),app=read('assets/app.js'),templatesSource=read('assets/templates.js'),audio=read('assets/audio.js'),director=read('assets/director.js'),css=read('assets/styles.css'),workflow=read('.github/workflows/deploy.yml');

function moduleSyntax(file){const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:read(file),encoding:'utf8'});if(r.status!==0)failures.push(`module syntax failed: ${file}\n${r.stderr.trim()}`);}
['assets/app.js','assets/templates.js','assets/audio.js','assets/director.js'].forEach(moduleSyntax);

const domFn=app.match(/const DOM_FUNCTION = `([\s\S]*?)`;/);
if(!domFn)failures.push('DOM_FUNCTION not found');
else if(Buffer.byteLength(domFn[1],'utf8')>1024)failures.push(`DOM_FUNCTION exceeds 1024 bytes: ${Buffer.byteLength(domFn[1],'utf8')}`);

const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const dup=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];if(dup.length)failures.push(`duplicate ids: ${dup.join(', ')}`);
const idSet=new Set(ids);const appIds=[...app.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map(m=>m[1]);const missing=[...new Set(appIds.filter(id=>!idSet.has(id)))];if(missing.length)failures.push(`missing DOM ids: ${missing.join(', ')}`);

const tmod=await import(`${pathToFileURL(path.join(root,'assets/templates.js')).href}?v=${Date.now()}`);
if(tmod.builtinTemplates.length<20)failures.push(`need >=20 templates, got ${tmod.builtinTemplates.length}`);
if(tmod.builtinTemplates[0]?.id!=='impact-flow')failures.push('impact-flow must be default first template');
const templateIds=new Set();
for(const t of tmod.builtinTemplates){if(!t.id||templateIds.has(t.id))failures.push(`bad template id ${t.id}`);templateIds.add(t.id);if(!t.title||!t.description||!Array.isArray(t.sequence)||t.sequence.length<3)failures.push(`bad template ${t.id}`);}

const checks=[
 ['Flow Plan UI',html.includes('directorLibrary')&&html.includes('연출 플로우')&&app.includes('updateFlowStep')&&app.includes('moveFlowStep')&&app.includes('addElementToFlow')],
 ['human-readable flow actions',app.includes('페이지 전체 공개')&&app.includes('클릭 → 같은 페이지 이동')&&app.includes('클릭 → 다음 페이지')],
 ['DOM geometry',app.includes('getBoundingClientRect')&&app.includes('targetX')&&app.includes('targetY')&&app.includes('e.hash')],
 ['same-page anchor choreography',director.includes("action==='anchor'")&&director.includes('영역으로 이동')&&director.includes('sameDocumentAnchor')],
 ['route choreography',director.includes("action==='navigate'")&&director.includes('targetPageIndex')],
 ['impact camera keyframes',app.includes('cameraFramesForImpact')&&app.includes('cameraKeyframes')&&app.includes("impact === 'punch'")&&app.includes("impact === 'track'")],
 ['impact page transition',app.includes("scene.transition === 'page-flow'")&&app.includes('scale:1.08-eased*.08')],
 ['source-projected cursor',app.includes('projectSourcePointToFrame')&&app.includes('cursorStartX')],
 ['visual path override',app.includes('commitPath')&&app.includes('scene.cameraKeyframes=[]')],
 ['URL auto-follow',app.includes('suggestInternalLinks')&&app.includes('queue.push(suggestion.href)')],
 ['Microlink + fallback',app.includes('fetchMicrolinkCapture')&&app.includes('fetchMshotsCapture')],
 ['audio preview',html.includes('soundPreviewButton')&&audio.includes('createProceduralBuffer')],
 ['scene accents',audio.includes('addSceneAccents')&&app.includes('addSceneAccents')],
 ['WebM A/V mux',app.includes('createMediaStreamDestination')&&app.includes('canvas.captureStream')&&app.includes('MediaRecorder')],
 ['continuous 30fps export',app.includes('canvas.captureStream(fps)')&&!app.includes('canvas.captureStream(0)')&&!app.includes('requestFrame()')],
 ['responsive Flow Plan',css.includes('.director-layout')&&css.includes('@media(max-width:820px)')&&css.includes('overflow-x: hidden')],
 ['GitHub Pages workflow',workflow.includes('actions/deploy-pages@v4')&&workflow.includes('node scripts/verify.mjs')],
 ['v7 cache busting',html.includes('v=7.0.0')&&app.includes("motionframe:v7:project")],
 ['boot watchdog',html.includes('__motionframeReady')&&app.includes('window.__motionframeReady = true')]
];
for(const [name,ok] of checks)if(!ok)failures.push(`check failed: ${name}`);

const dmod=await import(`${pathToFileURL(path.join(root,'assets/director.js')).href}?v=${Date.now()}`);
const single=[{id:'p0',name:'MotionFrame',sourceUrl:'https://example.com/',sourceAnalysis:{url:'https://example.com/',title:'MotionFrame',captureMode:'full',documentWidth:1440,documentHeight:5000,viewportWidth:1440,viewportHeight:900,elements:[
 {id:'h1',tag:'h1',text:'사이트를 넣고 연출을 고르고 영상으로 끝냅니다',x:430,y:400,top:350,w:700,h:100},
 {id:'h2',tag:'h2',text:'URL을 넣으면 화면과 페이지 구조를 함께 읽습니다.',x:520,y:1400,top:1360,w:800,h:70},
 {id:'cap',tag:'a',text:'URL 캡처',href:'https://example.com/#capture',x:950,y:60,top:45,w:100,h:30,inNav:true,targetX:720,targetY:1300},
 {id:'dir',tag:'a',text:'Auto Director',href:'https://example.com/#director',x:1060,y:60,top:45,w:120,h:30,inNav:true,targetX:720,targetY:2600}
]}}];
const anchorPlan=dmod.createDirectorPlan(single,{detail:'standard'}),anchorBeats=dmod.buildBeatSpecs(anchorPlan);
if(!anchorPlan.flow.some(s=>s.action==='anchor'&&s.label==='URL 캡처'))failures.push('same-page anchor not represented in Flow Plan');
if(!anchorBeats.some(b=>b.intent==='click'&&b.label.includes('URL 캡처')))failures.push('anchor click beat missing');
if(!anchorBeats.some(b=>b.intent==='track'&&b.label.includes('URL 캡처 영역')))failures.push('anchor target track beat missing');

const multipage=[
 {id:'a',name:'Home',sourceUrl:'https://example.com/',sourceAnalysis:{url:'https://example.com/',title:'Home',captureMode:'full',documentWidth:1440,documentHeight:2200,viewportWidth:1440,viewportHeight:900,elements:[{id:'h',tag:'h1',text:'Build faster',x:430,y:350,top:320,w:500,h:80},{id:'n',tag:'a',text:'Features',href:'https://example.com/features',x:990,y:60,top:40,w:90,h:30,inNav:true}]}},
 {id:'b',name:'Features',sourceUrl:'https://example.com/features',sourceAnalysis:{url:'https://example.com/features',title:'Features',captureMode:'full',documentWidth:1440,documentHeight:2000,viewportWidth:1440,viewportHeight:900,elements:[{id:'h2',tag:'h1',text:'Features',x:430,y:350,top:320,w:500,h:80},{id:'c',tag:'a',text:'Start free',href:'https://example.com/signup',x:800,y:1500,top:1470,w:150,h:50}]}}
];
const routePlan=dmod.createDirectorPlan(multipage,{detail:'standard'}),routeBeats=dmod.buildBeatSpecs(routePlan);
if(!routePlan.flow.some(s=>s.action==='navigate'&&s.targetPageIndex===1))failures.push('cross-page route not represented');
if(!routeBeats.some(b=>b.intent==='navigate'&&b.targetPageIndex===1))failures.push('navigate beat missing');
const h1=anchorPlan.pages[0].elements.find(e=>e.role==='hero');dmod.addElementToFlow(anchorPlan,0,h1.id);if(!anchorPlan.flow.some(s=>s.elementId===h1.id))failures.push('element library add failed');
const step=anchorPlan.flow.find(s=>s.elementId===h1.id);dmod.updateFlowStep(anchorPlan,step.id,{action:'track',impact:'track'});if(step.action!=='track')failures.push('flow step update failed');
const before=anchorPlan.flow.indexOf(step);dmod.moveFlowStep(anchorPlan,step.id,-1);if(anchorPlan.flow.indexOf(step)!==Math.max(0,before-1))failures.push('flow step move failed');

if(/Lorem ipsum|TODO|FIXME/.test(html+app+templatesSource+audio+director))failures.push('placeholder/TODO text found');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Verification passed: ${tmod.builtinTemplates.length} templates, ${Object.keys(tmod.motionPresets).length} motion presets, ${checks.length} feature checks, ${required.length} required files, ${appIds.length} DOM references.`);
