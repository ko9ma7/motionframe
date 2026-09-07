export const sourceTypes = [
  { id:'url', label:'웹사이트 URL', short:'DOM + 링크 + 실제 위치', description:'공개 페이지의 제목, 메뉴, 버튼, 제품 화면, 링크 관계를 읽어 리뷰 동선을 만듭니다.' },
  { id:'image', label:'이미지 / 스크린샷', short:'순서 + 프레이밍 + 포커스', description:'여러 이미지를 하나의 스토리로 묶고 전체 → 디테일 → 다음 이미지 흐름으로 연출합니다.' },
  { id:'video', label:'영상 / 화면 녹화', short:'클립 + 구간 + 행동', description:'클립 자체를 유지하면서 시작/핵심/행동/결과 구간을 중심으로 카메라와 사운드를 얹습니다.' }
];

export const featureDefinitions = [
  { id:'logo', label:'로고/브랜드 진입', description:'시작 직후 브랜드를 짧게 보여줍니다.' },
  { id:'overview', label:'첫 화면 전체', description:'시작 시 전체 구도를 먼저 인지시킵니다.' },
  { id:'h1', label:'H1 핵심 제목', description:'가장 중요한 메시지로 강하게 진입합니다.' },
  { id:'sections', label:'주요 H2/H3 훑기', description:'중요 섹션만 골라 자연스럽게 이동합니다.' },
  { id:'media', label:'제품 화면/이미지 집중', description:'제품 UI나 핵심 이미지를 텍스트보다 우선해서 보여줍니다.' },
  { id:'navigation', label:'메뉴 이동 + 클릭', description:'다음 제공 URL과 정확히 연결되는 메뉴만 실제 클릭 흐름으로 사용합니다.' },
  { id:'cta', label:'CTA/버튼 행동', description:'다음 장면의 원인이 되는 CTA만 카메라 정착 → 커서 → 클릭으로 처리합니다.' },
  { id:'scan', label:'페이지 자연 탐색', description:'가까운 요소는 Sweep, 먼 요소는 Zoom-out → 이동 → 재진입으로 연결합니다.' },
  { id:'outro', label:'마무리 줌아웃', description:'마지막에 전체 화면으로 빠져 제품 인상을 정리합니다.' },
  { id:'sound', label:'기본 사운드 + 클릭 악센트', description:'컨셉에 맞는 BGM과 클릭/전환 악센트를 기본 적용합니다.' }
];

const all = (...ids) => ids;

