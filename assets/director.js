const CTA_RE = /(start|try|free|demo|contact|book|sign\s?up|get started|learn more|시작|무료|체험|데모|문의|가입|신청|사용해|살펴보기|내보내기|분석|캡처|만들기)/i;
const FEATURE_RE = /(feature|product|solution|workflow|automation|how it works|use case|기능|제품|솔루션|워크플로|자동화|사용법|활용|template|editor|director|capture|템플릿|편집기|연출)/i;
const SKIP_RE = /(login|log in|sign in|privacy|terms|policy|cookie|blog|docs|documentation|support|help|career|채용|개인정보|약관|로그인|블로그|문서|고객센터)/i;
const ACTIONS = new Set(['establish','focus','track','click','anchor','navigate','resolve']);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const uid = (prefix='flow') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

function clean(value, max = 92) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeUrl(value, base) {
  try { return new URL(value, base).toString(); } catch { return ''; }
}

function samePage(a, b) {
  try {
    const A = new URL(a); const B = new URL(b);
    const trim = (path) => (path.replace(/\/+$/, '') || '/');
    return A.origin === B.origin && trim(A.pathname) === trim(B.pathname) && A.search === B.search;
  } catch { return false; }
}

function sameDocumentAnchor(element, pageUrl) {
  if (!element?.href || !Number.isFinite(element.targetY)) return false;
  try {
    const href = new URL(element.href); const page = new URL(pageUrl);
    const trim = (path) => (path.replace(/\/+$/, '') || '/');
    return href.origin === page.origin && trim(href.pathname) === trim(page.pathname) && Boolean(href.hash);
  } catch { return false; }
}

function analysisDimensions(analysis = {}) {
  const viewportWidth = Number(analysis.viewportWidth || analysis.documentWidth || 1440);
  const viewportHeight = Number(analysis.viewportHeight || 900);
  const documentWidth = Number(analysis.documentWidth || viewportWidth || 1440);
  const documentHeight = Number(analysis.documentHeight || viewportHeight || 900);
  return { viewportWidth, viewportHeight, documentWidth, documentHeight, captureMode: analysis.captureMode || 'viewport' };
}

function elementPoint(element, analysis) {
  const dims = analysisDimensions(analysis);
  const full = dims.captureMode === 'full';
  const width = full ? dims.documentWidth : dims.viewportWidth;
  const height = full ? dims.documentHeight : dims.viewportHeight;
  return {
    x: clamp((Number(element.x || width / 2) / Math.max(1, width)) * 100, 1, 99),
    y: clamp((Number(element.y || height / 2) / Math.max(1, height)) * 100, 1, 99),
    widthPct: clamp((Number(element.w || element.width || 0) / Math.max(1, width)) * 100, 0, 100),
    heightPct: clamp((Number(element.h || element.height || 0) / Math.max(1, height)) * 100, 0, 100)
  };
}

function roleForElement(element) {
  const tag = String(element.tag || '').toLowerCase();
  if (element.brand) return 'brand';
  if (tag === 'img' || tag === 'video' || element.role === 'media') return 'media';
  const text = clean(element.text);
  if (tag === 'h1') return 'hero';
  if (tag === 'h2' || tag === 'h3') return 'section';
  if (tag === 'button' || element.role === 'button') return CTA_RE.test(text) ? 'cta' : 'control';
  if (tag === 'a') {
    if (element.inNav) return 'nav';
    return CTA_RE.test(text) ? 'cta' : 'link';
  }
  return 'content';
}

function normalizeElements(analysis) {
  const source = Array.isArray(analysis?.elements) ? analysis.elements : [];
  const dims = analysisDimensions(analysis);
  return source
    .map((element, index) => {
      const text = clean(element.text);
      if (!text) return null;
      const point = elementPoint(element, analysis);
      return {
        id: element.id || `el-${index}`,
        tag: String(element.tag || '').toLowerCase(),
        role: roleForElement(element),
        text,
        href: safeUrl(element.href, analysis.url),
        x: point.x,
        y: point.y,
        widthPct: point.widthPct,
        heightPct: point.heightPct,
        top: Number(element.top || element.y || 0),
        width: Number(element.w || element.width || 0),
        height: Number(element.h || element.height || 0),
        targetX: Number(element.targetX || 0) ? clamp((Number(element.targetX) / Math.max(1, dims.captureMode === 'full' ? dims.documentWidth : dims.viewportWidth)) * 100, 1, 99) : null,
        targetY: Number(element.targetY || 0) ? clamp((Number(element.targetY) / Math.max(1, dims.captureMode === 'full' ? dims.documentHeight : dims.viewportHeight)) * 100, 1, 99) : null,
        inNav: Boolean(element.inNav),
        brand: Boolean(element.brand)
      };
    })
    .filter(Boolean)
    .filter((element) => dims.captureMode === 'full' || (element.top < dims.viewportHeight && element.top + element.height > 0))
    .filter((element, index, list) => list.findIndex((item) => item.text === element.text && item.href === element.href && item.role === element.role) === index);
}

