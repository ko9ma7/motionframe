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

function elementPoint(element, analysis) {
  const full = analysis.captureMode === 'full';
  const width = full ? (analysis.documentWidth || analysis.viewportWidth || 1) : (analysis.viewportWidth || analysis.documentWidth || 1);
  const height = full ? (analysis.documentHeight || analysis.viewportHeight || 1) : (analysis.viewportHeight || analysis.documentHeight || 1);
  return {
    x: clamp((Number(element.x || width / 2) / width) * 100, 5, 95),
    y: clamp((Number(element.y || height / 2) / height) * 100, 4, 96)
  };
}

function roleForElement(element) {
  const tag = String(element.tag || '').toLowerCase();
  if (element.brand) return 'brand';
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
        top: Number(element.top || element.y || 0),
        width: Number(element.w || element.width || 0),
        height: Number(element.h || element.height || 0),
        inNav: Boolean(element.inNav),
        brand: Boolean(element.brand)
      };
    })
    .filter(Boolean)
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
  return elements.find((element) => element.role === 'brand' && element.y <= 12) || null;
}

function pickHero(elements) {
  return elements.find((element) => element.role === 'hero') || elements.find((element) => element.role === 'section') || null;
}

function pickSections(elements, count) {
  return elements
    .filter((element) => element.role === 'section')
    .filter((element) => element.y > 16)
    .sort((a, b) => a.top - b.top)
    .filter((element, index, list) => list.findIndex((item) => item.text === element.text) === index)
    .slice(0, count);
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
    .map((element) => ({ element, score: (CTA_RE.test(element.text) ? 8 : 0) + (element.href ? 2 : 0) + (element.y < 55 ? 2 : 0) }))
    .sort((a, b) => b.score - a.score)[0]?.element || null;
}

function defaultElementBehavior(element, transitionElement, isLast) {
  if (transitionElement?.id === element.id) return 'navigate';
  if (isLast && element.role === 'cta') return 'click';
  return 'skip';
}

export function createDirectorPlan(pages, options = {}) {
  const detail = options.detail || 'standard';
  const sectionCount = detail === 'compact' ? 1 : detail === 'detailed' ? 4 : 2;
  const normalizedPages = pages.map((page, pageIndex) => {
    const analysis = page.sourceAnalysis || { url: page.sourceUrl || '', title: page.name || `페이지 ${pageIndex + 1}`, elements: [] };
    const elements = normalizeElements(analysis);
    const nextPage = pages[pageIndex + 1];
    const transitionElement = matchLinkToPage(elements, nextPage?.sourceUrl);
    const brand = pageIndex === 0 ? pickBrand(elements) : null;
    const hero = pickHero(elements);
    const sections = pickSections(elements, sectionCount);
    const cta = pickCta(elements);
    const selected = [brand, hero, ...sections, transitionElement, pageIndex === pages.length - 1 ? cta : null].filter(Boolean);
    const unique = selected.filter((element, index, list) => list.findIndex((item) => item.id === element.id) === index);
    const candidatePool = [...unique, ...elements.filter((element) => ['brand', 'hero', 'section', 'nav', 'cta', 'link', 'control'].includes(element.role))]
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
      detectedCount: elements.length
    };
  });
  return { version: 1, detail, pages: normalizedPages };
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
  order.forEach((pageIndex) => {
    const page = pages[pageIndex];
    const active = page.elements.filter((element) => element.behavior !== 'skip');
    const navigate = active.find((element) => element.behavior === 'navigate');
    const beforeNavigate = navigate ? active.filter((element) => element.id !== navigate.id) : active;
    specs.push({ pageIndex, role: 'overview', label: `${page.title} · 전체`, x: 50, y: pageIndex === order[0] ? 10 : 18, zoom: 100, behavior: 'focus' });
    beforeNavigate.forEach((element) => {
      specs.push({ pageIndex, role: element.role, label: element.text, x: element.x, y: element.y, zoom: element.role === 'brand' ? 128 : element.role === 'hero' ? 118 : element.role === 'section' ? 132 : 148, behavior: element.behavior, href: element.href, targetPageIndex: element.targetPageIndex });
    });
    if (navigate) specs.push({ pageIndex, role: navigate.role, label: navigate.text, x: navigate.x, y: navigate.y, zoom: 148, behavior: 'navigate', href: navigate.href, targetPageIndex: navigate.targetPageIndex });
  });
  const lastIndex = order.at(-1);
  if (Number.isInteger(lastIndex)) specs.push({ pageIndex: lastIndex, role: 'outro', label: `${pages[lastIndex].title} · 마무리`, x: 50, y: 50, zoom: 100, behavior: 'focus' });
  return specs;
}

