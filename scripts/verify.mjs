import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const failures=[];
const required=['index.html','404.html','favicon.svg','manifest.webmanifest','robots.txt','sitemap.xml','.nojekyll','assets/styles.css','assets/app.js','assets/templates.js','assets/audio.js','assets/director.js','assets/concepts.js','.github/workflows/deploy.yml'];
for(const f of required) if(!fs.existsSync(path.join(root,f))) failures.push(`missing: ${f}`);
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),app=read('assets/app.js'),director=read('assets/director.js'),css=read('assets/styles.css'),workflow=read('.github/workflows/deploy.yml');
function syntax(file){const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:read(file),encoding:'utf8'});if(r.status!==0)failures.push(`module syntax failed: ${file}\n${r.stderr.trim()}`)}
['assets/app.js','assets/templates.js','assets/audio.js','assets/director.js','assets/concepts.js'].forEach(syntax);

const domFn=app.match(/const DOM_FUNCTION = `([\s\S]*?)`;/);
if(!domFn) failures.push('DOM_FUNCTION not found');
else if(Buffer.byteLength(domFn[1],'utf8')>1024) failures.push(`DOM_FUNCTION exceeds 1024 bytes: ${Buffer.byteLength(domFn[1],'utf8')}`);

const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const duplicateIds=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
if(duplicateIds.length) failures.push(`duplicate ids: ${duplicateIds.join(', ')}`);
const idSet=new Set(ids);
const appIds=[...app.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map(m=>m[1]);
const missingIds=[...new Set(appIds.filter(id=>!idSet.has(id)))];
if(missingIds.length) failures.push(`missing DOM ids: ${missingIds.join(', ')}`);

const tmod=await import(`${pathToFileURL(path.join(root,'assets/templates.js')).href}?v=${Date.now()}`);
const cmod=await import(`${pathToFileURL(path.join(root,'assets/concepts.js')).href}?v=${Date.now()}`);
const dmod=await import(`${pathToFileURL(path.join(root,'assets/director.js')).href}?v=${Date.now()}`);
if(tmod.builtinTemplates.length<20) failures.push(`need >=20 templates, got ${tmod.builtinTemplates.length}`);
if(cmod.concepts.length<16) failures.push(`need >=16 concepts, got ${cmod.concepts.length}`);
if(cmod.sourceTypes.length!==3) failures.push(`need 3 source types, got ${cmod.sourceTypes.length}`);
for(const concept of cmod.concepts){if(cmod.draftOptions(concept.id).length!==3)failures.push(`concept ${concept.id} must have exactly 3 draft options`);}

const checks=[
 ['staged workspace',html.includes('workflowShellHead')&&['concept','source','review','drafts','flow','studio'].every(stage=>html.includes(`data-workflow-stage="${stage}"`))],
 ['concept source split',html.includes('data-stage-part="concept"')&&html.includes('data-stage-part="source"')],
 ['analysis review UI',html.includes('reviewViewport')&&html.includes('reviewTargetList')&&app.includes('renderAnalysisReview')],
 ['target lock fail closed',director.includes('targetLocked')&&director.includes("behavior=s.action==='navigate'?(targetLocked?'navigate':'focus')")&&app.includes('isExactNavigationTarget')],
 ['no synthetic cursor click',director.includes('syntheticNavigate:true')&&app.includes("beat.targetLocked === true")],
 ['16 concept taxonomy',cmod.concepts.length>=16&&cmod.conceptGroups.length>=7],
 ['three source types',app.includes("sourceType==='url'")&&app.includes("sourceType==='image'")&&app.includes("sourceType==='video'")],
 ['feature defaults',html.includes('autoFeatureGrid')&&cmod.featureDefinitions.length>=12],
 ['draft after review',app.includes("showWorkflowStage('review')")&&app.includes('reviewContinueButton')&&app.includes('createConceptDrafts')],
 ['flow before scene render',app.includes('A draft is a plan, not yet a rendered scene stack')&&app.includes("showWorkflowStage('flow')")],
 ['webm export',app.includes('rememberWebMExport')&&app.includes('MediaRecorder')&&app.includes('canvas.captureStream(fps)')],
 ['svg export metadata',app.includes('exportSvg')&&app.includes('motionframe-project')&&app.includes('data-encoding="base64"')],
 ['result import',html.includes('resultImportInput')&&app.includes('importResultFile')&&app.includes('WebM을 편집 가능한 영상 클립')],
 ['project exact restore',app.includes('buildProjectBundle')&&app.includes('restoreProjectBundle')&&app.includes('bases:directorBases')],
 ['legacy project purge',app.includes('cleanupLegacyPersistence')&&app.includes("motionframe:v12:project")&&!app.includes('LEGACY_STORAGE_KEYS')],
 ['new isolated asset db',app.includes("motionframe-studio-v12")],
 ['empty new project',app.includes('scenes: []')&&app.includes('빈 새 프로젝트')],
 ['compact concept browser',css.includes('.concept-filters')&&css.includes('grid-template-columns:repeat(4')],
 ['flow hides duplicated analysis list',css.includes('.director-section>.analysis-workspace{display:none!important}')],
 ['responsive staged UI',css.includes('.workflow-steps')&&css.includes('@media(max-width:820px)')],
 ['advanced low-level editor retained',html.includes('motionPathOverlay')&&html.includes('세부 좌표 직접 조정')],
 ['sound retained',html.includes('soundPresetGrid')&&app.includes('previewSoundOnly')],
 ['v12 cache + storage',html.includes('v=12.0.0')&&app.includes("motionframe:v12:project")],
 ['GitHub Pages workflow',workflow.includes('actions/deploy-pages@v4')&&workflow.includes('node scripts/verify.mjs')],
 ['boot watchdog',html.includes('__motionframeReady')&&app.includes('window.__motionframeReady = true')]
];
for(const [name,ok] of checks) if(!ok) failures.push(`check failed: ${name}`);

// Director unit test: four explicit views of one document. Only exact href matches may navigate.
const base='https://example.com/app/';
const vw=1440,vh=1000;
const elements=[
 {id:'logo',tag:'a',text:'Example',href:base,x:100,y:50,top:30,w:120,h:40,brand:true},
 {id:'h1',tag:'h1',text:'Build product demos automatically',x:360,y:250,top:180,w:620,h:150},
 {id:'hero-ui',tag:'canvas',role:'surface',text:'Product preview',x:1040,y:360,top:140,w:650,h:520},
 {id:'start',tag:'a',text:'Start with URL',href:base+'#capture',x:220,y:650,top:620,w:180,h:48},
 {id:'wrong',tag:'a',text:'Random CTA',href:base+'#other',x:520,y:650,top:620,w:180,h:48},
 {id:'capture-title',tag:'h2',text:'Capture and understand the page',x:520,y:1650,top:1600,w:760,h:90},
 {id:'urlbox',tag:'textarea',role:'surface',text:'Site URL',x:600,y:1950,top:1840,w:880,h:240},
 {id:'to-templates',tag:'a',text:'Motion styles',href:base+'#templates',x:1120,y:50,top:50,w:110,h:36,inNav:true},
 {id:'templates-title',tag:'h2',text:'Choose a motion style',x:540,y:3200,top:3150,w:800,h:90},
 {id:'impact',tag:'h3',text:'Impact Product Flow',x:300,y:3500,top:3450,w:320,h:60},
 {id:'to-studio',tag:'a',text:'Editor',href:base+'#studio',x:1260,y:50,top:50,w:80,h:36,inNav:true},
 {id:'studio-title',tag:'h2',text:'Edit scenes, motion and sound',x:520,y:4800,top:4750,w:800,h:90},
 {id:'preview',tag:'canvas',role:'surface',text:'Live preview',x:720,y:5350,top:5050,w:850,h:520}
];
const defs=[['',0],['#capture',1450],['#templates',3000],['#studio',4650]];
const scenes=defs.map(([hash,scrollY],index)=>({id:`s${index}`,name:'Demo',sourceUrl:base+hash,sourceAnalysis:{url:base+hash,title:'Demo',captureMode:'viewport',documentWidth:1440,documentHeight:6200,viewportWidth:vw,viewportHeight:vh,scrollX:0,scrollY,elements:elements.map(e=>e.inNav?{...e,y:e.y+scrollY,top:e.top+scrollY}:e)}}));
const concept=cmod.getConcept('expert-review');
const features=new Set(concept.features);
const profile={...concept.director,includeLogo:features.has('logo'),includeOverview:features.has('overview'),includeHeadings:true,includeActions:true,includeControls:true,includeOutro:true};
const plan=dmod.createDirectorPlan(scenes,{scope:{pageLimit:6,elementLimit:8,grouping:'screen',roles:['brand','headings','media','navigation','actions']},profile});
const summary=dmod.planSummary(plan);
if(plan.pages.length!==4) failures.push(`expected 4 chapters, got ${plan.pages.length}`);
if(summary.navigations!==3) failures.push(`expected 3 exact URL transitions, got ${summary.navigations}`);
for(const expected of ['Start with URL','Motion styles','Editor']) if(!plan.flow.some(step=>step.action==='navigate'&&step.label===expected)) failures.push(`navigation beat missing: ${expected}`);
if(plan.flow.some(step=>step.action==='navigate'&&step.label==='Random CTA')) failures.push('wrong CTA became navigation');
const beats=dmod.buildBeatSpecs(plan);
if(beats.some(beat=>beat.behavior==='navigate'&&beat.targetLocked!==true)) failures.push('unlocked navigate beat escaped fail-closed guard');
const wrong=plan.pages[0].elements.find(e=>e.id==='wrong');
if(wrong&&dmod.isExactNavigationTarget(plan,0,wrong.id,1)) failures.push('wrong CTA incorrectly target-locked');

// Image/video concepts still create media-focused plans without fake click targets.
const mediaScenes=[0,1,2].map(index=>({id:`m${index}`,name:`Image ${index+1}`,sourceUrl:`local://image/${index+1}`,sourceAnalysis:{url:`local://image/${index+1}`,title:`Image ${index+1}`,captureMode:'viewport',documentWidth:1200,documentHeight:750,viewportWidth:1200,viewportHeight:750,scrollX:0,scrollY:0,elements:[{id:`media-${index}`,tag:'img',role:'surface',text:`Image ${index+1}`,x:600,y:375,top:0,w:1080,h:620}]}}));
const mediaPlan=dmod.createDirectorPlan(mediaScenes,{scope:{pageLimit:3,elementLimit:4,grouping:'screen',roles:['media','headings']},profile:{maxBeatsPerPage:3,headingCount:0,mediaCount:1,includeOverview:true,includeActions:false,includeOutro:true}});
if(!mediaPlan.flow.some(step=>step.role==='media')) failures.push('image flow did not create media focus beats');
if(dmod.buildBeatSpecs(mediaPlan).some(beat=>beat.behavior==='navigate'&&beat.targetLocked)) failures.push('local media flow created a fake locked click');

if(/Lorem ipsum|TODO|FIXME/.test(html+app+director)) failures.push('placeholder/TODO text found');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Verification passed: ${cmod.concepts.length} concepts, ${tmod.builtinTemplates.length} templates, 6 workflow stages, ${checks.length} v12 feature checks, ${required.length} required files, ${appIds.length} DOM references, ${summary.beats} review beats.`);