function scoreLink(element, pageUrl) {
  if (!element.href || SKIP_RE.test(element.text)) return -100;
  let score = 0;
  try {
    const page = new URL(pageUrl); const href = new URL(element.href);
    if (href.origin === page.origin) score += 8; else score -= 8;
    if (href.pathname !== page.pathname) score += 4;
    if (href.hash) score -= 1;
  } catch { return -100; }
  if (element.inNav) score += 5;
  if (FEATURE_RE.test(element.text)) score += 7;
  if (CTA_RE.test(element.text)) score += 5;
  if (element.text.length <= 24) score += 2;
  return score;
}

export function suggestInternalLinks(analysis, limit = 2) {
  const elements = normalizeElements(analysis);
  const current = analysis?.url || '';
  return elements
    .filter((element) => ['nav', 'link', 'cta'].includes(element.role) && element.href && !samePage(element.href, current))
    .map((element) => ({ ...element, score: scoreLink(element, current) }))
    .filter((element) => element.score > 0)
    .sort((a, b) => b.score - a.score || a.top - b.top)
    .filter((element, index, list) => list.findIndex((item) => samePage(item.href, element.href)) === index)
    .slice(0, limit);
}

function pickBrand(elements) { return elements.find((element) => element.role === 'brand' && element.y <= 14) || null; }
function pickHero(elements) { return elements.find((element) => element.role === 'hero') || elements.find((element) => element.role === 'section') || null; }
function pickMedia(elements, hero) {
  const heroY = hero?.y ?? 0;
  return elements
    .filter((element) => element.role === 'media')
    .filter((element) => element.widthPct >= 18 && element.heightPct >= 2)
    .filter((element) => element.y >= Math.max(0, heroY - 8))
    .map((element) => ({ element, score: element.widthPct * Math.max(2, element.heightPct) - Math.max(0, element.y - 72) * 1.5 }))
    .sort((a, b) => b.score - a.score)[0]?.element || null;
}
function pickSections(elements, count, hero) {
  const heroY = hero?.y ?? -100;
  const sections = elements
    .filter((element) => element.role === 'section')
    .filter((element) => Math.abs(element.y - heroY) >= 7)
    .sort((a, b) => a.top - b.top)
    .filter((element, index, list) => list.findIndex((item) => item.text === element.text) === index);
  if (sections.length <= count) return sections;
  if (count <= 1) return [sections[Math.min(sections.length - 1, Math.floor(sections.length * .35))]];
  const picked = [];
  for (let i = 0; i < count; i += 1) {
    const targetIndex = Math.round((sections.length - 1) * (i / Math.max(1, count - 1)));
    const candidate = sections[targetIndex];
    if (candidate && !picked.includes(candidate)) picked.push(candidate);
  }
  return picked.slice(0, count);
}
function matchLinkToPage(elements, targetUrl) {
  if (!targetUrl) return null;
  const exact = elements.find((element) => element.href && samePage(element.href, targetUrl));
  if (exact) return exact;
  try {
    const target = new URL(targetUrl);
    const ranked = elements.filter((element) => element.href).map((element) => {
      try {
        const href = new URL(element.href);
        let score = href.origin === target.origin ? 4 : -10;
        if (href.pathname === target.pathname) score += 9;
        const slug = target.pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || '';
        if (slug && element.text.toLowerCase().includes(slug.toLowerCase())) score += 5;
        return { element, score };
      } catch { return { element, score: -100 }; }
    }).sort((a,b)=>b.score-a.score);
    return ranked[0]?.score >= 8 ? ranked[0].element : null;
  } catch { return null; }
}
function pickCta(elements) {
  return elements
    .filter((element) => ['cta','control','link'].includes(element.role))
    .map((element) => ({ element, score:(CTA_RE.test(element.text)?8:0)+(element.href?2:0)+(element.y<72?2:0) }))
    .sort((a,b)=>b.score-a.score)[0]?.element || null;
}
function defaultElementBehavior(element, transitionElement, isLast, pageUrl='') {
  if (transitionElement?.id === element.id) return 'navigate';
  if (sameDocumentAnchor(element, pageUrl) && element.inNav) return 'anchor';
  if (isLast && element.role === 'cta') return 'click';
  return 'skip';
}

