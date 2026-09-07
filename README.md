# MotionFrame Studio v7

URL을 넣으면 사이트의 화면과 DOM 구조를 읽고, **사람이 읽을 수 있는 Flow Plan**을 먼저 만든 다음 이를 카메라·커서·페이지 전환 장면으로 자동 변환하는 GitHub Pages용 정적 웹앱입니다.

v7에서 가장 중요한 변화는 `Scene 좌표 편집기`가 출발점이 아니라는 점입니다.

```text
URL
↓
렌더링된 페이지 캡처 + DOM 위치/링크 분석
↓
Flow Plan
  - 페이지 전체 공개
  - H1 집중
  - 제품/기능 추적
  - 메뉴 클릭
  - #anchor 영역으로 이동
  - 다음 URL로 이동
  - CTA 클릭
  - Resolve
↓
Impact Motion Engine
↓
Scene / Camera Keyframes / Cursor
↓
Sound + WebM
```

## Flow Plan

Auto Director는 사이트에서 발견한 다음 요소를 실제 이름으로 표시합니다.

- H1/H2/H3 제목
- Navigation 메뉴
- Button / CTA
- 일반 링크
- 제품 이미지 / 영상 / mockup 후보
- `href`와 목적지
- 렌더링된 요소의 화면 좌표
- 같은 페이지의 `#anchor` 목적지 좌표

예를 들어 MotionFrame 자체를 분석하면 다음과 같은 흐름을 만들 수 있습니다.

```text
01 MotionFrame 전체                     Reveal
02 사이트를 넣고 연출을 고르고…          Punch Zoom
03 제품 Preview                          Sweep
04 URL 캡처                              Cursor Click
05 #capture 영역                         Scroll Track
06 Auto Director                         Cursor Click
07 #director 영역                        Scroll Track
08 템플릿                                Cursor Click
09 #templates 영역                       Scroll Track
10 편집기                                Cursor Click
11 #studio 영역                          Scroll Track
12 마무리                                Resolve
```

각 Flow 행에서 사용자가 직접 바꿀 수 있습니다.

- 동작: 집중 / 확대 유지·추적 / 클릭 / 같은 페이지 이동 / 다음 페이지 이동
- 연출: Reveal / Punch Zoom / Sweep / Scroll Track / Cursor Impact / Page Impact / Resolve
- 다음 페이지 목적지
- 순서 위/아래 이동
- 제외

오른쪽의 **사이트에서 찾은 요소** 목록에서 빠진 제목이나 버튼을 `+`로 Flow에 추가할 수 있습니다. Flow Plan과 링크별 설정은 프로젝트 상태에 저장됩니다.

## Same-page navigation

`https://example.com/#features`처럼 같은 문서의 해시 링크도 페이지 이동의 한 종류로 취급합니다.

DOM 분석 단계에서 메뉴의 `href="#features"`와 실제 `#features` 요소의 Y 좌표를 같이 읽고:

```text
메뉴 위치로 카메라 정착
→ 커서 이동
→ 클릭
→ 확대 상태를 유지한 Scroll Track
→ 실제 #features 영역에서 정착
```

으로 자동 분해합니다.

## Cross-page navigation

입력 URL이 여러 개이거나 내부 핵심 링크 자동 분석이 켜져 있을 경우 실제 `href`를 캡처한 다음 페이지 URL과 매칭합니다.

```text
Home
→ Features 메뉴 클릭
→ Features 페이지 Page Impact
→ Features H1
→ Pricing 메뉴 클릭
→ Pricing 페이지
→ CTA
```

URL 하나만 넣어도 같은 origin의 제품/기능/가격/데모 계열 링크를 우선해 최대 3페이지까지 연쇄적으로 분석합니다.

## Impact Motion Engine

기본 `Impact Product Flow`는 참고 영상처럼 한 장면씩 정적으로 자르는 대신 **연속 카메라**로 느껴지도록 설계했습니다.

