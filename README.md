# MotionFrame Studio v3

사이트 URL, 화면 캡처, 이미지, 영상 클립을 장면으로 가져오고 **24개 기본 영상 연출 템플릿**을 적용한 뒤 줌·팬·커서·전환·사운드를 수정하여 WebM으로 내보내는 GitHub Pages용 브라우저 편집기입니다.

## What changed in v3

- 배포된 v2에서 전체 JavaScript 초기화를 막던 URL 목록 정규식 파싱 오류 수정
- ES module 문법을 제대로 검사하도록 배포 검증 강화
- 기본 연출 템플릿 10개 → **24개**
- Website / Product / Cursor / Fast·Social / Calm / Mobile 분류
- 템플릿 검색과 분류별 개수 표시
- 장면 없이 템플릿을 클릭해도 데모 장면으로 바로 적용
- URL 캡처 클릭 즉시 진행 상태 표시
- 여러 URL 부분 성공 지원
- Microlink 캡처 실패 시 WordPress mShots fallback
- Ctrl/⌘ + Enter로 URL 쇼릴 실행
- 앱 초기화 실패를 사용자에게 보여주는 boot watchdog
- v2 LocalStorage 프로젝트/사용자 템플릿 자동 마이그레이션

## Features

### URL → scene

공개 URL을 브라우저 캡처 서비스로 렌더링한 뒤 이미지 장면으로 저장합니다. 한 URL의 full-page 캡처를 여러 카메라 장면으로 재사용할 수 있습니다.

### 24 motion templates

템플릿은 단순한 줌 값 하나가 아니라 장면 수, 장면 길이, 전환, 시작/종료 줌, 포커스 위치, 커서 위치, 화면 비율, 프레임, 기본 사운드를 함께 가진 시퀀스입니다.

### Editable templates

기본 템플릿을 복제해 `내 템플릿`으로 저장하고 현재 편집 상태로 갱신하거나 JSON으로 내보내고 다시 불러올 수 있습니다.

### Image + video sources

PNG/JPG/WebP/GIF 및 MP4/WebM 파일을 장면으로 추가할 수 있으며 브라우저 `getDisplayMedia()`를 이용한 화면 한 장 캡처와 최대 30초 화면 녹화도 지원합니다.

### Sound

Soft Pulse, Air Pad, Focus Grid, Launch Beat 기본 트랙을 Web Audio API로 로컬 생성합니다. 사용자 오디오 파일도 IndexedDB에 저장해 사용할 수 있습니다.

### WebM export

Canvas `captureStream()`과 Web Audio의 `MediaStreamDestination`을 결합하여 영상+오디오 WebM을 브라우저에서 생성합니다.

## Project structure

```text
/
├─ index.html
├─ 404.html
├─ manifest.webmanifest
├─ favicon.svg
├─ icon-192.png
├─ icon-512.png
├─ og-image.png
├─ assets/
│  ├─ app.js
│  ├─ templates.js
│  ├─ audio.js
│  └─ styles.css
├─ scripts/
│  └─ verify.mjs
└─ .github/workflows/deploy.yml
```

## Local verification

Node.js만 있으면 정적 검증을 실행할 수 있습니다.

```bash
node scripts/verify.mjs
```

로컬 미리보기는 임의의 정적 서버를 사용할 수 있습니다.

```bash
python -m http.server 8080
```

## GitHub Pages deployment

1. 파일 전체를 Repository 루트에 push
2. Settings → Pages → Source를 **GitHub Actions**로 설정
3. 포함된 workflow가 검증 → `_site` 준비 → Pages artifact 업로드 → 배포를 수행

프로젝트 저장소가 `USERNAME/REPOSITORY`라면 기본 주소는 다음 형태입니다.

```text
https://USERNAME.github.io/REPOSITORY/
```

workflow가 실제 저장소 이름을 읽어 canonical, Open Graph, sitemap의 `__SITE_URL__`을 자동 치환합니다.

## URL capture architecture

GitHub Pages는 다른 사이트의 DOM을 직접 읽거나 임의로 조작할 수 없으므로 외부 브라우저 캡처 서비스가 필요합니다.

현재 기본 순서:

1. Microlink Screenshot API
2. 실패 시 WordPress mShots
3. 로그인·사내 서비스는 사용자가 승인한 화면 캡처/화면 녹화

외부 캡처 서비스에는 quota, 대상 사이트의 bot protection, 네트워크 정책에 따른 실패 가능성이 있습니다. 앱은 실패를 숨기지 않고 상태 패널에 원인을 표시합니다.

## Persistence

- 프로젝트 메타데이터: LocalStorage
- 이미지/영상/사용자 오디오: IndexedDB
- 사용자 템플릿: LocalStorage
- 프로젝트 전체 백업: JSON + media data URL

서버 DB를 사용하지 않습니다.

## Browser support

최신 Chrome / Edge를 권장합니다. MediaRecorder, Canvas captureStream, IndexedDB, getDisplayMedia 지원 여부에 따라 일부 기능은 제한될 수 있습니다.

## License

프로젝트에 포함된 `LICENSE`를 확인하세요.