function overviewPoint(page) {
  if (page.captureMode === 'full' && page.documentHeight > page.viewportHeight * 1.15) {
    return { x:50, y:clamp((page.viewportHeight * .48 / Math.max(1,page.documentHeight))*100,3,35) };
  }
  return { x:50, y:50 };
}

function recommendedZoom(element, page, action='focus') {
  const baseTarget = { brand:116, hero:126, media:132, section:136, nav:142, cta:148, link:140, control:144 }[element.role] || 132;
  const target = action === 'track' ? baseTarget + 6 : action === 'click' || action === 'navigate' ? baseTarget + 4 : baseTarget;
  const roleMax = { brand:126, hero:138, media:144, section:148, nav:152, cta:158, link:152, control:154 }[element.role] || 148;
  const vw = Math.max(1,page.viewportWidth||page.documentWidth||1440), vh=Math.max(1,page.viewportHeight||900);
  const dw=Math.max(1,page.documentWidth||vw), dh=Math.max(1,page.documentHeight||vh), ratio=vw/vh;
  const baseW=Math.min(dw,dh*ratio), baseH=Math.min(dh,dw/ratio);
  const ew=Math.max(1,element.width||(element.widthPct/100)*dw||dw*.2), eh=Math.max(1,element.height||(element.heightPct/100)*dh||vh*.08);
  const maxByWidth=(baseW/(ew*1.35))*100, maxByHeight=(baseH/(eh*1.85))*100;
  return clamp(Math.min(target,maxByWidth,maxByHeight,roleMax),106,roleMax);
}

function framingAnchor(element) {
  let anchorX=.5;
  if (element.x<34) anchorX=element.role==='hero'||element.role==='section'? .35:.32;
  else if (element.x>66) anchorX=element.role==='hero'||element.role==='section'? .65:.68;
  let anchorY=.5;
  if (element.role==='nav'||element.y<14) anchorY=.24;
  else if (element.role==='hero') anchorY=.42;
  else if (element.role==='media') anchorY=.52;
  else if (element.role==='cta'&&element.y>68) anchorY=.62;
  else if (element.y<32) anchorY=.40;
  else if (element.y>76) anchorY=.60;
  return {anchorX,anchorY};
}

function defaultActionForElement(element, previousElement) {
  if (!element) return 'focus';
  if (element.role === 'media') return 'focus';
  if (previousElement && Math.abs(element.y - previousElement.y) > 22) return 'track';
  return 'focus';
}

function makeFlowStep(pageIndex, action, element, extra={}) {
  return {
    id: uid('beat'),
    pageIndex,
    action,
    elementId: element?.id || null,
    role: element?.role || (action==='establish'?'overview':action==='resolve'?'outro':'content'),
    label: clean(extra.label || element?.text || ''),
    targetPageIndex: Number.isInteger(extra.targetPageIndex) ? extra.targetPageIndex : null,
    impact: extra.impact || ({establish:'reveal',focus:'punch',track:'track',click:'click',navigate:'navigate',resolve:'resolve'}[action] || 'punch'),
    enabled: extra.enabled !== false,
    duration: Number(extra.duration || 0) || null,
    targetX: Number.isFinite(Number(extra.targetX)) ? Number(extra.targetX) : (Number.isFinite(Number(element?.targetX)) ? Number(element.targetX) : null),
    targetY: Number.isFinite(Number(extra.targetY)) ? Number(extra.targetY) : (Number.isFinite(Number(element?.targetY)) ? Number(element.targetY) : null)
  };
}