export const concepts = [
  {
    id:'expert-review', title:'AI 제품 리뷰', badge:'기본 추천', tone:'제품을 처음 보는 사람이 자연스럽게 훑는 흐름',
    description:'로고 → 첫 화면 → H1 → 제품 화면 → 주요 섹션 → 메뉴 클릭 → 다음 화면 → 마무리 순서로 제품을 리뷰합니다.',
    duration:'20–30초', intensity:'중간+', preferredSource:'url',
    features: all('logo','overview','h1','sections','media','navigation','cta','scan','outro','sound'),
    templates:['impact-flow','product-tour','cursor-walkthrough'], audio:'softCorporate',
    director:{pageLimit:5,elementLimit:6,maxBeatsPerPage:4,headingCount:2,mediaCount:1,actionCount:1}
  },
  {
    id:'guided-tour', title:'기능 투어', badge:'SaaS', tone:'기능과 실제 사용 행동 중심',
    description:'기능 제목 → 제품 UI → 버튼/메뉴 행동 → 결과를 반복해 사용 흐름을 명확하게 보여줍니다.',
    duration:'18–28초', intensity:'중간', preferredSource:'url',
    features: all('overview','h1','sections','media','navigation','cta','scan','outro','sound'),
    templates:['product-tour','feature-spotlight','settings-tour'], audio:'focusDrive',
    director:{pageLimit:5,elementLimit:6,maxBeatsPerPage:4,headingCount:2,mediaCount:1,actionCount:1}
  },
  {
    id:'launch-impact', title:'런칭 임팩트', badge:'Fast', tone:'첫 3초에 강하게 시선을 잡는 런칭/티저',
    description:'Hero → 제품 디테일 → 핵심 기능 2~3개 → CTA를 빠른 컷과 Punch로 연결합니다.',
    duration:'8–15초', intensity:'강함', preferredSource:'url',
    features: all('overview','h1','media','sections','cta','outro','sound'),
    templates:['launch-cuts','social-punch','hero-dive'], audio:'launchDrive',
    director:{pageLimit:3,elementLimit:4,maxBeatsPerPage:3,headingCount:1,mediaCount:1,actionCount:1}
  },
  {
    id:'website-walk', title:'웹사이트 워크스루', badge:'Website', tone:'페이지 구조를 읽듯 자연스럽게 탐색',
    description:'첫 화면에서 시작해 섹션을 위→아래로 훑고, 메뉴와 내부 링크를 실제 이동 동선으로 연결합니다.',
    duration:'25–40초', intensity:'중간', preferredSource:'url',
    features: all('logo','overview','h1','sections','media','navigation','scan','outro','sound'),
    templates:['landing-scroll','section-hopper','impact-flow'], audio:'softCorporate',
    director:{pageLimit:5,elementLimit:8,maxBeatsPerPage:5,headingCount:3,mediaCount:1,actionCount:1}
  },
  {
    id:'feature-focus', title:'핵심 기능 집중', badge:'Feature', tone:'한두 기능을 크게 보여주는 설명형',
    description:'전체 맥락은 짧게, 핵심 기능 UI와 결과를 크게 잡아 세부 설명에 집중합니다.',
    duration:'10–20초', intensity:'중간+', preferredSource:'image',
    features: all('overview','h1','sections','media','cta','outro','sound'),
    templates:['feature-spotlight','feature-trio','dashboard-scan'], audio:'focusDrive',
    director:{pageLimit:3,elementLimit:5,maxBeatsPerPage:4,headingCount:2,mediaCount:2,actionCount:1}
  },
  {
    id:'social-short', title:'숏폼 / 소셜', badge:'9:16', tone:'짧고 빠르게 핵심 3포인트',
    description:'첫 2초 Hook → 핵심 3포인트 → CTA로 끝내는 세로형 짧은 영상에 맞춥니다.',
    duration:'6–12초', intensity:'매우 강함', preferredSource:'image',
    features: all('overview','h1','media','sections','cta','outro','sound'),
    templates:['social-punch','quick-demo','launch-cuts'], audio:'launchDrive', aspect:'9:16',
    director:{pageLimit:3,elementLimit:4,maxBeatsPerPage:3,headingCount:1,mediaCount:1,actionCount:1}
  },
  {
    id:'calm-premium', title:'프리미엄 쇼케이스', badge:'Calm', tone:'여백과 제품 화면을 살리는 느린 시네마틱',
    description:'텍스트는 최소화하고 이미지·제품 화면을 길게 보여주며 부드러운 카메라 이동으로 구성합니다.',
    duration:'18–35초', intensity:'차분함', preferredSource:'image',
    features: all('overview','media','sections','scan','outro','sound'),
    templates:['calm-showcase','luxury-scroll','slow-product-film'], audio:'ambientFlow',
    director:{pageLimit:5,elementLimit:5,maxBeatsPerPage:3,headingCount:1,mediaCount:2,actionCount:0}
  },
  {
    id:'before-after', title:'비포 / 애프터', badge:'Compare', tone:'변화와 결과를 명확히 비교',
    description:'이전 상태 → 전환 → 개선 상태 → 결과 포인트를 중심으로 변화가 한눈에 보이게 구성합니다.',
    duration:'8–18초', intensity:'중간+', preferredSource:'image',
    features: all('overview','media','sections','outro','sound'),
    templates:['before-after','feature-trio','quick-demo'], audio:'focusDrive',
    director:{pageLimit:2,elementLimit:4,maxBeatsPerPage:3,headingCount:1,mediaCount:2,actionCount:0}
  }
];

export function getConcept(id){ return concepts.find((item)=>item.id===id) || concepts[0]; }
export function getSource(id){ return sourceTypes.find((item)=>item.id===id) || sourceTypes[0]; }
export function defaultConceptState(){ const c=concepts[0]; return {id:c.id,sourceType:c.preferredSource,features:[...c.features],selectedDraft:null,urls:''}; }
export function draftOptions(conceptId){
  const c=getConcept(conceptId);
  return c.templates.map((templateId,index)=>({
    id:`${c.id}:${templateId}`,
    templateId,
    rank:index+1,
    label:index===0?'추천 초안':index===1?'대안 A':'대안 B',
    conceptId:c.id,
    audio:c.audio,
    aspect:c.aspect||'16:9'
  }));
}
export function sourceRequirements(conceptId, sourceType){
  const c=getConcept(conceptId);
  if(sourceType==='url') return [
    '공개 URL 1개 이상',
    c.features.includes('navigation')?'메뉴/버튼 링크 관계 분석':'페이지의 주요 제목·제품 화면 분석',
    `기본 ${c.director.pageLimit}페이지 이내 · 페이지당 핵심 ${c.director.maxBeatsPerPage}비트`
  ];
  if(sourceType==='image') return [
    '이미지/스크린샷 1장 이상',
    '파일 순서를 스토리 순서로 사용',
    c.id==='before-after'?'2장 이상 권장 · 첫 장 Before / 다음 장 After':'이미지마다 전체 → 디테일 포커스 기본 생성'
  ];
  return [
    'MP4/WebM 또는 화면 녹화 클립 1개 이상',
    '클립 길이를 유지하며 카메라/사운드 연출 적용',
    '여러 클립은 파일 순서대로 챕터 구성'
  ];
}
