# MotionFrame Studio v4

MotionFrame Studio는 **사이트 URL / 화면 녹화 / 이미지 / 영상 클립을 가져와 모션 경로와 사운드를 적용하고 WebM으로 내보내는 GitHub Pages용 브라우저 편집기**입니다.

별도 서버나 데이터베이스 없이 정적 파일로 배포됩니다. 프로젝트와 미디어는 사용자의 브라우저(LocalStorage + IndexedDB)에 저장합니다.

## v4 핵심 변경

- 템플릿 24개를 세로 카드 그리드 대신 **약 200px 높이의 가로 스크롤 라이브러리**로 축소
- URL 캡처 시 스크린샷과 함께 **페이지 제목, h1/h2/h3, CTA/버튼, 내비게이션 텍스트**를 구조화해서 읽도록 개선
- 분석된 텍스트를 `페이지 제목 → 주요 제목 → 기능 섹션 → CTA → 전체 화면` 흐름으로 자동 장면화
- 구조 분석을 사용할 수 없는 URL은 자동으로 캡처 기반 시퀀스로 fallback
- 숫자 X/Y 입력 대신 미리보기 화면에서 **직선 / 곡선 / 자유선 모션 패스**를 직접 그리는 편집기 추가
- 기존 X/Y 슬라이더는 고급 설정으로 이동
- 기본 사운드를 단순 알림음 계열에서 **앰비언트 / 소프트 코퍼레이트 / 로파이 / 미니멀 키 / 글래스 신스 / 드라이브 계열**로 재구성
- 각 기본 사운드에 즉시 **미리듣기** 버튼 제공
- 선택한 사운드 또는 사용자 MP3/WAV/OGG를 Web Audio → MediaStream으로 합쳐 **최종 WebM에 실제 오디오 트랙으로 기록**
- v3 프로젝트/사용자 템플릿을 v4에서 읽을 수 있도록 마이그레이션

## URL → 구조 기반 영상 흐름

공개 URL은 Microlink의 브라우저 렌더링을 사용해 다음 데이터를 한 번에 요청합니다.

- screenshot
- page title
- `h1`, `h2`, `h3`
- `button`, `[role="button"]`, CTA 성격의 링크 텍스트
- `nav a` 텍스트

구조 데이터가 있으면 장면 이름도 실제 페이지 문구를 사용합니다. 예를 들어 페이지에서 다음이 읽혔다면:

```text
Acme Automation
Work faster
Automate reports
Connect your tools
Start free
```

기본 시퀀스 역시 같은 순서로 생성됩니다. CTA 장면에는 커서 이동/클릭 연출을 자동 활성화합니다.

> GitHub Pages에서 다른 사이트의 DOM을 직접 읽는 것은 브라우저 CORS/Same-Origin 정책 때문에 불가능합니다. 그래서 공개 URL 분석은 외부 브라우저 캡처/구조화 API를 사용합니다. 로그인된 SaaS, 사내 서비스, 데스크톱 프로그램은 `화면 녹화 클립`을 사용하는 편이 안정적입니다.

현재 초기 포커스 좌표는 추출된 DOM 요소의 **순서와 종류를 기반으로 자동 배치**합니다. 대상 요소의 실제 픽셀 bounding box까지 얻는 서버 워커는 사용하지 않으므로, 정밀한 카메라 이동은 v4의 시각적 모션 패스 편집기에서 바로 보정할 수 있습니다.

## Visual Motion Path

편집기 미리보기 위에서 카메라 경로를 직접 만듭니다.

- **직선**: 시작점과 끝점을 두 번 클릭
- **곡선**: 원하는 지점을 여러 번 클릭한 뒤 `경로 완료`
- **자유선**: 누른 채 드래그해서 원하는 궤적 그리기
- **초기화**: 커스텀 경로 제거

모션 패스는 카메라 포커스 이동에 사용되며, 커서 추적이 활성화된 장면에서는 커서도 같은 경로를 따라갑니다. 기존 Start X/Y, End X/Y 값은 `고급 좌표 설정`에서 계속 사용할 수 있습니다.

## Sound

내장 사운드는 외부 음원 파일을 포함하지 않고 Web Audio API로 브라우저에서 생성합니다.

기본 제공:

- Ambient Flow
- Soft Corporate
- Lo-fi Product
- Minimal Keys
- Glass Motion
- Focus Drive
- Launch Drive

사운드 카드의 `▶`를 누르면 즉시 약 6초간 미리듣습니다. 사용자의 MP3/WAV/OGG를 업로드할 수도 있습니다.

