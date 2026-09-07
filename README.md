# MotionFrame Studio v5

MotionFrame Studio는 **사이트 URL을 분석해 어떤 부분을 어떤 순서로 보여줄지 먼저 판단하고, 메뉴/버튼 클릭을 다음 페이지와 연결한 기본 영상 스토리보드를 자동 생성한 뒤, 모션·사운드를 편집해 WebM으로 내보내는 GitHub Pages용 브라우저 편집기**입니다.

별도 애플리케이션 서버나 DB 없이 정적 GitHub Pages로 배포됩니다. 프로젝트와 미디어는 사용자의 브라우저(LocalStorage + IndexedDB)에 저장합니다.

## v5 핵심: Auto Director

v5부터 템플릿은 더 이상 “무엇을 보여줄지”를 임의로 결정하지 않습니다.

처리 순서는 다음과 같습니다.

```text
URL 입력
  ↓
실제 페이지 렌더링 + 전체 화면 캡처
  ↓
DOM 위치/역할/링크 분석
  ↓
Auto Director
  ├─ 브랜드/로고
  ├─ H1 히어로
  ├─ H2/H3 핵심 섹션
  ├─ 메뉴/링크
  └─ CTA/버튼
  ↓
페이지 간 href 연결
  ↓
기본 스토리보드 생성
  ↓
모션 스타일 + 사운드 적용
  ↓
사용자 수정
  ↓
WebM
```

### 기본 연출 규칙

페이지가 여러 개 연결되어 있으면 기본값은 아래처럼 생성됩니다.

```text
홈 전체 화면
→ 로고/브랜드
→ H1 제목
→ 주요 H2/H3 기능 영역
→ 다음 URL로 연결된 메뉴/버튼 위치로 이동
→ 커서가 메뉴/버튼으로 이동
→ 클릭 효과
→ 다음 페이지 전체 화면
→ 다음 페이지 H1
→ 주요 기능 섹션
→ 다음 메뉴/버튼 클릭
→ 마지막 페이지 CTA 클릭
→ 전체 줌아웃
```

예를 들어 다음 URL을 넣었다면:

```text
https://example.com/
https://example.com/features
https://example.com/pricing
```

홈 페이지의 `Features` 링크 href가 `/features`라면 Auto Director가 그 요소를 자동으로 **다음 페이지 이동**으로 지정합니다. Features 페이지의 `Pricing` 링크가 `/pricing`이라면 같은 방식으로 다음 장면과 연결합니다.

## 실제 DOM 좌표 사용

v5는 제목과 버튼의 순서만 보고 위치를 추측하지 않습니다.

Microlink의 브라우저 함수에서 실제 렌더링된 페이지의 다음 정보를 수집하도록 구성되어 있습니다.

- `getBoundingClientRect()` 기반 요소 위치/크기
- 전체 document width / height
- viewport width / height
- `h1`, `h2`, `h3`
- `header a`, `nav a`
- `button`, `[role="button"]`
- 일반 `a[href]`
- logo/brand 후보
- 링크 `href`

전체 페이지 캡처에서는 DOM의 실제 document 좌표를 0~100% 카메라 좌표로 변환해 포커스 위치를 만듭니다.

따라서 제목이 좌상단에 있으면 그 위치로 카메라가 이동하고, CTA가 화면 아래쪽에 있으면 해당 위치로 이동하도록 초기값이 생성됩니다.

> 공개 사이트의 DOM은 GitHub Pages 브라우저에서 직접 읽을 수 없으므로 외부 브라우저 렌더링 서비스가 필요합니다. 현재 구현은 Microlink를 사용합니다. 로그인 세션이 필요한 SaaS/사내 프로그램은 화면 녹화 또는 미디어 업로드 경로를 사용합니다.

## 링크별 연출 지정

`Auto Director` 영역에서 각 페이지마다 감지된 요소를 열어 개별적으로 설정할 수 있습니다.

각 요소의 기본 행동은 다음 중 하나입니다.

- **포커스**: 그 위치로 카메라 이동/줌
- **클릭**: 커서 이동 + 클릭 연출, 현재 페이지 유지
- **다음 페이지 이동**: 커서 이동 + 클릭 → 지정한 캡처 페이지로 전환
- **제외**: 영상에서 사용하지 않음

`다음 페이지 이동`을 선택하면 대상 페이지를 직접 고를 수 있습니다. 한 페이지의 선형 영상 흐름에서 실제 outgoing navigation은 하나를 기본으로 하며, 다른 메뉴/버튼은 포커스 또는 클릭으로 남길 수 있습니다.

설정을 바꾼 뒤 **이 흐름으로 편집**을 누르면 타임라인이 다시 생성됩니다. Auto Director 설정 자체도 프로젝트 상태와 함께 저장됩니다.

## URL 한 개만 넣었을 때

`내부 핵심 링크 자동 분석`이 켜져 있으면 첫 페이지의 실제 내부 링크 중 기능/제품/솔루션/CTA 성격의 링크를 점수화해 최대 2개 페이지를 추가 분석합니다.

즉 URL 하나만 넣어도 가능한 경우:

```text
Home
→ Features
→ Pricing / Demo
```

같은 기본 제품 소개 흐름을 자동으로 구성합니다.

자동 선택이 마음에 들지 않으면 URL을 직접 여러 줄로 입력하거나 Auto Director의 링크별 동작을 수정하면 됩니다.

## 모션 스타일 템플릿 24개

