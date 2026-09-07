const CTA_RE = /(start|try|free|demo|contact|book|sign\s?up|get started|learn more|시작|무료|체험|데모|문의|가입|신청|사용해|살펴보기)/i;
const FEATURE_RE = /(feature|product|solution|workflow|automation|how it works|use case|기능|제품|솔루션|워크플로|자동화|사용법|활용)/i;
const SKIP_RE = /(login|log in|sign in|privacy|terms|policy|cookie|blog|docs|documentation|support|help|career|채용|개인정보|약관|로그인|블로그|문서|고객센터)/i;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

function pickBrand(elements) {
  return elements.find((element) => element.role === 'brand' && element.y <= 14) || null;
}

function pickHero(elements) {
  return elements.find((element) => element.role === 'hero') || elements.find((element) => element.role === 'section') || null;
}

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
    const ranked = elements
      .filter((element) => element.href)
      .map((element) => {
        try {
          const href = new URL(element.href);
          let score = href.origin === target.origin ? 4 : -10;
          if (href.pathname === target.pathname) score += 9;
          const slug = target.pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || '';
          if (slug && element.text.toLowerCase().includes(slug.toLowerCase())) score += 5;
          return { element, score };
        } catch { return { element, score: -100 }; }
      })
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.score >= 8 ? ranked[0].element : null;
  } catch { return null; }
}

function pickCta(elements) {
  return elements
    .filter((element) => ['cta', 'control', 'link'].includes(element.role))
    .map((element) => ({ element, score: (CTA_RE.test(element.text) ? 8 : 0) + (element.href ? 2 : 0) + (element.y < 72 ? 2 : 0) }))
    .sort((a, b) => b.score - a.score)[0]?.element || null;
}

function defaultElementBehavior(element, transitionElement, isLast) {
  if (transitionElement?.id === element.id) return 'navigate';
  if (isLast && element.role === 'cta') return 'click';
  return 'skip';
}

function overviewPoint(page) {
  if (page.captureMode === 'full' && page.documentHeight > page.viewportHeight * 1.15) {
    return {
      x: 50,
      y: clamp((page.viewportHeight * .48 / Math.max(1, page.documentHeight)) * 100, 3, 35)
    };
  }
  return { x: 50, y: 50 };
}

function recommendedZoom(element, page) {
  const roleTarget = { brand: 112, hero: 112, media: 110, section: 118, nav: 128, cta: 132, link: 124, control: 128 }[element.role] || 118;
  const roleMax = { brand: 120, hero: 120, media: 118, section: 126, nav: 138, cta: 142, link: 136, control: 138 }[element.role] || 128;
  const vw = Math.max(1, page.viewportWidth || page.documentWidth || 1440);
  const vh = Math.max(1, page.viewportHeight || 900);
  const dw = Math.max(1, page.documentWidth || vw);
  const dh = Math.max(1, page.documentHeight || vh);
  const ratio = vw / vh;
  const baseW = Math.min(dw, dh * ratio);
  const baseH = Math.min(dh, dw / ratio);
  const ew = Math.max(1, element.width || (element.widthPct / 100) * dw || dw * .2);
  const eh = Math.max(1, element.height || (element.heightPct / 100) * dh || vh * .08);
  const maxByWidth = (baseW / (ew * 1.7)) * 100;
  const maxByHeight = (baseH / (eh * 2.4)) * 100;
  return clamp(Math.min(roleTarget, maxByWidth, maxByHeight, roleMax), 103, roleMax);
}

function framingAnchor(element) {
  let anchorX = .5;
  if (element.x < 34) anchorX = element.role === 'hero' || element.role === 'section' ? .38 : .34;
  else if (element.x > 66) anchorX = element.role === 'hero' || element.role === 'section' ? .62 : .66;
  let anchorY = .5;
  if (element.role === 'nav' || element.y < 14) anchorY = .28;
  else if (element.role === 'hero') anchorY = .44;
  else if (element.role === 'media') anchorY = .5;
  else if (element.role === 'cta' && element.y > 68) anchorY = .6;
  else if (element.y < 32) anchorY = .42;
  else if (element.y > 76) anchorY = .58;
  return { anchorX, anchorY };
}

