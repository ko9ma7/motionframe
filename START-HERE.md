# MotionFrame Studio v7 — 시작하기

## 1. 기존 GitHub Pages 프로젝트 교체

`motionframe-studio-v7` 폴더 **안쪽의 파일 전체**를 `ko9ma7/motionframe` 저장소 루트에 덮어쓴 뒤 `main`에 push합니다.

GitHub에서 한 번만:

`Settings → Pages → Source → GitHub Actions`

를 선택합니다. 이후 push마다 자동 배포됩니다.

## 2. 이번 버전에서 먼저 볼 곳

배포 후 아래 순서로 확인하세요.

```text
https://ko9ma7.github.io/motionframe/#capture
https://ko9ma7.github.io/motionframe/#director
https://ko9ma7.github.io/motionframe/#studio
```

브라우저에 이전 JS가 남아 있다면 `Ctrl + Shift + R`로 강력 새로고침합니다. v7 asset에는 `?v=7.0.0` 캐시 버전이 붙어 있습니다.

## 3. URL 하나만 넣어 테스트

```text
https://ko9ma7.github.io/motionframe/
```

을 넣고 **Auto Director로 쇼릴 만들기**를 누릅니다.

정상이라면 URL 캡처 후 곧바로 Scene 좌표만 나오는 것이 아니라 먼저 **연출 플로우**가 생성됩니다.

예상 형태:

```text
01 페이지 전체
02 H1 제목
03 제품/주요 콘텐츠
04 URL 캡처 메뉴 클릭
05 #capture 영역으로 이동
06 Auto Director 메뉴 클릭
07 #director 영역으로 이동
08 템플릿 메뉴 클릭
09 #templates 영역으로 이동
10 편집기 메뉴 클릭
11 #studio 영역으로 이동
12 Resolve
```

실제 항목 수는 분석된 DOM에 따라 달라집니다.

## 4. 가장 중요한 편집 방법

Scene의 X/Y 좌표부터 수정하지 마세요.

먼저 **Auto Director · Flow Plan**에서 실제 사이트의 제목/메뉴/버튼을 확인합니다.

각 행에서:

- 무엇을 보여줄지
- 클릭할지
- 같은 페이지의 어느 영역으로 갈지
- 어느 다음 페이지로 갈지
- Punch / Sweep / Track / Page Impact 중 어떤 연출을 쓸지

를 수정합니다.

그 뒤 **플로우를 영상으로 적용**하면 Scene과 카메라 키프레임이 다시 생성됩니다.

## 5. 참고 영상처럼 더 강한 기본 연출

기본 Motion Style은 **Impact Product Flow**입니다.

기본 문법:

```text
Reveal
→ Punch Zoom
→ 확대 상태 Sweep/Scroll Track
→ 카메라 정착
→ Cursor Click
→ Page Impact
→ 다음 페이지 Punch
→ Resolve
```

템플릿은 이 움직임의 톤만 바꾸고, 사이트 요소와 링크 순서는 Flow Plan이 관리합니다.

## 6. 같은 페이지 메뉴

`#capture`, `#director`, `#templates`, `#studio` 같은 메뉴는 더 이상 버리지 않습니다.

메뉴의 실제 위치에서 클릭한 뒤 목적지 anchor의 실제 Y 위치로 카메라가 추적하도록 기본 Flow가 생성됩니다.

## 7. 사운드

사운드 카드의 ▶ 버튼으로 바로 미리 들을 수 있습니다. 기본 BGM 또는 MP3/WAV/OGG를 선택하면 최종 WebM 오디오 트랙에 포함됩니다.

## 8. WebM 확인

v7에서는 `canvas.captureStream(30)` 연속 스트림을 사용합니다. 이전 샘플처럼 30fps라고 표시되지만 실제 비디오 프레임이 매우 적게 기록되는 문제를 피하기 위한 수정입니다.

내보낸 파일을 재생해 다음을 확인하세요.

- 전체 영상 시간 동안 영상이 계속 움직이는지
- 오디오만 뒤에 남지 않는지
- same-page Track이 실제로 긴 페이지를 이동하는지
- 메뉴에서 커서가 정착 후 클릭하는지

## 9. 프로젝트 초기화 관련

기존 v5/v6 프로젝트 상태는 읽을 수 있지만, 이전 버전에서 이미 생성된 Scene은 옛 카메라 값이 남아 있을 수 있습니다.

v7 품질을 보려면 기존 URL을 다시 넣고 Auto Director를 실행하거나 테스트 프로젝트를 초기화한 뒤 새로 생성하는 것을 권장합니다.
