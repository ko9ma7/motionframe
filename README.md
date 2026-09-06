# MotionFrame

스크린샷이나 사용자가 직접 공유한 화면을 장면으로 만들고, 줌·팬·커서 이동을 연출해 **브라우저에서 바로 WebM 제품 쇼케이스 영상으로 렌더링하는 정적 웹앱**입니다.

GitHub Pages를 최우선 배포 환경으로 설계했으며 별도의 서버, 데이터베이스, npm build가 필요하지 않습니다.

## Preview

첫 실행 시 세 개의 데모 장면이 로드되어 즉시 재생할 수 있습니다. 실제 이미지로 교체하면 장면마다 카메라 줌, 포커스 위치, 커서 이동과 클릭 효과를 조절할 수 있습니다.

## Features

- PNG / JPG / WebP 등 이미지 다중 업로드
- `getDisplayMedia` 기반 사용자 승인 화면 한 장 캡처
- 장면 순서 변경 / 복제 / 삭제
- 장면별 길이 설정
- 중앙 줌인 / 줌아웃 / 좌우 이동 / 상하 이동 / 디테일 포커스 프리셋
- 직접 줌 및 포커스 위치 조절
- 커서 이동 + 클릭 링 연출
- 전체 타임라인 재생 및 seek
- 장면 사이 부드러운 cross-fade
- 1280×720 / 1920×1080 출력
- Canvas + MediaRecorder 기반 WebM 렌더링
- 프로젝트 메타데이터 LocalStorage 자동 저장
- 업로드 이미지 IndexedDB 저장
- 모바일 Navigation
- PWA manifest 및 간단한 offline cache
- favicon / app icon / OG image / GitHub Social Preview
- custom 404
- GitHub Actions 자동 Pages 배포
- 하위 경로 `https://USERNAME.github.io/REPOSITORY/` 대응

## Architecture

```text
Browser
  ├─ Image upload
  ├─ Screen capture permission
  ├─ LocalStorage: scene metadata
  ├─ IndexedDB: uploaded image blobs
  ├─ Canvas 2D: camera / cursor rendering
  └─ MediaRecorder: WebM export

GitHub Pages
  └─ Static HTML / CSS / JavaScript / SVG assets
```

데이터를 외부 서버로 보내지 않습니다. 브라우저 저장 데이터는 사용자의 기기에만 존재합니다.

## Project Structure

```text
/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ assets/
│  ├─ app.js
│  ├─ styles.css
│  └─ demo/
│     ├─ dashboard.svg
│     ├─ detail.svg
│     └─ report.svg
├─ .nojekyll
├─ 404.html
├─ apple-touch-icon.png
├─ favicon.svg
├─ favicon-16x16.png
├─ favicon-32x32.png
├─ icon-192.png
├─ icon-512.png
├─ index.html
├─ manifest.webmanifest
├─ og-image.png
├─ repo-social-preview.png
├─ robots.txt
├─ service-worker.js
├─ sitemap.xml
├─ START-HERE.md
└─ README.md
```

## Local Development

별도 설치가 필요 없습니다. ES Module과 화면 캡처 API 때문에 `file://` 대신 로컬 HTTP 서버 사용을 권장합니다.

Python이 있다면:

```bash
python3 -m http.server 8080
```

이후:

```text
http://localhost:8080/
```

을 엽니다.

## Verification

정적 파일 검사는 Node.js가 있다면 다음 명령으로 실행할 수 있습니다.

```bash
node verify.mjs
```

Node.js가 없어도 서비스 자체는 동작합니다.

## GitHub Pages Deployment

처음이라면 `START-HERE.md`를 그대로 따라가면 됩니다.

요약:

1. 새 GitHub Repository 생성
2. 이 폴더의 전체 파일을 `main`에 push
3. `Settings → Pages → Source → GitHub Actions`
4. Actions의 `Deploy MotionFrame to GitHub Pages` 완료 확인
5. `https://USERNAME.github.io/REPOSITORY/` 접속

Workflow는 Repository 이름을 이용해 실제 `SITE_URL`을 자동 계산하고, 배포 시 canonical / Open Graph / sitemap URL을 채웁니다.

## Custom Domain

GitHub Pages의 Custom domain을 설정한 뒤 Repository의:

`Settings → Secrets and variables → Actions → Variables`

에서 `SITE_URL` 변수를 예를 들어 아래처럼 설정합니다.

```text
https://motion.example.com
```

그러면 다음 배포부터 canonical, Open Graph, sitemap URL에 해당 도메인이 사용됩니다.

`CNAME` 파일은 실제 도메인이 정해졌을 때만 추가하세요.

## Browser Compatibility

가장 완전한 기능은 최신 Chrome 또는 Edge에서 사용할 수 있습니다.

- 이미지 편집: 최신 주요 브라우저
- 화면 캡처: `getDisplayMedia` 지원 및 사용자 권한 필요
- WebM export: `Canvas.captureStream` + `MediaRecorder` + WebM 지원 필요
- Safari는 WebM/MediaRecorder 조합에 따라 내보내기가 제한될 수 있습니다.

앱은 지원 여부를 런타임에 확인하고 제한되는 기능을 안내합니다.

## Security / Privacy

- API key 없음
- 외부 DB 없음
- 업로드 파일을 서버로 전송하지 않음
- 화면 캡처는 브라우저가 제공하는 사용자 선택/권한 UI를 반드시 거침
- 캡처 스트림은 한 장의 프레임을 얻은 직후 종료

## GitHub Pages에서 의도적으로 제외한 기능

URL을 입력하면 서버가 해당 사이트를 자동 탐색하고 클릭하여 영상을 만들어주는 기능은 포함하지 않습니다. 정적 사이트가 임의 외부 페이지 DOM을 조작하거나 무권한으로 캡처하는 것은 브라우저 보안 모델상 불가능합니다.

그 단계가 필요해질 때의 확장 구조는 다음이 적합합니다.

```text
GitHub Pages editor
      ↓ job request
Serverless API / Queue
      ↓
Playwright + Chromium worker
      ↓
Frame / video rendering
      ↓
Object storage
```

초기 MVP에서는 이 백엔드를 두지 않는 것이 더 단순하고 안전합니다.

## Social Preview

- `og-image.png`: 1200×630
- `repo-social-preview.png`: 1280×640

GitHub Repository의 `Settings → General → Social preview`에는 `repo-social-preview.png`를 업로드하면 됩니다.

## License

MIT License. `LICENSE`를 참고하세요.
