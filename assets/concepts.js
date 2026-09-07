export const sourceTypes = [
  { id:'url', label:'웹사이트 URL', short:'DOM · 링크 · 실제 위치', description:'공개 페이지의 로고, 제목, 메뉴, 버튼, 제품 화면과 실제 href를 읽어 브라우저 리뷰 동선을 만듭니다.' },
  { id:'image', label:'이미지 / 스크린샷', short:'순서 · 프레이밍 · 포커스', description:'이미지 순서를 스토리 순서로 사용하고 전체·디테일·비교·결과 장면을 구성합니다.' },
  { id:'video', label:'영상 / 화면 녹화', short:'클립 · 구간 · 행동', description:'클립 흐름은 유지하고 중요한 구간에 카메라, 커서, 전환, 사운드를 적용합니다.' }
];

export const featureDefinitions = [
  { id:'logo', label:'브랜드 진입', description:'로고/브랜드를 짧게 확인한 뒤 본문으로 이동합니다.' },
  { id:'overview', label:'첫 화면 Establish', description:'페이지 또는 미디어 전체 구도를 먼저 보여줍니다.' },
  { id:'h1', label:'H1 핵심 메시지', description:'첫 핵심 제목을 찾아 자연스럽게 줌인합니다.' },
  { id:'sections', label:'중요 H2/H3 탐색', description:'모든 제목이 아니라 중요도가 높은 섹션만 2~4개 선택합니다.' },
  { id:'media', label:'제품 화면 / 이미지 집중', description:'제품 UI, 프리뷰, 영상, 핵심 이미지를 우선적으로 보여줍니다.' },
  { id:'navigation', label:'정확한 메뉴 이동', description:'다음 입력 URL과 href가 정확히 일치하는 링크만 클릭 대상으로 사용합니다.' },
  { id:'cta', label:'CTA 행동', description:'의미가 확인된 CTA만 카메라 정착 → 커서 → 클릭 순서로 처리합니다.' },
  { id:'hover', label:'Hover 예고', description:'클릭 전에 0.2~0.4초 정착/hover를 넣어 행동을 읽기 쉽게 만듭니다.' },
  { id:'scan', label:'자연스러운 페이지 탐색', description:'가까운 곳은 Sweep, 먼 곳은 Zoom-out → 이동 → 재진입으로 연결합니다.' },
  { id:'chapter', label:'챕터 전환', description:'URL/hash가 바뀔 때 이전 장면과 다음 장면의 관계가 보이는 전환을 넣습니다.' },
  { id:'labels', label:'라벨 중심 선택', description:'버튼/메뉴 텍스트와 제목을 우선해 의미 있는 요소만 남깁니다.' },
  { id:'outro', label:'마무리 Resolve', description:'마지막에 전체 화면 또는 최종 결과로 안정적으로 빠집니다.' },
  { id:'sound', label:'BGM + 행동 악센트', description:'컨셉에 맞는 BGM과 클릭/챕터 전환 효과음을 자동 적용합니다.' }
];

const all=(...ids)=>ids;
const baseUrl=all('overview','h1','sections','media','navigation','cta','hover','scan','chapter','labels','outro','sound');
const imageBase=all('overview','sections','media','scan','outro','sound');
const videoBase=all('overview','media','scan','outro','sound');