export function createDirectorPlan(pages, options = {}) {
  const detail = options.detail || 'standard';
  const sectionCount = detail === 'compact' ? 1 : detail === 'detailed' ? 3 : 2;
  const normalizedPages = pages.map((page, pageIndex) => {
    const analysis = page.sourceAnalysis || { url: page.sourceUrl || '', title: page.name || `페이지 ${pageIndex + 1}`, elements: [] };
    const dims = analysisDimensions(analysis);
    const elements = normalizeElements(analysis);
    const nextPage = pages[pageIndex + 1];
    const transitionElement = matchLinkToPage(elements, nextPage?.sourceUrl);
    const brand = detail === 'detailed' && pageIndex === 0 ? pickBrand(elements) : null;
    const hero = pickHero(elements);
    const media = detail === 'compact' ? null : pickMedia(elements, hero);
    const sectionBudget = Math.max(0, sectionCount - (media ? 1 : 0));
    const sections = pickSections(elements, sectionBudget, hero).filter((item) => item.id !== transitionElement?.id);
    const cta = pickCta(elements);
    const selected = [brand, hero, media, ...sections, transitionElement, pageIndex === pages.length - 1 ? cta : null].filter(Boolean);
    const unique = selected.filter((element, index, list) => list.findIndex((item) => item.id === element.id) === index);
    const candidatePool = [...unique, ...elements.filter((element) => ['brand', 'hero', 'media', 'section', 'nav', 'cta', 'link', 'control'].includes(element.role))]
      .filter((element, index, list) => list.findIndex((item) => item.id === element.id) === index)
      .slice(0, 24);
    const candidates = candidatePool
      .map((element) => ({ ...element, behavior: defaultElementBehavior(element, transitionElement, pageIndex === pages.length - 1), targetPageIndex: transitionElement?.id === element.id ? pageIndex + 1 : null }));
    unique.forEach((chosen) => {
      const candidate = candidates.find((item) => item.id === chosen.id);
      if (candidate && candidate.behavior === 'skip') candidate.behavior = chosen.role === 'cta' && pageIndex === pages.length - 1 ? 'click' : 'focus';
    });
    return {
      id: `page-${pageIndex}-${Date.now().toString(36)}`,
      pageIndex,
      title: clean(analysis.title || page.name || `페이지 ${pageIndex + 1}`),
      url: page.sourceUrl || analysis.url || '',
      sourceSceneId: page.id,
      elements: candidates,
      detectedCount: elements.length,
      ...dims
    };
  });
  return { version: 2, detail, pages: normalizedPages };
}

export function setElementBehavior(plan, pageIndex, elementId, behavior, targetPageIndex = null) {
  const page = plan?.pages?.[pageIndex];
  const element = page?.elements?.find((item) => item.id === elementId);
  if (!element) return plan;
  if (behavior === 'navigate') {
    page.elements.forEach((item) => {
      if (item.id !== elementId && item.behavior === 'navigate') { item.behavior = item.href ? 'click' : 'focus'; item.targetPageIndex = null; }
    });
  }
  element.behavior = behavior;
  element.targetPageIndex = behavior === 'navigate' ? Number(targetPageIndex ?? pageIndex + 1) : null;
  return plan;
}

export function planSummary(plan) {
  const pages = plan?.pages || [];
  const beats = pages.reduce((sum, page) => sum + 1 + page.elements.filter((element) => element.behavior !== 'skip').length, 0) + (pages.length ? 1 : 0);
  const navigations = pages.reduce((sum, page) => sum + page.elements.filter((element) => element.behavior === 'navigate').length, 0);
  return { pages: pages.length, beats, navigations };
}

export function buildBeatSpecs(plan) {
  const specs = [];
  const pages = plan?.pages || [];
  if (!pages.length) return specs;
  const order = [];
  const visited = new Set();
  let current = 0;
  while (current >= 0 && current < pages.length && !visited.has(current)) {
    order.push(current); visited.add(current);
    const nav = pages[current].elements.find((element) => element.behavior === 'navigate' && Number.isInteger(element.targetPageIndex) && !visited.has(element.targetPageIndex));
    if (nav) current = nav.targetPageIndex;
    else current = pages.findIndex((_, index) => !visited.has(index));
  }
  pages.forEach((_, index) => { if (!visited.has(index)) order.push(index); });

  order.forEach((pageIndex, orderIndex) => {
    const page = pages[pageIndex];
    const overview = overviewPoint(page);
    const active = page.elements.filter((element) => element.behavior !== 'skip');
    const navigate = active.find((element) => element.behavior === 'navigate');
    const beforeNavigate = navigate ? active.filter((element) => element.id !== navigate.id) : active;

    specs.push({
      pageIndex,
      role: 'overview',
      intent: orderIndex === 0 ? 'establish' : 'arrive',
      label: `${page.title} · 전체`,
      x: overview.x,
      y: overview.y,
      zoom: 100,
      anchorX: .5,
      anchorY: .5,
      behavior: 'focus'
    });

    beforeNavigate.forEach((element) => {
      const anchor = framingAnchor(element);
      specs.push({
        pageIndex,
        role: element.role,
        intent: element.behavior === 'click' ? 'click' : 'focus',
        label: element.text,
        x: element.x,
        y: element.y,
        zoom: recommendedZoom(element, page),
        anchorX: anchor.anchorX,
        anchorY: anchor.anchorY,
        behavior: element.behavior,
        href: element.href,
        targetPageIndex: element.targetPageIndex
      });
    });

    if (navigate) {
      const anchor = framingAnchor(navigate);
      specs.push({
        pageIndex,
        role: navigate.role,
        intent: 'navigate',
        label: navigate.text,
        x: navigate.x,
        y: navigate.y,
        zoom: recommendedZoom(navigate, page),
        anchorX: anchor.anchorX,
        anchorY: anchor.anchorY,
        behavior: 'navigate',
        href: navigate.href,
        targetPageIndex: navigate.targetPageIndex
      });
    }
  });

  const lastIndex = order.at(-1);
  if (Number.isInteger(lastIndex)) {
    const overview = overviewPoint(pages[lastIndex]);
    specs.push({
      pageIndex: lastIndex,
      role: 'outro',
      intent: 'resolve',
      label: `${pages[lastIndex].title} · 마무리`,
      x: overview.x,
      y: overview.y,
      zoom: 100,
      anchorX: .5,
      anchorY: .5,
      behavior: 'focus'
    });
  }
  return specs;
}