24개 기본 템플릿은 **Auto Director가 만든 의미 구조를 유지한 채 속도, 카메라 성격, 전환, 커서 느낌, 화면 비율, 기본 사운드를 바꾸는 스타일 레이어**입니다.

Website / Product / Cursor / Fast·Social / Calm / Mobile 계열이 포함되어 있습니다.

Auto Director 계획이 없는 수동 이미지/영상 프로젝트에서는 기존처럼 템플릿 자체의 장면 시퀀스를 사용할 수 있습니다.

템플릿은 세로 공간을 크게 차지하지 않도록 약 200px 높이의 가로 라이브러리로 제공되며 검색과 분류 필터를 지원합니다.

## Visual Motion Path

자동 좌표를 그대로 써도 되지만, 원하는 경우 미리보기 화면 위에서 직접 카메라 경로를 수정할 수 있습니다.

- **직선**: 시작점/끝점 클릭
- **곡선**: 여러 경유점 클릭 후 완료
- **자유선**: 마우스/펜으로 드래그
- **초기화**: 커스텀 경로 제거

커서 추적이 활성화된 클릭/내비게이션 장면에서는 커서 역시 지정된 이동 패스를 따라갑니다.

## Sound

기본 사운드는 Web Audio API로 합성되며 각 카드에서 즉시 미리듣기할 수 있습니다.

- Ambient Flow
- Soft Corporate
- Lo-fi Product
- Minimal Keys
- Glass Motion
- Focus Drive
- Launch Drive

MP3 / WAV / OGG 사용자 음원도 추가할 수 있습니다.

WebM 내보내기에서는 Canvas의 video track과 Web Audio `MediaStreamDestination`의 audio track을 같은 `MediaStream`에 넣어 `MediaRecorder`로 기록합니다. 따라서 `사운드 없음`을 선택하지 않았다면 선택한 오디오가 최종 WebM 스트림에 포함됩니다.

## Other inputs

URL 외에도 같은 타임라인에 다음을 넣을 수 있습니다.

- PNG / JPG / WebP / GIF
- MP4 / WebM
- 사용자가 승인한 현재 화면 캡처
- 화면 녹화 클립

로그인된 웹앱이나 데스크톱 프로그램처럼 외부 URL 캡처 서비스가 접근할 수 없는 화면은 이 방법이 적합합니다.

## WebM export

- 16:9 / 9:16 / 1:1
- 720p / 1080p
- 30fps Canvas capture
- VP9/Opus → VP8/Opus → browser WebM 순으로 codec 선택
- 내장 또는 사용자 오디오 mux
- fade in/out / 볼륨

Chrome 또는 Edge 최신 버전을 권장합니다.

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
│  ├─ app.js          # UI / capture / editor / export
│  ├─ director.js     # page understanding + link graph + storyboard
│  ├─ templates.js    # 24 motion styles + presets
│  ├─ audio.js        # procedural audio
│  └─ styles.css
├─ scripts/
│  └─ verify.mjs
└─ .github/workflows/deploy.yml
```

## Verification

Dependency 설치 없이 Node.js로 검사할 수 있습니다.

```bash
node scripts/verify.mjs
```

검사는 다음을 포함합니다.

- 4개 ES module 문법 검사
- 필수 파일 검사
- 24개 템플릿 / 모션 프리셋 무결성
- HTML ↔ JavaScript DOM ID 참조 검사
- DOM geometry 캡처 코드
- 내부 링크 자동 추적
- URL href → 다음 page 연결
- 페이지별/요소별 행동 편집
- synthetic Home → Features 내비게이션 storyboard 테스트
- 모션 패스
- 오디오 미리듣기/오디오 mux
- GitHub Pages workflow

## GitHub Pages deployment

1. 프로젝트 파일 전체를 Repository 루트에 push합니다.
2. GitHub Repository → **Settings → Pages**.
3. Source를 **GitHub Actions**로 지정합니다.
4. 포함된 workflow가 검증 → `_site` 생성 → URL 치환 → artifact 업로드 → 배포를 수행합니다.

`ko9ma7/motionframe`의 기본 URL은:

```text
https://ko9ma7.github.io/motionframe/
```

## Persistence

- 프로젝트/Auto Director 계획: LocalStorage
- 이미지 / 영상 / 사용자 오디오: IndexedDB
- 사용자 템플릿: LocalStorage
- 전체 프로젝트 백업: JSON + media data URL

## 현재 한계

- 공개 URL 분석은 Microlink 사용량, 대상 사이트의 bot protection, 네트워크 정책 영향을 받습니다.
- 로그인 세션/사설 URL을 외부 캡처 서비스에 전달하지 않습니다.
- 한 페이지에서 실제 사용자 클릭으로 JavaScript 상태가 바뀌는 복잡한 SPA 흐름까지 자동 탐색하는 것은 현재 정적 버전 범위가 아닙니다. 현재는 **URL/링크 관계가 있는 페이지 이동**을 자동 연출합니다.
- 사이트 규모가 커져 모든 메뉴 분기를 자동 크롤링하려면 별도 Playwright/Puppeteer worker가 더 적합합니다.
- Safari는 MediaRecorder/WebM codec 지원 차이가 있을 수 있습니다.

## Security

API secret, access token, private credential은 정적 프론트엔드에 넣지 않습니다. 향후 Microlink 유료 키 또는 전용 브라우저 워커를 사용한다면 캡처 요청만 Serverless Proxy로 분리하세요.

## License

프로젝트의 `LICENSE`를 확인하세요.