export const concepts = [
  { id:'expert-review', group:'review', title:'AI 제품 리뷰', badge:'추천', tone:'처음 보는 사람이 사이트를 실제로 둘러보는 느낌', description:'브랜드 → Hero → 제품 화면 → 핵심 섹션 → 정확한 메뉴/CTA → 다음 화면 순으로 제품을 리뷰합니다.', duration:'18–30초', intensity:'중간+', preferredSource:'url', features:['logo',...baseUrl], templates:['impact-flow','product-tour','cursor-walkthrough'], audio:'softCorporate', director:{pageLimit:6,elementLimit:8,maxBeatsPerPage:4,headingCount:2,mediaCount:1,actionCount:1} },
  { id:'guided-tour', group:'review', title:'기능 투어', badge:'SaaS', tone:'기능과 실제 행동을 번갈아 보여주는 구조', description:'기능 제목 → 제품 UI → 행동 → 결과를 반복해 사용 방법을 빠르게 이해시킵니다.', duration:'18–28초', intensity:'중간', preferredSource:'url', features:[...baseUrl], templates:['product-tour','feature-spotlight','settings-tour'], audio:'focusDrive', director:{pageLimit:6,elementLimit:8,maxBeatsPerPage:4,headingCount:2,mediaCount:1,actionCount:1} },
  { id:'onboarding', group:'review', title:'온보딩 / 사용법', badge:'How-to', tone:'초보 사용자가 따라할 수 있는 단계형 설명', description:'입력 → 선택 → 실행 → 결과 같은 실제 조작 순서를 클릭 중심으로 구성합니다.', duration:'20–40초', intensity:'차분+', preferredSource:'url', features:[...baseUrl], templates:['cursor-walkthrough','form-flow','settings-tour'], audio:'minimalKeys', director:{pageLimit:6,elementLimit:9,maxBeatsPerPage:5,headingCount:2,mediaCount:1,actionCount:2} },
  { id:'click-through', group:'review', title:'클릭 워크스루', badge:'Cursor', tone:'메뉴와 버튼 행동 자체가 스토리가 되는 흐름', description:'정확히 연결되는 메뉴/버튼을 중심으로 hover → click → 다음 화면을 반복합니다.', duration:'15–30초', intensity:'중간+', preferredSource:'url', features:all('overview','h1','navigation','cta','hover','chapter','labels','outro','sound'), templates:['cursor-walkthrough','quick-demo','impact-flow'], audio:'focusDrive', director:{pageLimit:8,elementLimit:7,maxBeatsPerPage:4,headingCount:1,mediaCount:0,actionCount:2} },
  { id:'website-walk', group:'website', title:'랜딩 페이지 쇼케이스', badge:'Website', tone:'웹페이지를 위→아래로 자연스럽게 리뷰', description:'Hero, 제품 이미지, 중요한 섹션을 읽듯 훑고 필요할 때만 내부 링크를 클릭합니다.', duration:'25–45초', intensity:'중간', preferredSource:'url', features:['logo',...baseUrl], templates:['landing-scroll','section-hopper','impact-flow'], audio:'softCorporate', director:{pageLimit:4,elementLimit:10,maxBeatsPerPage:5,headingCount:3,mediaCount:2,actionCount:1} },
  { id:'launch-impact', group:'promo', title:'런칭 티저', badge:'Fast', tone:'첫 3초 Hook과 강한 제품 임팩트', description:'Hero → 제품 디테일 → 핵심 포인트 2~3개 → CTA를 빠른 컷과 Punch로 연결합니다.', duration:'7–15초', intensity:'강함', preferredSource:'url', features:all('overview','h1','media','sections','cta','hover','outro','sound'), templates:['launch-cuts','social-punch','hero-dive'], audio:'launchDrive', director:{pageLimit:3,elementLimit:5,maxBeatsPerPage:3,headingCount:1,mediaCount:1,actionCount:1} },
  { id:'ui-interaction', group:'product', title:'UI 인터랙션 데모', badge:'UI', tone:'제품 화면과 조작 피드백 중심', description:'제품 UI를 크게 잡고 클릭, 입력, 전환이 읽히도록 커서와 카메라를 동기화합니다.', duration:'12–24초', intensity:'중간+', preferredSource:'video', features:all('overview','media','hover','scan','chapter','outro','sound'), templates:['cursor-walkthrough','dashboard-scan','quick-demo'], audio:'focusDrive', director:{pageLimit:5,elementLimit:6,maxBeatsPerPage:4,headingCount:1,mediaCount:2,actionCount:1} },
  { id:'dashboard-story', group:'product', title:'대시보드 / 데이터 스토리', badge:'Data', tone:'큰 화면 안에서 지표와 기능을 단계적으로 탐색', description:'전체 대시보드 → 핵심 카드/차트 → 세부 결과로 이동하며 데이터 흐름을 보여줍니다.', duration:'15–30초', intensity:'중간', preferredSource:'image', features:[...imageBase], templates:['dashboard-scan','table-focus','feature-spotlight'], audio:'minimalKeys', director:{pageLimit:5,elementLimit:7,maxBeatsPerPage:4,headingCount:1,mediaCount:3,actionCount:0} },
  { id:'feature-focus', group:'product', title:'핵심 기능 집중', badge:'Feature', tone:'한두 기능을 크게 보여주는 설명형', description:'전체 맥락은 짧게, 기능 UI와 결과를 크게 잡아 세부 설명에 집중합니다.', duration:'10–20초', intensity:'중간+', preferredSource:'image', features:[...imageBase], templates:['feature-spotlight','feature-trio','dashboard-scan'], audio:'focusDrive', director:{pageLimit:4,elementLimit:6,maxBeatsPerPage:4,headingCount:2,mediaCount:2,actionCount:0} },
  { id:'release-notes', group:'promo', title:'업데이트 / 릴리즈', badge:'Update', tone:'새 기능 여러 개를 짧게 순회', description:'업데이트 제목 → 새 기능 카드/화면 → 결과 → 다음 기능을 빠르게 연결합니다.', duration:'12–24초', intensity:'중간+', preferredSource:'image', features:[...imageBase], templates:['release-notes','feature-trio','quick-demo'], audio:'glassMotion', director:{pageLimit:6,elementLimit:6,maxBeatsPerPage:3,headingCount:1,mediaCount:2,actionCount:0} },
  { id:'before-after', group:'compare', title:'비포 / 애프터', badge:'Compare', tone:'변화와 결과를 한눈에 비교', description:'이전 상태 → 전환 → 개선 상태 → 결과 포인트를 중심으로 변화가 분명하게 보이게 합니다.', duration:'8–18초', intensity:'중간+', preferredSource:'image', features:[...imageBase], templates:['before-after','feature-trio','quick-demo'], audio:'focusDrive', director:{pageLimit:4,elementLimit:4,maxBeatsPerPage:3,headingCount:1,mediaCount:2,actionCount:0} },
  { id:'portfolio-case', group:'showcase', title:'포트폴리오 / 케이스 스터디', badge:'Case', tone:'문제 → 과정 → 결과를 이미지 중심으로 전개', description:'대표 이미지, 디테일, 결과 화면을 넓은 프레이밍과 긴 호흡으로 보여줍니다.', duration:'20–40초', intensity:'차분+', preferredSource:'image', features:[...imageBase], templates:['portfolio-glide','editorial-drift','calm-showcase'], audio:'ambientFlow', director:{pageLimit:8,elementLimit:5,maxBeatsPerPage:3,headingCount:1,mediaCount:2,actionCount:0} },
  { id:'image-story', group:'showcase', title:'이미지 스토리', badge:'Images', tone:'스크린샷/사진을 자연스럽게 연결', description:'여러 이미지를 전체 → 디테일 → 다음 이미지로 이어 하나의 짧은 스토리로 만듭니다.', duration:'12–30초', intensity:'중간', preferredSource:'image', features:[...imageBase], templates:['portfolio-glide','feature-trio','calm-showcase'], audio:'ambientFlow', director:{pageLimit:8,elementLimit:4,maxBeatsPerPage:3,headingCount:0,mediaCount:2,actionCount:0} },
  { id:'video-highlight', group:'showcase', title:'영상 하이라이트', badge:'Clips', tone:'여러 클립의 핵심 구간만 연결', description:'클립 순서를 유지하며 핵심 행동과 결과 구간에 카메라/전환/사운드를 얹습니다.', duration:'15–35초', intensity:'중간+', preferredSource:'video', features:[...videoBase], templates:['quick-demo','launch-cuts','calm-showcase'], audio:'focusDrive', director:{pageLimit:8,elementLimit:4,maxBeatsPerPage:3,headingCount:0,mediaCount:2,actionCount:0} },
  { id:'mobile-demo', group:'social', title:'모바일 앱 데모', badge:'9:16', tone:'세로 화면과 터치 흐름 중심', description:'모바일 화면을 세로 비율로 크게 보여주고 주요 터치/결과를 빠르게 연결합니다.', duration:'8–20초', intensity:'중간+', preferredSource:'video', features:[...videoBase], templates:['mobile-app-demo','quick-demo','social-punch'], audio:'focusDrive', aspect:'9:16', director:{pageLimit:6,elementLimit:4,maxBeatsPerPage:3,headingCount:0,mediaCount:2,actionCount:0} },
  { id:'social-short', group:'social', title:'숏폼 / 소셜', badge:'Short', tone:'짧고 빠르게 핵심 3포인트', description:'첫 2초 Hook → 핵심 3포인트 → CTA/결과로 끝내는 짧은 영상입니다.', duration:'6–12초', intensity:'매우 강함', preferredSource:'image', features:all('overview','h1','media','sections','cta','outro','sound'), templates:['social-punch','quick-demo','launch-cuts'], audio:'launchDrive', aspect:'9:16', director:{pageLimit:3,elementLimit:4,maxBeatsPerPage:3,headingCount:1,mediaCount:1,actionCount:1} },
  { id:'calm-premium', group:'showcase', title:'프리미엄 시네마틱', badge:'Calm', tone:'여백과 제품 화면을 살리는 느린 카메라', description:'텍스트는 최소화하고 제품 화면/이미지를 길게 보여주며 부드러운 프레이밍으로 구성합니다.', duration:'20–40초', intensity:'차분함', preferredSource:'image', features:[...imageBase], templates:['calm-showcase','luxury-scroll','slow-product-film'], audio:'ambientFlow', director:{pageLimit:8,elementLimit:5,maxBeatsPerPage:3,headingCount:1,mediaCount:2,actionCount:0} }
];

