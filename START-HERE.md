# MotionFrame Studio v6 — `ko9ma7/motionframe` 배포

이번 v6는 첨부된 실제 출력 영상을 기준으로 카메라와 장면 연출 엔진을 다시 수정한 버전입니다.

## 1. 기존 저장소 교체

1. `motionframe-studio-v6` 폴더 **안쪽 파일 전체**를 `ko9ma7/motionframe` 저장소 루트에 덮어씁니다.
2. commit / push 합니다.
3. GitHub → Repository → **Actions**에서 `Deploy MotionFrame Studio to GitHub Pages`가 성공했는지 확인합니다.
4. **Settings → Pages → Source**가 `GitHub Actions`인지 확인합니다.
5. 다음 주소를 엽니다.

```text
https://ko9ma7.github.io/motionframe/
https://ko9ma7.github.io/motionframe/#capture
https://ko9ma7.github.io/motionframe/#director
https://ko9ma7.github.io/motionframe/#templates
https://ko9ma7.github.io/motionframe/#studio
```

CSS/JavaScript는 `?v=6.0.0`으로 분리되어 이전 캐시와 충돌하지 않습니다.

## 2. v6 품질을 확인하려면 기존 URL을 다시 분석하세요

브라우저에 v5 프로젝트가 남아 있으면 이전 장면 설정도 함께 남아 있을 수 있습니다.

배포 후에는 다음 둘 중 하나를 권장합니다.

```text
A. 같은 URL을 다시 입력 → Auto Director로 쇼릴 만들기
B. 초기화 → URL 다시 입력
```

새로 만들어진 장면부터 v6의 Safe Framing / Cinematic Timing이 적용됩니다.

## 3. 기본적으로 기대해야 하는 결과

예를 들어 Home → Features → Pricing을 분석했다면 표준 모드의 기본 흐름은 다음과 비슷해야 합니다.

```text
Home 전체 Establish
→ Home H1에 부드럽게 도착
→ 잠시 정착
→ 제품 UI가 있으면 Product Focus
→ 핵심 기능
→ Features 메뉴로 카메라 이동
→ 커서가 Features에 도착
→ Click
→ Features 페이지 Page Flow
→ Features Hero
→ 제품/핵심 기능
→ Pricing 메뉴 Click
→ Pricing 페이지
→ CTA Click
→ 전체 Resolve
```

중요한 차이:

- 한 샷 전체 시간 동안 계속 움직이지 않습니다.
- 제목이 좌측에 있으면 왼쪽이 잘리지 않도록 프레이밍합니다.
- 같은 스크린샷끼리는 기본 Crossfade를 하지 않습니다.
- 실제 페이지 이동에서만 Page Flow 전환을 사용합니다.
- Click 전에 카메라가 먼저 정착합니다.
- 커서는 현재 crop/zoom을 계산한 실제 버튼 좌표로 이동합니다.

## 4. 링크마다 동작 수정

Auto Director에서 요소별로:

```text
설명 · 줌인
클릭 연출
클릭 → 페이지 이동
사용 안 함
```

을 선택할 수 있습니다.

링크를 바꾼 뒤 `이 흐름으로 편집`을 누르면 Director 장면을 교체해 다시 생성합니다.

## 5. 모션 템플릿은 마지막에 선택

권장 순서:

```text
URL 분석
→ Auto Director 흐름 확인
→ 불필요한 메뉴 제외 / 이동 페이지 수정
→ 이 흐름으로 편집
→ 모션 스타일 선택
→ 필요한 장면만 Motion Path 수정
→ 사운드 미리듣기
→ WebM 출력
```

템플릿은 “무엇을 보여줄지”를 다시 뒤섞지 않고 연출 성격만 바꿉니다.

## 6. 사운드

각 기본 사운드의 ▶ 버튼으로 먼저 들어볼 수 있습니다.

v6 내장 BGM에는 클릭 및 페이지 전환에 작은 sound accent도 자동으로 들어갑니다. 사용자가 올린 MP3/WAV/OGG도 사용할 수 있습니다.

## 7. WebM

v6는 가능한 브라우저에서 30fps cadence로 프레임을 수동 요청하되 wall-clock 타임라인을 기준으로 진행합니다. 느린 장치에서는 뒤처진 프레임을 따라잡아 영상 시간과 오디오 시간이 따로 늘어나는 현상을 줄입니다.

Chrome / Edge 최신 버전을 권장합니다.

## 8. 배포 전 검증

GitHub Actions에서도 아래 명령을 먼저 실행합니다.

```bash
node scripts/verify.mjs
```

검증 실패 시 Pages 배포가 중단됩니다.
