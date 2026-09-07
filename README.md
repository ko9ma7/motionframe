# MotionFrame Studio v8

URL을 분석해 **페이지 범위 → 요소 선택 → 위치 기반 Flow → 모션 → 사운드 → WebM** 순서로 쇼케이스 영상을 만드는 GitHub Pages용 정적 웹앱입니다.

v8의 핵심은 Scene 좌표를 먼저 편집하지 않는 것입니다. 사이트에서 읽은 제목·제품 화면·섹션·메뉴·버튼을 실제 화면 위치 순서로 보여주고, 사용자가 체크한 요소만 이용해 Flow를 다시 계산합니다.

## Preview flow

```text
URL 입력
  ↓
분석 범위 선택
- 최대 1 / 3 / 5 pages
- 페이지당 6 / 10 / 16 elements
- 한 화면 / 섹션 / 요소 단위
- 제목 / 미디어 / 메뉴 / CTA 종류 체크
  ↓
실제 DOM 좌표 분석
  ↓
페이지별 Position Map + 체크 목록
  ↓
Flow 자동 구성
전체 → Hero → Product → 버튼 Click → 실제 목적지 → 다음 선택 요소
  ↓
Motion style
  ↓
Sound
  ↓
WebM
```

## v8 주요 기능

### 1. Analysis Scope

URL을 넣기 전에 분석 한도를 먼저 정합니다.

- 페이지 범위: 1 / 3 / 5
- 페이지당 요소: 6 / 10 / 16
- 위치 묶음: 한 화면 / 섹션 / 요소 단위
- 분석 종류: 제목·섹션, 제품 화면, 메뉴·링크, 버튼·CTA, 브랜드

입력 URL이 하나이고 내부 링크 자동 분석이 켜져 있으면 설정한 페이지 한도까지만 같은 사이트의 핵심 링크를 따라갑니다.

### 2. Position Map

Microlink browser function에서 `getBoundingClientRect()`를 읽어 각 요소의 실제 위치를 저장합니다.

페이지마다 다음을 표시합니다.

- 요소 역할
- 실제 텍스트
- 상단/중단/하단 + 좌/중앙/우 위치
- X/Y 백분율
- href 및 anchor 목적지
- 체크 여부
- 세로 페이지 미니맵의 위치 marker

체크를 끄면 해당 요소는 Flow에서 빠집니다.

### 3. Flow Director

선택된 요소를 단순 나열하지 않습니다.

- 첫 장면은 페이지 Establish
- H1과 제품 화면을 우선 소개
- 같은 페이지 anchor 링크는 `Click → 목적지 Y 좌표`로 연결
- 목적지와 가까운 H2/H3가 있으면 해당 제목으로 정착
- 먼 위치 이동은 `Whip Scroll`
- 제품 화면은 `Arc Orbit`
- 가까운 요소는 `Sweep / Track`
- 다른 URL 링크는 `Page Impact`로 다음 페이지와 연결
- 마지막은 CTA 또는 Resolve

Flow의 각 줄에서 동작과 모션을 다시 선택할 수 있습니다.

### 4. Scene editor

Flow를 영상으로 적용하면 Scene과 camera keyframe이 자동 생성됩니다. Scene 편집기는 세부 조정용입니다.

- 직선 / 곡선 / 자유 패스
- 시작/끝 줌
- 커서 위치와 click
- Transition
- 16:9 / 9:16 / 1:1
- 720p / 1080p

### 5. Sound

- 내장 procedural BGM
- 각 preset 미리듣기
- 사용자 MP3/WAV/OGG 업로드
- volume / fade
- click / page transition accent
- Web Audio track을 Canvas video와 함께 MediaRecorder에 mux

### 6. Local project persistence

- LocalStorage: project configuration
- IndexedDB: uploaded/captured media
- JSON project backup / restore
- Custom motion template save / import

## URL capture

공개 웹사이트 캡처는 Microlink API를 우선 사용합니다. DOM geometry를 받을 수 없거나 캡처 호출이 실패하면 mShots 이미지 캡처를 한 번 더 시도합니다.

로그인 세션이 필요한 SaaS/desktop app은 URL 원격 캡처 대신 `화면 녹화 클립` 또는 영상 업로드를 사용하세요.

## Tech stack

- HTML5
- CSS3
- JavaScript ES modules
- Canvas 2D
- Web Audio API
- MediaRecorder
- LocalStorage
- IndexedDB
- GitHub Pages / GitHub Actions

별도 npm dependency가 없습니다.

## Project structure

```text
/
├─ index.html
├─ 404.html
├─ assets/
│  ├─ app.js
│  ├─ director.js
│  ├─ templates.js
│  ├─ audio.js
│  └─ styles.css
├─ scripts/
│  └─ verify.mjs
├─ .github/workflows/deploy.yml
├─ manifest.webmanifest
├─ favicon.svg
├─ og-image.png
└─ README.md
```

## Local verification

Node가 있으면 dependency 설치 없이 실행할 수 있습니다.

```bash
node scripts/verify.mjs
```

간단한 정적 서버가 필요하면:

```bash
python3 -m http.server 8080
```

## GitHub Pages deployment

1. 이 프로젝트 안의 파일 전체를 repository root에 업로드합니다.
2. `main` branch에 push합니다.
3. GitHub → Settings → Pages → Source를 **GitHub Actions**로 지정합니다.
4. `Deploy MotionFrame Studio to GitHub Pages` workflow가 실행됩니다.

Project repository라면 URL은 다음 형태입니다.

```text
https://USERNAME.github.io/REPOSITORY/
```

Workflow가 `__SITE_URL__`을 실제 Pages URL로 치환해 canonical, OG, sitemap을 생성합니다.

## Important limitation

GitHub Pages 브라우저만으로 다른 origin의 DOM을 직접 읽을 수는 없습니다. 따라서 공개 URL의 DOM geometry는 외부 browser capture API가 필요합니다. API key나 secret은 공개 프론트엔드에 하드코딩하지 않습니다.

대량 상업 사용이나 로그인 session 기반 자동 브라우저 조작까지 필요하면 capture 부분만 Playwright/Chromium serverless worker로 분리하는 것이 다음 확장 단계입니다.

## License

MIT License. 외부 URL 캡처 서비스의 사용 조건과 요금은 해당 제공자의 정책을 따릅니다.
