# MotionFrame Studio

사이트 URL, 화면 녹화, 이미지/영상 클립을 **줌·팬·커서·전환·사운드가 있는 제품 쇼케이스 영상**으로 만드는 GitHub Pages용 정적 웹앱입니다.

서버 DB 없이 브라우저에서 편집하고, 프로젝트와 사용자 템플릿은 LocalStorage/IndexedDB에 저장하며, 최종 결과는 WebM으로 렌더링합니다.

## Preview

첫 화면에서 공개 URL을 바로 캡처하거나 로그인된 웹앱/데스크톱 프로그램을 화면 녹화로 가져올 수 있습니다. 이어서 연출 템플릿을 선택하고 타임라인에서 장면별 설정을 수정합니다.

## Features

### URL → 영상 시퀀스

- 공개 웹사이트 URL 캡처
- 여러 URL을 줄바꿈으로 입력해 페이지 전환 시퀀스 생성
- 전체 페이지 캡처 또는 첫 화면 캡처
- Desktop / Laptop / Tablet / Mobile viewport
- 한 장의 full-page 캡처를 여러 카메라 장면으로 재사용

URL 렌더링은 Microlink Screenshot API를 사용합니다. Microlink는 URL과 `screenshot` 옵션으로 headless browser 캡처를 제공하며 full-page와 viewport 옵션을 지원합니다.

### 미디어 소스

- PNG / JPG / WebP / GIF
- MP4 / WebM 영상 클립
- 브라우저 화면 한 장 캡처
- 브라우저/프로그램 화면 녹화 클립

로그인 세션이 필요한 SaaS나 데스크톱 프로그램은 URL API보다 화면 녹화 방식이 적합합니다.

### Motion Template Library

기본 제공 프로젝트 템플릿:

- Website Story
- Product Tour
- Launch Cuts
- Dashboard Scan
- Cursor Flow
- Calm Showcase
- Mobile Spotlight
- Feature Trio
- Before / After
- Quick Demo

각 템플릿은 장면 개수, 줌, 포커스, 커서, 장면 길이, 전환, 사운드를 함께 구성합니다.

### Custom Templates

현재 편집 상태를 사용자 템플릿으로 저장할 수 있습니다.

- LocalStorage 저장
- 현재 프로젝트 설정으로 덮어쓰기
- JSON 내보내기
- JSON 가져오기
- 삭제

이미지는 템플릿에 포함하지 않아 다른 프로젝트에 쉽게 재사용할 수 있습니다.

### Scene Editor

- 장면 이름/길이
- Crossfade / Zoom out / Slide / Cut
- 시작/끝 줌
- 시작/끝 X/Y 포커스
- 커서 이동/클릭 효과
- 장면 복제/삭제
- 드래그 순서 변경
- 16:9 / 9:16 / 1:1
- Browser / Floating / None frame
- 720p / 1080p

### Sound

내장 사운드는 별도 음원 파일이 아니라 Web Audio로 실시간 생성됩니다.

- Soft Pulse
- Air Pad
- Focus Grid
- Launch Beat
- 무음
- 사용자 오디오 파일
- 볼륨
- Fade in/out
- 미리듣기

### WebM Rendering

최종 렌더링은 다음 브라우저 API를 사용합니다.

```text
Canvas
  ↓ captureStream(30fps)
Video MediaStream

Web Audio
  ↓ MediaStreamDestination
Audio MediaStream

Video + Audio
  ↓ MediaRecorder
WebM
```

서버로 영상을 업로드하지 않습니다.

## Architecture

```text
GitHub Pages
├── UI / Timeline / Canvas renderer
├── URL Capture Client
│   └── Microlink Screenshot API
├── Local Persistence
│   ├── LocalStorage: project metadata / templates
│   └── IndexedDB: uploaded images / video / audio
├── Web Audio: built-in soundtrack synthesis
└── MediaRecorder: WebM export
```

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript ES Modules
- Canvas 2D
- Web Audio API
- MediaRecorder
- getDisplayMedia
- IndexedDB
- LocalStorage
- GitHub Pages
- GitHub Actions

외부 UI framework와 npm dependency를 사용하지 않습니다.

## Project Structure

```text
/
├── index.html
├── 404.html
├── favicon.svg
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── icon-192.png
├── icon-512.png
├── og-image.png
├── repo-social-preview.png
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
├── .nojekyll
│
├── assets/
│   ├── styles.css
│   ├── app.js
│   ├── templates.js
│   └── audio.js
│
├── scripts/
│   └── verify.mjs
│
├── .github/workflows/
│   └── deploy.yml
│
├── START-HERE.md
├── README.md
└── LICENSE
```

## Local Development

별도 설치 과정이 없습니다.

```bash
python -m http.server 8080
```

브라우저에서:

```text
http://localhost:8080/
```

Node.js가 있다면 검증:

```bash
node scripts/verify.mjs
node --check assets/app.js
node --check assets/templates.js
node --check assets/audio.js
```

## GitHub Pages Deployment

1. 새 GitHub Repository 생성
2. 프로젝트 내용을 Repository 루트에 업로드
3. `Settings → Pages`
4. Source를 `GitHub Actions`로 선택
5. `main`에 push

`.github/workflows/deploy.yml`이 자동 배포합니다.

Repository가 `motionframe-studio`라면:

```text
https://USERNAME.github.io/motionframe-studio/
```

처럼 동작합니다.

Actions에서 실제 Repository 이름으로 `__SITE_URL__`을 치환하므로 canonical, Open Graph, sitemap도 Pages 하위 경로를 반영합니다.

## URL Capture / API Key Policy

기본 캡처는 API key가 없는 Microlink 공개 endpoint를 사용합니다. 이는 작은 개인 프로젝트나 시험용으로 바로 사용할 수 있습니다.

트래픽이 증가해 유료 API key가 필요해지면 key를 다음 위치에 넣지 마세요.

```text
❌ assets/app.js
❌ index.html
❌ Public Repository Secret 문자열
```

GitHub Pages JavaScript는 누구나 읽을 수 있기 때문입니다.

대신 다음 구조를 권장합니다.

```text
GitHub Pages
    ↓
Small Serverless Proxy
    ↓ secret header
Microlink API
```

이 Proxy는 DB가 필요하지 않으며 URL 검증, rate limit, API key 보호만 담당하면 됩니다.

## Limitations

정적 GitHub Pages만으로는 다른 웹사이트의 로그인 세션을 가져오거나 임의 DOM을 직접 클릭할 수 없습니다. 따라서:

- 공개 페이지: URL Capture
- 로그인된 웹앱: Screen Recording
- 데스크톱 프로그램: Screen Recording
- 이미 녹화된 데모: Video Import

로 입력 경로를 구분했습니다.

브라우저별 MediaRecorder codec 지원이 다르므로 Chrome/Edge 최신 버전을 우선 권장합니다.

## Custom Domain

GitHub Pages의 `Settings → Pages → Custom domain`에서 도메인을 연결할 수 있습니다. 필요하면 Repository에 `CNAME` 파일을 추가하세요.

Custom domain을 사용하는 경우 OG/canonical URL을 custom domain으로 고정하려면 Actions의 `SITE_URL` 계산 부분을 수정하면 됩니다.

## License

MIT License. 외부 사이트를 캡처하거나 영상으로 제작할 때는 해당 사이트/콘텐츠에 대한 사용 권한과 서비스 약관을 확인하세요.