function buildDefaultFlow(pages, detail='standard') {
  const flow=[];
  pages.forEach((page,pageIndex)=>{
    const active = page.elements.filter((element)=>element.behavior!=='skip');
    const navigate = active.find((element)=>element.behavior==='navigate');
    const pageHero = active.find((element)=>element.role==='hero');
    const pageMedia = active.find((element)=>element.role==='media');
    const pageSections = active.filter((element)=>element.role==='section');
    const anchorLinks = active.filter((element)=>element.behavior==='anchor').slice(0, detail === 'detailed' ? 6 : detail === 'compact' ? 2 : 4);
    const pageBrand = active.find((element)=>element.role==='brand');
    const pageCta = active.find((element)=>element.behavior==='click' || element.role==='cta');

    flow.push(makeFlowStep(pageIndex,'establish',null,{label:`${page.title} · 전체`,impact:pageIndex===0?'reveal':'navigate'}));
    let previous=null;
    const ordered=[pageBrand,pageHero,pageMedia,...(anchorLinks.length ? pageSections.slice(0,1) : pageSections)].filter(Boolean).filter((el,i,list)=>list.findIndex(x=>x.id===el.id)===i);
    ordered.forEach((element,index)=>{
      if (element.id===navigate?.id || element.id===pageCta?.id) return;
      const action = defaultActionForElement(element,previous);
      const impact = element.role==='hero' ? 'punch' : element.role==='media' ? 'sweep' : action==='track' ? 'track' : (index%2?'sweep':'punch');
      flow.push(makeFlowStep(pageIndex,action,element,{impact}));
      previous=element;
    });
    anchorLinks.forEach((element)=>flow.push(makeFlowStep(pageIndex,'anchor',element,{impact:'click',targetX:element.targetX,targetY:element.targetY})));
    if (navigate) flow.push(makeFlowStep(pageIndex,'navigate',navigate,{targetPageIndex:navigate.targetPageIndex,impact:'navigate'}));
    if (pageIndex===pages.length-1 && pageCta && pageCta.id!==navigate?.id && !anchorLinks.some((item)=>item.id===pageCta.id)) flow.push(makeFlowStep(pageIndex,'click',pageCta,{impact:'click'}));
  });
  if (pages.length) flow.push(makeFlowStep(pages.length-1,'resolve',null,{label:`${pages.at(-1).title} · 마무리`,impact:'resolve'}));
  return flow;
}

export function createDirectorPlan(pages, options={}) {
  const detail=options.detail||'standard';
  const sectionCount=detail==='compact'?1:detail==='detailed'?3:2;
  const normalizedPages=pages.map((page,pageIndex)=>{
    const analysis=page.sourceAnalysis||{url:page.sourceUrl||'',title:page.name||`페이지 ${pageIndex+1}`,elements:[]};
    const dims=analysisDimensions(analysis), elements=normalizeElements(analysis), nextPage=pages[pageIndex+1];
    const transitionElement=matchLinkToPage(elements,nextPage?.sourceUrl), brand=detail==='detailed'&&pageIndex===0?pickBrand(elements):null;
    const hero=pickHero(elements), media=detail==='compact'?null:pickMedia(elements,hero), sectionBudget=Math.max(0,sectionCount-(media?1:0));
    const sections=pickSections(elements,sectionBudget,hero).filter((item)=>item.id!==transitionElement?.id), cta=pickCta(elements);
    const selected=[brand,hero,media,...sections,transitionElement,pageIndex===pages.length-1?cta:null].filter(Boolean);
    const unique=selected.filter((element,index,list)=>list.findIndex((item)=>item.id===element.id)===index);
    const candidatePool=[...unique,...elements.filter((element)=>['brand','hero','media','section','nav','cta','link','control'].includes(element.role))]
      .filter((element,index,list)=>list.findIndex((item)=>item.id===element.id)===index).slice(0,30);
    const candidates=candidatePool.map((element)=>({...element,behavior:defaultElementBehavior(element,transitionElement,pageIndex===pages.length-1,analysis.url || page.sourceUrl || ''),targetPageIndex:transitionElement?.id===element.id?pageIndex+1:null}));
    unique.forEach((chosen)=>{const candidate=candidates.find((item)=>item.id===chosen.id);if(candidate&&candidate.behavior==='skip')candidate.behavior=chosen.role==='cta'&&pageIndex===pages.length-1?'click':'focus';});
    return {id:`page-${pageIndex}-${Date.now().toString(36)}`,pageIndex,title:clean(analysis.title||page.name||`페이지 ${pageIndex+1}`),url:page.sourceUrl||analysis.url||'',sourceSceneId:page.id,elements:candidates,detectedCount:elements.length,...dims};
  });
  const plan={version:3,detail,pages:normalizedPages,flow:[]};
  plan.flow=buildDefaultFlow(normalizedPages,detail);
  return plan;
}

export function setElementBehavior(plan,pageIndex,elementId,behavior,targetPageIndex=null){
  const page=plan?.pages?.[pageIndex], element=page?.elements?.find((item)=>item.id===elementId); if(!element)return plan;
  if(behavior==='navigate')page.elements.forEach((item)=>{if(item.id!==elementId&&item.behavior==='navigate'){item.behavior=item.href?'click':'focus';item.targetPageIndex=null;}});
  element.behavior=behavior;element.targetPageIndex=behavior==='navigate'?Number(targetPageIndex??pageIndex+1):null;
  plan.flow=buildDefaultFlow(plan.pages,plan.detail||'standard');
  return plan;
}