- `Reveal`: 조금 가까운 상태에서 전체 구도로 빠르게 정착
- `Punch Zoom`: 빠른 줌 오버슈트 후 정착
- `Sweep`: 좌우/대각선 아크를 그리며 다음 콘텐츠로 이동
- `Scroll Track`: 확대 상태를 유지하며 긴 페이지를 따라감
- `Cursor Impact`: 카메라 정착 → 커서 이동 → 클릭 펄스
- `Page Impact`: 이전 페이지가 물러나고 다음 페이지가 앞으로 들어오는 전환
- `Resolve`: 마지막에 전체 구도로 정리

장면마다 단순 선형 start/end 값 대신 `cameraKeyframes`를 사용합니다. 같은 페이지 내부에서는 Crossfade를 쓰지 않아 글자가 이중으로 겹치는 현상을 줄였습니다.

## Visual motion path

자동값이 마음에 들지 않는 경우 Scene Inspector에서 좌표를 숫자로 계산할 필요가 없습니다.

- 직선: 시작과 끝 클릭
- 곡선: 여러 경유점 클릭
- 자유선: 미리보기 위에서 드래그

사용자가 직접 경로를 그리면 해당 Scene의 자동 카메라 키프레임을 해제하고 수동 경로를 우선합니다.

## Sound

기본 사운드는 브라우저에서 생성되는 BGM이며 각 카드에서 바로 미리들을 수 있습니다.

- Ambient Flow
- Soft Corporate
- Lo-fi Product
- Minimal Keys
- Glass Motion
- Focus Drive
- Launch Drive

MP3/WAV/OGG 업로드도 지원합니다. 최종 WebM에서는 Canvas 영상 스트림과 Web Audio 스트림을 하나의 MediaStream으로 합칩니다. 클릭 및 페이지 전환 시 작은 accent sound도 기본 BGM에 섞입니다.

## WebM export fix in v7

이전 출력 샘플을 검사했을 때 30fps 영상임에도 실제 기록된 비디오 프레임이 43개뿐인 문제가 있었습니다. 수동 `requestFrame()` 경로를 제거하고 v7에서는:

```js
canvas.captureStream(30)
```

의 연속 비디오 스트림을 유지한 채 카메라 타임라인을 wall-clock에 맞춰 렌더링합니다. 따라서 느린 렌더링 때문에 대부분의 모션 프레임이 파일에서 누락되는 문제를 피합니다.

## Templates

24개 내장 템플릿을 유지하지만 템플릿의 책임은 **무엇을 보여줄지 결정하는 것**이 아닙니다.

- Auto Director / Flow Plan: 콘텐츠와 클릭 경로 결정
- Motion Template: 카메라 톤, 속도, 프레임, 사운드 결정

기본값은 `Impact Product Flow`입니다.

## Data / privacy

- 프로젝트 설정: LocalStorage
- 이미지·영상·사용자 오디오: IndexedDB
- URL 캡처: 외부 공개 페이지 캡처 서비스 사용
- 별도 DB 없음
- Secret을 프론트엔드에 저장하지 않음

로그인된 SaaS 또는 데스크톱 앱은 URL 캡처 대신 화면 녹화 클립을 소스로 사용할 수 있습니다.

## Project structure

```text
/
├─ index.html
├─ 404.html
├─ manifest.webmanifest
├─ favicon.svg
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

## Verify

```bash
node scripts/verify.mjs
```

검사는 ES module 문법, 필수 asset, 20개 이상 템플릿, Flow Plan, same-page anchor, cross-page route, camera keyframe impact, cursor projection, 오디오/WebM mux, **연속 30fps captureStream**, GitHub Pages workflow 등을 확인합니다.

## GitHub Pages

저장소 루트에 전체 파일을 올리고 GitHub에서:

`Settings → Pages → Source → GitHub Actions`

를 선택합니다. `main` push 시 `.github/workflows/deploy.yml`이 검증 후 `_site` artifact를 만들고 Pages에 배포합니다.

저장소가 `ko9ma7/motionframe`이면 기본 주소는:

```text
https://ko9ma7.github.io/motionframe/
```

입니다.

## License

MIT License. 자세한 내용은 `LICENSE`를 확인하세요.