export const conceptGroups = [
  {id:'all',label:'전체'}, {id:'review',label:'리뷰/사용법'}, {id:'website',label:'웹사이트'}, {id:'product',label:'제품/UI'}, {id:'promo',label:'런칭/업데이트'}, {id:'showcase',label:'쇼케이스'}, {id:'compare',label:'비교'}, {id:'social',label:'모바일/소셜'}
];

export function getConcept(id){return concepts.find(item=>item.id===id)||concepts[0];}
export function getSource(id){return sourceTypes.find(item=>item.id===id)||sourceTypes[0];}
export function defaultConceptState(){const c=concepts[0];return{id:c.id,sourceType:c.preferredSource,features:[...c.features],selectedDraft:null,urls:'',group:'all'};}
export function draftOptions(conceptId){const c=getConcept(conceptId);return c.templates.map((templateId,index)=>({id:`${c.id}:${templateId}`,templateId,rank:index+1,label:index===0?'추천 초안':index===1?'대안 A':'대안 B',conceptId:c.id,audio:c.audio,aspect:c.aspect||'16:9'}));}
export function sourceRequirements(conceptId,sourceType){const c=getConcept(conceptId);if(sourceType==='url')return['공개 URL 1개 이상','URL마다 실제 DOM 위치와 링크 관계 확인',c.features.includes('navigation')?'제공한 다음 URL과 정확히 연결되는 링크만 클릭':'페이지의 핵심 제목·제품 화면 중심',`기본 최대 ${c.director.pageLimit}개 챕터 · 페이지당 ${c.director.maxBeatsPerPage}개 핵심 비트`];if(sourceType==='image')return['이미지/스크린샷 1장 이상','파일 순서를 스토리 순서로 사용',c.id==='before-after'?'2장 이상 권장 · 첫 장 Before / 다음 장 After':'컨셉에 따라 전체·디테일·결과 프레이밍 자동 생성'];return['MP4/WebM 또는 화면 녹화 클립 1개 이상','클립 자체의 시간 흐름 유지','여러 클립은 입력 순서대로 챕터 구성'];}