export function updateFlowStep(plan,stepId,patch={}){
  const step=plan?.flow?.find((item)=>item.id===stepId); if(!step)return plan;
  if(patch.action&&ACTIONS.has(patch.action))step.action=patch.action;
  if('targetPageIndex'in patch)step.targetPageIndex=patch.targetPageIndex===null?null:Number(patch.targetPageIndex);
  if('impact'in patch)step.impact=String(patch.impact||step.impact);
  if('enabled'in patch)step.enabled=Boolean(patch.enabled);
  if('duration'in patch)step.duration=patch.duration?Number(patch.duration):null;
  return plan;
}

export function moveFlowStep(plan,stepId,delta){
  const flow=plan?.flow||[], index=flow.findIndex((item)=>item.id===stepId), next=index+Number(delta||0);
  if(index<0||next<0||next>=flow.length)return plan; const [item]=flow.splice(index,1); flow.splice(next,0,item); return plan;
}

export function removeFlowStep(plan,stepId){ if(plan?.flow)plan.flow=plan.flow.filter((item)=>item.id!==stepId); return plan; }

export function addElementToFlow(plan,pageIndex,elementId,afterStepId=null){
  const page=plan?.pages?.[pageIndex], element=page?.elements?.find((item)=>item.id===elementId); if(!page||!element)return plan;
  const target=plan.pages.findIndex((candidate,index)=>index!==pageIndex&&element.href&&samePage(candidate.url,element.href));
  const isAnchor=sameDocumentAnchor(element,page.url);
  const action=target>=0?'navigate':isAnchor?'anchor':(['cta','control','link','nav'].includes(element.role)?'click':'focus');
  const step=makeFlowStep(pageIndex,action,element,{targetPageIndex:target>=0?target:null,targetX:element.targetX,targetY:element.targetY,impact:action==='navigate'?'navigate':action==='anchor'||action==='click'?'click':element.role==='media'?'sweep':'punch'});
  let index=afterStepId?plan.flow.findIndex((item)=>item.id===afterStepId):-1;
  if(index<0){index=plan.flow.map((item)=>item.pageIndex).lastIndexOf(pageIndex);}
  plan.flow.splice(Math.max(0,index+1),0,step); return plan;
}

export function planSummary(plan){
  const pages=plan?.pages||[], flow=(plan?.flow||[]).filter((step)=>step.enabled!==false);
  const navigations=flow.filter((step)=>step.action==='navigate').length;
  return {pages:pages.length,beats:flow.length,navigations};
}

export function buildBeatSpecs(plan){
  const pages=plan?.pages||[];
  const flow=(plan?.flow?.length?plan.flow:buildDefaultFlow(pages,plan?.detail||'standard')).filter((step)=>step.enabled!==false);
  const out=[];
  flow.forEach((step)=>{
    const page=pages[step.pageIndex]; if(!page)return;
    const element=step.elementId?page.elements.find((item)=>item.id===step.elementId):null;
    const overview=overviewPoint(page), action=ACTIONS.has(step.action)?step.action:'focus';
    if(action==='establish'||action==='resolve'){
      out.push({pageIndex:step.pageIndex,role:action==='resolve'?'outro':'overview',intent:action,label:step.label||`${page.title} · ${action==='resolve'?'마무리':'전체'}`,x:overview.x,y:overview.y,zoom:100,anchorX:.5,anchorY:.5,behavior:'focus',impact:step.impact||action,duration:step.duration,flowStepId:step.id});
      return;
    }
    if(!element)return;
    const anchor=framingAnchor(element), behavior=action==='navigate'?'navigate':action==='click'||action==='anchor'?'click':'focus';
    const common={pageIndex:step.pageIndex,role:element.role,label:element.text,x:element.x,y:element.y,zoom:recommendedZoom(element,page,action),anchorX:anchor.anchorX,anchorY:anchor.anchorY,href:element.href,targetPageIndex:step.targetPageIndex,flowStepId:step.id,widthPct:element.widthPct,heightPct:element.heightPct};
    if(action==='anchor'){
      out.push({...common,intent:'click',behavior:'click',impact:'click',label:`클릭 · ${element.text}`,flowStepId:`${step.id}:click`});
      const targetY=Number.isFinite(Number(step.targetY))?Number(step.targetY):element.targetY;
      const targetX=Number.isFinite(Number(step.targetX))?Number(step.targetX):(element.targetX||50);
      if(Number.isFinite(targetY))out.push({pageIndex:step.pageIndex,role:'section',intent:'track',label:`${element.text} 영역으로 이동`,x:targetX||50,y:targetY,zoom:132,anchorX:.5,anchorY:.48,behavior:'focus',impact:'track',flowStepId:`${step.id}:target`});
      return;
    }
    out.push({...common,intent:action,behavior,impact:step.impact||action,duration:step.duration});
  });
  return out;
}
