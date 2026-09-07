import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),failures=[];
const required=['index.html','404.html','favicon.svg','manifest.webmanifest','robots.txt','sitemap.xml','.nojekyll','assets/styles.css','assets/app.js','assets/templates.js','assets/audio.js','assets/director.js','.github/workflows/deploy.yml'];
for(const f of required)if(!fs.existsSync(path.join(root,f)))failures.push(`missing: ${f}`);
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),html=read('index.html'),app=read('assets/app.js'),templates=read('assets/templates.js'),audio=read('assets/audio.js'),director=read('assets/director.js'),css=read('assets/styles.css'),workflow=read('.github/workflows/deploy.yml');
function syntax(file){const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:read(file),encoding:'utf8'});if(r.status!==0)failures.push(`module syntax failed: ${file}\n${r.stderr.trim()}`)}
['assets/app.js','assets/templates.js','assets/audio.js','assets/director.js'].forEach(syntax);
const domFn=app.match(/const DOM_FUNCTION = `([\s\S]*?)`;/);if(!domFn)failures.push('DOM_FUNCTION not found');else if(Buffer.byteLength(domFn[1],'utf8')>1024)failures.push(`DOM_FUNCTION exceeds free-plan 1024 bytes: ${Buffer.byteLength(domFn[1],'utf8')}`);
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]),dups=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];if(dups.length)failures.push(`duplicate ids: ${dups.join(', ')}`);
const idSet=new Set(ids),appIds=[...app.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map(m=>m[1]),missing=[...new Set(appIds.filter(id=>!idSet.has(id)))];if(missing.length)failures.push(`missing DOM ids: ${missing.join(', ')}`);
const tmod=await import(`${pathToFileURL(path.join(root,'assets/templates.js')).href}?v=${Date.now()}`);if(tmod.builtinTemplates.length<20)failures.push(`need >=20 templates, got ${tmod.builtinTemplates.length}`);
const checks=[
 ['analysis scope UI',html.includes('analysisPageLimitSelect')&&html.includes('analysisElementLimitSelect')&&html.includes('analysisBandSelect')&&html.includes('data-analysis-role="headings"')],
 ['position-first analysis board',html.includes('analysisPageList')&&app.includes('renderAnalysisBoard')&&app.includes('positionPercentLabel')&&css.includes('.analysis-map-dot')],
 ['selection drives flow',app.includes('toggleElementSelection')&&app.includes('rebuildDirectorFromSelection')&&director.includes('rebuildFlowFromSelection')],
 ['page/element limits',director.includes('pageLimit')&&director.includes('elementLimit')&&app.includes('analysisScope.pageLimit')],
 ['spatial grouping',director.includes('regionIndex')&&director.includes('positionLabel')&&director.includes("grouping='screen'")&&director.includes("grouping==='section'")],
 ['DOM geometry',app.includes('getBoundingClientRect')&&app.includes('targetX')&&app.includes('targetY')&&app.includes('e.hash')],
 ['same-page anchor choreography',director.includes('isSameDocumentAnchor')&&director.includes("makeStep(pageIndex,'anchor'")&&director.includes("makeStep(pageIndex,'track'")],
 ['route choreography',director.includes("makeStep(pageIndex,'navigate'")&&director.includes('targetPageIndex')],
 ['impact camera',app.includes("impact === 'whip'")&&app.includes("impact === 'orbit'")&&app.includes('cameraFramesForImpact')],
 ['source-projected cursor',app.includes('projectSourcePointToFrame')&&app.includes('cursorStartX')],
 ['visual path override',app.includes('commitPath')&&app.includes('scene.cameraKeyframes=[]')],
 ['Microlink + fallback',app.includes('fetchMicrolinkCapture')&&app.includes('fetchMshotsCapture')],
 ['audio preview + accents',html.includes('soundPreviewButton')&&audio.includes('createProceduralBuffer')&&audio.includes('addSceneAccents')],
 ['WebM continuous A/V',app.includes('createMediaStreamDestination')&&app.includes('canvas.captureStream(fps)')&&!app.includes('canvas.captureStream(0)')],
 ['responsive v8 UI',css.includes('.analysis-scope-grid')&&css.includes('.analysis-page-body')&&css.includes('@media(max-width:820px)')],
 ['GitHub Pages workflow',workflow.includes('actions/deploy-pages@v4')&&workflow.includes('node scripts/verify.mjs')],
 ['v8 cache + storage',html.includes('v=8.0.0')&&app.includes("motionframe:v8:project")],
 ['boot watchdog',html.includes('__motionframeReady')&&app.includes('window.__motionframeReady = true')]
];for(const [n,ok] of checks)if(!ok)failures.push(`check failed: ${n}`);
const dmod=await import(`${pathToFileURL(path.join(root,'assets/director.js')).href}?v=${Date.now()}`);
const analysis={url:'https://example.com/',title:'Demo',captureMode:'full',documentWidth:1440,documentHeight:5000,viewportWidth:1440,viewportHeight:1000,elements:[
 {id:'h1',tag:'h1',text:'Build better demos',x:350,y:450,top:360,w:520,h:120},
 {id:'media',tag:'img',text:'Product preview',x:1020,y:520,top:340,w:520,h:340},
 {id:'cta',tag:'a',text:'Start here',href:'https://example.com/#capture',x:260,y:760,top:730,w:150,h:42,targetX:720,targetY:1450},
 {id:'nav1',tag:'a',text:'Capture',href:'https://example.com/#capture',x:930,y:50,top:35,w:80,h:30,inNav:true,targetX:720,targetY:1450},
 {id:'nav2',tag:'a',text:'Director',href:'https://example.com/#director',x:1030,y:50,top:35,w:90,h:30,inNav:true,targetX:720,targetY:2700},
 {id:'s1',tag:'h2',text:'Capture the page',x:500,y:1500,top:1450,w:700,h:90},
 {id:'s2',tag:'h2',text:'Direct the flow',x:500,y:2750,top:2700,w:700,h:90},
 {id:'cta2',tag:'button',text:'Export WebM',x:500,y:4300,top:4260,w:180,h:50}
]};
const scene={id:'p0',name:'Demo',sourceUrl:analysis.url,sourceAnalysis:analysis};
const plan=dmod.createDirectorPlan([scene],{scope:{pageLimit:1,elementLimit:8,grouping:'screen',roles:['headings','media','navigation','actions']}}),beats=dmod.buildBeatSpecs(plan);
if(plan.pages.length!==1)failures.push('page limit failed');
if(plan.pages[0].elements.filter(e=>e.selected).length>8)failures.push('element limit failed');
if(!plan.flow.some(s=>s.action==='anchor'))failures.push('anchor flow missing');
if(!plan.flow.some(s=>s.impact==='whip'))failures.push('whip target flow missing');
if(!beats.some(b=>b.role==='media'))failures.push('media beat missing');
const firstSection=plan.pages[0].elements.find(e=>e.role==='section'&&e.selected);if(firstSection){dmod.toggleElementSelection(plan,0,firstSection.id,false);if(plan.pages[0].elements.find(e=>e.id===firstSection.id).selected)failures.push('selection toggle failed');if(plan.flow.some(s=>s.elementId===firstSection.id))failures.push('unchecked element remained in flow');}
const limited=dmod.createDirectorPlan([scene,scene,scene,scene],{scope:{pageLimit:3,elementLimit:6,grouping:'section',roles:['headings','actions']}});if(limited.pages.length!==3)failures.push('multi-page limit failed');if(limited.pages.some(p=>p.elements.some(e=>e.selected&&!['headings','actions'].includes(e.group))))failures.push('role scope failed');
if(/Lorem ipsum|TODO|FIXME/.test(html+app+templates+audio+director))failures.push('placeholder/TODO text found');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Verification passed: ${tmod.builtinTemplates.length} templates, ${Object.keys(tmod.motionPresets).length} motion presets, ${checks.length} v8 feature checks, ${required.length} required files, ${appIds.length} DOM references.`);