내보낼 때는 Canvas의 video track과 Web Audio `MediaStreamDestination`의 audio track을 하나의 `MediaStream`으로 합친 뒤 `MediaRecorder`로 WebM을 생성합니다. 따라서 `사운드 없음`이 아닌 경우 선택한 트랙이 영상에 포함됩니다.

## 24 built-in motion templates

Website / Product / Cursor / Fast·Social / Calm / Mobile 계열 24개가 포함되어 있습니다. 템플릿은 장면 수, 길이, 줌, 포커스, 전환, 커서, 화면 비율, 기본 사운드를 묶은 프로젝트 시퀀스입니다.

템플릿 영역은 페이지를 크게 점유하지 않도록 한 줄 가로 라이브러리로 표시합니다. 검색과 카테고리 필터를 사용할 수 있고, 편집 결과를 `내 템플릿`으로 저장하거나 JSON으로 백업/복원할 수 있습니다.

## Other inputs

URL 외에도 다음 소스를 같은 타임라인에 추가할 수 있습니다.

- PNG / JPG / WebP / GIF
- MP4 / WebM
- 사용자가 승인한 현재 화면 캡처
- 최대 30초 화면 녹화 클립

## WebM export

- 16:9 / 9:16 / 1:1
- 720p / 1080p
- 30fps Canvas capture
- VP9/Opus → VP8/Opus → browser WebM 순으로 지원 codec 선택
- 내장 또는 사용자 오디오 mux
- fade in/out 및 볼륨 적용

Chrome / Edge 최신 버전을 권장합니다.

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
│  ├─ templates.js
│  ├─ audio.js
│  └─ styles.css
├─ scripts/
│  └─ verify.mjs
└─ .github/workflows/deploy.yml
```

## Verification

Node.js만 있으면 dependency 설치 없이 검사할 수 있습니다.

```bash
node scripts/verify.mjs
```

이 검사는 ES module 문법, 필수 파일, 템플릿/모션 데이터, DOM 참조, URL 구조 분석, 모션 패스, 오디오 미리듣기 및 WebM 오디오 mux 코드 경로 등을 확인합니다.

로컬 미리보기는 임의의 정적 서버로 실행할 수 있습니다.

```bash
python -m http.server 8080
```

## GitHub Pages deployment

1. 이 프로젝트의 파일 전체를 Repository 루트에 push합니다.
2. GitHub Repository → **Settings → Pages**로 이동합니다.
3. Source를 **GitHub Actions**로 지정합니다.
4. 포함된 `Deploy MotionFrame Studio to GitHub Pages` workflow가 검증 → `_site` 생성 → artifact 업로드 → 배포를 수행합니다.

`USERNAME/REPOSITORY` 저장소라면 기본 주소는 다음과 같습니다.

```text
https://USERNAME.github.io/REPOSITORY/
```

Workflow가 저장소 이름을 이용해 `__SITE_URL__`을 실제 canonical / Open Graph / sitemap URL로 치환합니다.

## Persistence

- 프로젝트 메타데이터: LocalStorage
- 이미지 / 영상 / 사용자 오디오: IndexedDB
- 사용자 템플릿: LocalStorage
- 전체 프로젝트 백업: JSON + media data URL

서버 DB는 사용하지 않습니다.

## Limitations

- 공개 URL 캡처/DOM 구조 분석은 외부 서비스 quota, 대상 사이트 bot protection, CORS 및 네트워크 상태의 영향을 받을 수 있습니다.
- 로그인 세션을 정적 GitHub Pages에서 제3자 캡처 서비스에 안전하게 전달하지 않습니다. 로그인된 화면은 화면 녹화 방식을 사용하세요.
- DOM 요소의 정확한 화면 bounding box를 자동 추적하려면 별도의 브라우저 자동화 워커(Playwright/Puppeteer 계열)가 필요합니다. v4 정적 버전은 구조 순서 기반 초기 위치 + 시각적 패스 보정을 사용합니다.
- Safari 등 일부 브라우저는 MediaRecorder/WebM codec 지원 차이로 기능이 제한될 수 있습니다.

## Security

API secret, access token, private credential은 정적 프론트엔드 코드에 넣지 마세요. 유료/인증형 캡처 API 키가 필요해지는 경우 캡처 요청만 Serverless Proxy로 분리하는 것이 안전합니다.

## License

프로젝트에 포함된 `LICENSE`를 확인하세요.
