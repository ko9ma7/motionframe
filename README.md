# MotionFrame Studio v11

MotionFrame Studio v11은 **컨셉을 먼저 고르고, 소스 유형에 맞는 데이터만 받은 뒤, 추천 초안 3개 중 하나를 골라 편집하는** GitHub Pages용 브라우저 영상 제작 도구입니다.

이전 버전처럼 `URL → 좌표 Scene`부터 시작하지 않습니다.

```text
Concept
  ↓
Source type (URL / Image / Video)
  ↓
Required data + auto features
  ↓
Source-aware analysis
  ↓
3 generated drafts
  ↓
Flow edit
  ↓
Low-level scene edit
  ↓
Sound + WebM
```

## 기본 컨셉 8개

- AI 제품 리뷰 — 로고 → 첫 화면 → H1 → 제품 UI → 섹션 → 메뉴/CTA → 다음 화면 → Outro
- 기능 투어 — 기능 제목과 제품 행동 중심
- 런칭 임팩트 — 8~15초의 빠른 Hero / 제품 / CTA
- 웹사이트 워크스루 — 페이지를 실제로 훑는 흐름
- 핵심 기능 집중 — UI와 결과를 크게 보여주는 설명형
- 숏폼 / 소셜 — 9:16, 첫 2초 Hook + 3포인트
- 프리미엄 쇼케이스 — 이미지·제품 화면을 길게 보여주는 시네마틱
- 비포 / 애프터 — 변화 전후 비교

각 컨셉은 권장 길이, 연출 강도, 자동 기능, 페이지당 분석 비트 수, 추천 모션 템플릿 3개, 기본 사운드를 따로 가집니다.

## 소스 유형별 처리

### URL

URL은 실제 렌더링된 페이지에서 다음을 분석합니다.

- 브랜드/로고 후보
- H1/H2/H3
- 제품 화면 후보 (`img`, `video`, `canvas`, preview/browser-like surface)
- 메뉴와 CTA
- `href`
- 현재 viewport와 `scrollY`
- 요소 bounding box

다음 URL과 **정확히 href가 일치하는 메뉴/CTA만** 자동 클릭 Flow로 사용합니다. 연결되는 요소를 찾지 못하면 다른 버튼을 임의로 대신 클릭하지 않습니다.

같은 문서의 `#hash` URL은 별도 페이지로 중복 분석하는 대신 해당 위치의 viewport chapter로 취급합니다.

### 이미지 / 스크린샷

이미지에는 DOM이 없으므로 URL용 규칙을 억지로 적용하지 않습니다.

- 파일 순서 = 기본 스토리 순서
- 각 이미지를 하나의 media chapter로 취급
- 컨셉에 따라 Overview / Detail / Compare / Punch 모션 적용
- 여러 이미지는 synthetic chapter transition으로 연결

### 영상 / 화면 녹화

영상은 클립의 실제 재생시간을 유지하며 카메라·전환·사운드를 얹습니다.

- MP4 / WebM
- 화면 녹화 최대 30초
- 여러 클립은 파일 순서로 연결
- Product Tour / Launch / Calm 등의 컨셉 모션을 적용

## 초안 우선

소스 분석이 끝나도 곧바로 수십 개 Scene을 만들지 않습니다.

선택한 컨셉에 맞는 기존 모션 템플릿 중 3개만 추천합니다.

```text
추천 초안
대안 A
대안 B
```

각 카드에서 예상 비트 수, 연출 강도, 사운드, 주요 모션을 확인한 뒤 하나를 선택합니다. **선택한 순간에만 편집 Scene이 생성됩니다.**

24개 전체 템플릿 라이브러리는 고급 모션 스타일 영역에 그대로 남아 있습니다.

## 자동 기능 체크

처음부터 사용자가 Flow를 만들지 않도록 기본 기능을 켜둡니다.

- 로고/브랜드 진입
- 첫 화면 전체
- H1 핵심 제목
- 주요 H2/H3 훑기
- 제품 화면/이미지 집중
- 메뉴 이동 + 클릭
- CTA/버튼 행동
- 페이지 자연 탐색
- 마무리 줌아웃
- 기본 사운드 + 클릭 악센트

필요 없는 항목만 체크 해제하면 됩니다.

## Flow와 편집기

추천 초안을 선택한 뒤 Flow에서 내용 순서와 행동을 수정합니다.

그 다음 필요한 경우에만 저수준 편집기로 내려갑니다.

- 직선 / 곡선 / 자유 path
- 시작/끝 zoom
- cursor
- transition
- 16:9 / 9:16 / 1:1
- 720p / 1080p
- 사운드 미리듣기
- WebM export

## URL capture

공개 웹사이트는 Microlink browser capture API를 우선 사용하고, 실패하면 mShots 이미지 fallback을 시도합니다. mShots fallback에는 DOM geometry가 없으므로 자동 Flow 정확도가 떨어질 수 있습니다.

로그인된 제품이나 데스크톱 프로그램은 URL 대신 화면 녹화/영상 소스를 사용하세요.

## 로컬 검증

의존성 설치가 필요 없습니다.

```bash
node scripts/verify.mjs
```

검증 항목에는 다음이 포함됩니다.

- 8 concepts
- 3 source types
- concept당 3 draft options
- 24 built-in motion templates
- DOM function byte limit
- URL exact-link navigation
- brand/H1/media selection
- image media Flow
- audio / WebM code path
- responsive concept UI
- DOM id/reference consistency
- ES module syntax

## GitHub Pages

1. 프로젝트 전체를 repository root에 업로드합니다.
2. `main` branch에 push합니다.
3. GitHub → Settings → Pages → Source를 `GitHub Actions`로 지정합니다.
4. 포함된 workflow가 `node scripts/verify.mjs`를 실행한 뒤 정적 사이트를 배포합니다.

```text
https://USERNAME.github.io/REPOSITORY/
```

## 제한

GitHub Pages 자체는 다른 origin의 DOM을 직접 읽을 수 없습니다. 공개 URL 분석은 외부 browser capture API에 의존합니다. 로그인 세션을 포함한 실제 브라우저 탐색/클릭까지 완전 자동화하려면 캡처 계층을 Playwright/Chromium worker로 분리하는 것이 더 안정적입니다.

## License

MIT
