# MotionFrame Studio v6

MotionFrame Studio는 **사이트 URL을 분석하고, 실제 DOM 위치·페이지 링크 관계·제품 화면을 바탕으로 제품 소개 영상의 기본 샷 구성을 자동으로 만든 뒤 WebM으로 내보내는 GitHub Pages용 브라우저 편집기**입니다.

v6의 목표는 “화면에 줌 효과를 여러 번 주는 것”이 아니라, 기본 생성 결과부터 **제품 소개 영상의 호흡**이 느껴지도록 만드는 것입니다.

별도 앱 서버나 DB 없이 정적 GitHub Pages에서 실행됩니다. 프로젝트와 업로드 미디어는 사용자의 브라우저(LocalStorage + IndexedDB)에 저장됩니다.

## v6 핵심: Cinematic Auto Director

처리 흐름:

```text
URL
 ↓
렌더링 + 화면 캡처
 ↓
실제 DOM 좌표 / 크기 / href / 제품 화면 분석
 ↓
페이지 간 링크 그래프
 ↓
Cinematic Auto Director
 ↓
Establish → Focus → Hold → Cursor → Click → Page Flow → Resolve
 ↓
모션 스타일 / 사운드
 ↓
세부 편집
 ↓
WebM
```

### 기본 샷 문법

표준 모드는 다음 순서를 우선합니다.

```text
페이지 전체 Establish
→ H1 / Hero에 부드럽게 도착
→ 잠시 정착하여 읽을 시간 제공
→ 제품 UI / Mockup이 있으면 제품 화면 Focus
→ 핵심 기능 섹션 Focus
→ 연결 메뉴/버튼으로 카메라 이동
→ 커서가 실제 DOM 좌표로 이동
→ Click
→ 다음 페이지 Page Flow
→ 다음 페이지 Hero / 제품 / 기능
→ 마지막 CTA
→ 안정적인 Zoom Out / Resolve
```

같은 화면 안에서 장면이 바뀔 때는 기본적으로 `cut`을 사용하여 같은 글자가 두 겹으로 보이는 Crossfade를 피합니다. 실제 페이지가 바뀌는 경우에만 `Page Flow` 전환을 사용합니다.

## Safe Framing

v5까지의 카메라 좌표는 포커스 값을 crop 범위의 비율처럼 사용하여 좌상단 제목이 잘리거나 목표 요소가 화면 중심에서 벗어날 수 있었습니다.

v6는 DOM 요소의 실제 중심점을 source coordinate로 사용합니다.

- H1/H2처럼 좌측 정렬된 텍스트는 화면의 약 38% 지점에 배치해 왼쪽 여백을 보존합니다.
- 우측 제품 이미지/대시보드는 우측 프레이밍을 사용합니다.
- 메뉴는 상단 영역의 맥락을 유지합니다.
- CTA는 버튼 주변 문맥이 보이도록 과도한 줌을 제한합니다.
- 요소 크기에 따라 최대 줌을 자동 제한합니다.

기본 줌도 공격적으로 확대하지 않습니다. Hero, 제품 화면, 기능, 메뉴, CTA마다 권장 범위를 별도로 사용합니다.

## Move → Settle → Read → Click

각 장면 전체 시간 동안 계속 카메라가 움직이지 않습니다.

v6에서는 장면의 앞부분에서 이동을 끝내고 뒤쪽은 정착 상태로 유지합니다. 클릭 장면은 별도 타이밍으로:

```text
카메라 이동
→ 정착
→ 내용 읽기
→ 커서 이동
→ 클릭
```

순서를 갖습니다.

## 실제 커서 좌표

커서도 단순히 Canvas의 `x% / y%`에 그리지 않습니다. 현재 카메라 crop/zoom을 계산한 후 **DOM source coordinate를 실제 출력 frame coordinate로 투영**합니다.

따라서 카메라가 확대된 상태에서도 커서가 분석한 메뉴/버튼 위치에 맞춰집니다.

## 제품 화면 감지

DOM 분석 대상에는 다음도 포함됩니다.

- `main img`
- `main video`
- mockup / preview 계열 요소
- logo / brand 후보

표준 Auto Director는 단순히 제목만 연속으로 보여주지 않고, 충분히 큰 제품 UI/미디어가 있으면 Hero 뒤에 제품 화면 샷을 우선 포함합니다.

## 링크별 페이지 연출

각 페이지의 감지 요소에는 다음 행동을 지정할 수 있습니다.

- **설명 · 줌인**
- **클릭 연출**
- **클릭 → 페이지 이동**
- **사용 안 함**

href가 입력한 다음 URL과 일치하면 기본적으로 페이지 이동 후보가 됩니다.

예:

```text
Home Hero
→ Product UI
→ Features 메뉴 Click
→ Features 페이지
→ 주요 기능
→ Pricing 메뉴 Click
→ Pricing 페이지
→ Start free CTA
→ Resolve
```

Auto Director 계획은 프로젝트에 저장되므로 링크별 판단을 수정한 뒤 다시 적용할 수 있습니다.

## URL 하나만 입력

`내부 핵심 링크 자동 분석`을 켜면 Home에서 가장 제품 소개에 적합한 내부 링크를 고르고, 다음 페이지에서 다시 다음 핵심 링크를 찾는 방식으로 연쇄 분석합니다.

가능한 경우:

```text
Home → Features → Pricing / Demo
```

형태의 선형 소개 동선을 만듭니다.

로그인/약관/개인정보/블로그 같은 링크는 제품 소개 기본 동선에서 낮은 우선순위를 가집니다.

## Motion Path Editor

자동 카메라 경로가 마음에 들지 않으면 미리보기 위에서 직접 수정합니다.

- 직선: 시작점/끝점 클릭
- 곡선: 경유점을 여러 번 클릭
- 자유선: 마우스/펜 드래그
- 초기화: 자동 경로로 복귀

좌표 숫자는 고급 설정으로 남아 있지만 필수 입력이 아닙니다.

## Sound Design

기본 BGM은 Web Audio API로 생성하며 카드에서 즉시 미리듣기할 수 있습니다.

- Ambient Flow
- Soft Corporate
- Lo-fi Product
- Minimal Keys
- Glass Motion
- Focus Drive
- Launch Drive

또한 v6는 procedural BGM에 장면 문법을 반영해:

- Click 장면의 작은 클릭 accent
- Page Flow 직전의 짧은 airy transition accent

를 자동으로 섞습니다.

MP3 / WAV / OGG 사용자 음원도 사용할 수 있습니다.

## WebM export 동기화

v6는 `canvas.captureStream(0)` + `CanvasCaptureMediaStreamTrack.requestFrame()`을 지원하는 브라우저에서는 **30fps cadence로 프레임을 명시적으로 요청하고 wall-clock 타임라인에 맞춰 렌더링**합니다.

이를 통해 실시간 `requestAnimationFrame` 속도에 따라 영상 프레임이 부족해지고 오디오만 더 길게 남는 문제를 줄였습니다. 지원하지 않는 브라우저에서는 30fps captureStream으로 fallback 합니다.

내보내기는 Canvas video track과 Web Audio audio track을 하나의 MediaStream에 넣어 WebM으로 기록합니다.

## Inputs

- URL
- PNG / JPG / WebP / GIF
- MP4 / WebM
- 사용자가 승인한 화면 캡처
- 화면 녹화 클립

로그인이 필요한 웹앱/프로그램은 URL 캡처 서비스가 세션에 접근할 수 없으므로 화면 녹화 또는 미디어 업로드가 적합합니다.

## Templates

24개 템플릿은 **콘텐츠 순서를 결정하는 엔진이 아니라 연출 스타일 레이어**입니다.

Auto Director가 `무엇을 보여줄지`를 결정하고 템플릿은 속도, 화면비, 프레임 스타일, 전환 성격, 기본 오디오를 조정합니다.

## Project structure

```text
/
├─ index.html
├─ 404.html
├─ manifest.webmanifest
├─ favicon.svg
├─ favicon-16x16.png
├─ favicon-32x32.png
├─ apple-touch-icon.png
├─ icon-192.png
├─ icon-512.png
├─ og-image.png
├─ repo-social-preview.png
├─ assets/
│  ├─ app.js
│  ├─ director.js
│  ├─ templates.js
│  ├─ audio.js
│  └─ styles.css
├─ scripts/
│  └─ verify.mjs
└─ .github/workflows/deploy.yml
```

## Verification

```bash
node scripts/verify.mjs
```

현재 검증은 다음을 포함합니다.

- 4개 ES module 문법 검사
- 필수 파일 / DOM ID 검사
- 24개 템플릿 / 17개 motion preset
- Microlink Browser Function 1024-byte 제한 검사
- 실제 source-coordinate camera framing
- Hero safe anchor / restrained zoom
- 제품 화면 감지
- 같은 페이지 shot continuity
- Page Flow navigation
- cursor source → frame projection
- motion path
- scene click/page sound accents
- fixed-frame WebM export path
- Home → Features → Pricing synthetic Director 테스트
- GitHub Pages workflow

## GitHub Pages deployment

1. ZIP 안쪽 파일 전체를 Repository 루트에 덮어씁니다.
2. commit / push 합니다.
3. Repository → **Settings → Pages → Source: GitHub Actions**.
4. `Deploy MotionFrame Studio to GitHub Pages` Action 성공을 확인합니다.

`ko9ma7/motionframe`:

```text
https://ko9ma7.github.io/motionframe/
```

### v5 프로젝트가 브라우저에 남아 있는 경우

v6는 기존 IndexedDB 미디어를 보존하고 v5 LocalStorage 프로젝트도 읽습니다. 하지만 **v5에서 이미 만들어진 장면의 카메라 값 자체는 이전 연출 결과**입니다.

v6의 새 연출 품질을 확인할 때는 기존 URL을 다시 `Auto Director로 쇼릴 만들기` 하거나 한 번 `초기화`한 뒤 새 프로젝트를 생성하는 것을 권장합니다.
