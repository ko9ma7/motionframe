# MotionFrame Studio v12

MotionFrame Studio v12는 **컨셉을 먼저 정하고, 소스 유형에 맞는 데이터만 받은 뒤, 분석 결과를 검수하고 추천 초안 3개 중 하나를 골라 편집하는** GitHub Pages용 브라우저 영상 제작 도구입니다.

이번 버전의 핵심은 긴 한 페이지를 계속 아래로 내려가는 구조를 버리고 **6단계 작업 워크스페이스**로 바꾼 것입니다.

```text
1. 컨셉
   ↓
2. 소스
   ↓
3. 분석 검수
   ↓
4. 추천 초안
   ↓
5. Flow
   ↓
6. 편집 · 출력
```

각 단계는 현재 작업에 필요한 UI만 보여줍니다. 고급 템플릿 라이브러리와 세부 캡처 옵션은 기본적으로 접혀 있습니다.

## 17개 세분화 컨셉

### Review / Website
- AI 제품 리뷰
- 클릭 워크스루
- 랜딩 페이지 쇼케이스
- 포트폴리오 / 케이스 스터디

### Product
- 기능 투어
- 온보딩 / 사용법
- UI 인터랙션 데모
- 대시보드 / 데이터 스토리
- 핵심 기능 집중
- 모바일 앱 데모

### Promo / Social
- 런칭 티저
- 업데이트 / 릴리즈
- 숏폼 / 소셜

### Media / Showcase
- 이미지 스토리
- 영상 하이라이트
- 프리미엄 시네마틱

### Compare
- 비포 / 애프터

각 컨셉은 권장 소스, 권장 길이, 화면 비율, 분석할 역할, 페이지/미디어당 비트 수, 기본 자동 기능, 추천 초안 3개, 기본 사운드를 따로 가집니다.

## 소스 유형

### URL

공개 URL은 브라우저 캡처 결과와 DOM geometry를 함께 사용합니다.

- Logo / Brand
- H1/H2/H3
- 제품 이미지, video, canvas, preview-like surface
- nav / link / button / CTA
- href
- viewport와 scrollY
- `getBoundingClientRect()` 기반 실제 위치

**자동 클릭은 fail-closed입니다.** 다음 입력 URL과 href가 정확히 연결되고 현재 분석 결과에서도 대상이 확인된 경우에만 `TARGET LOCK`이 생기며 자동 클릭할 수 있습니다. 정확한 대상이 없으면 다른 CTA를 임의로 대신 클릭하지 않고 `Focus`로 남깁니다.

### 이미지 / SVG

이미지에는 DOM을 추측하지 않습니다. 파일 순서와 컨셉에 따라 Overview / Detail / Compare / Punch / Calm framing으로 Flow를 만듭니다.

일반 SVG는 이미지 장면으로 가져옵니다. MotionFrame v12에서 저장한 SVG에는 프로젝트 메타데이터가 포함되어 있어 다시 열면 원래 Flow/Scene/사운드 설정을 복원할 수 있습니다.

### 영상 / WebM

MP4/WebM과 화면 녹화 클립은 원본 시간 흐름을 유지하고 카메라·전환·사운드를 추가합니다.

MotionFrame이 같은 브라우저에서 최근 내보낸 WebM을 다시 불러오면 로컬 export 기록과 일치할 경우 편집 상태를 복원합니다. 다른 브라우저/기기에서 WebM만 가져온 경우에는 영상 클립으로 열립니다. **다른 환경에서도 정확한 편집 상태를 보존하려면 SVG 또는 Project JSON을 같이 저장하는 것을 권장합니다.**

## 3단계 분석 안전장치

URL은 초안 생성 전에 `분석 검수` 단계가 있습니다.

1. 캡처 화면 위에 감지 요소 bounding box 표시
2. 사용 요소와 제외 요소 확인
3. 정확한 다음 URL과 연결되는 대상만 `TARGET LOCK` 표시

색상은 다음 의미를 가집니다.

- Target Lock: 실제 클릭 가능한 정확한 연결
- Focus: 영상에서 보여주지만 자동 클릭하지 않음
- Excluded: Flow에서 제외

분석이 이상하면 이 단계에서 고친 뒤 초안을 생성하므로 잘못된 클릭이 Scene까지 퍼지는 것을 줄였습니다.

## 추천 초안

분석 검수가 끝난 뒤 선택한 컨셉에 맞는 초안 3개만 먼저 보여줍니다.

```text
추천
대안 A
대안 B
```

초안을 고르기 전에는 저수준 Scene을 만들지 않습니다. 초안 선택 → Flow 검수 → `영상으로 적용`을 실행한 뒤에 Scene이 생성됩니다.

24개 내장 모션 템플릿은 고급 라이브러리에서 계속 사용할 수 있습니다.

## Flow와 저수준 편집기

Flow에서는 사람이 읽을 수 있는 형태로 순서와 행동을 편집합니다.

- Focus
- Click
- Exact Navigate
- 제외
- 순서 변경
- 연출 타입 변경

마지막 단계에서 필요한 경우에만 다음을 세밀하게 수정합니다.

- 직선 / 곡선 / 자유 Motion Path
- 시작/끝 Zoom
- Cursor
- Transition
- 16:9 / 9:16 / 1:1
- 720p / 1080p
- 사운드 미리듣기

## 저장 형식

### WebM
완성 영상입니다. Canvas video + Web Audio를 하나의 MediaStream으로 렌더링합니다.

### SVG
MotionFrame 편집 메타데이터를 포함한 모션 보드입니다. 다시 불러오면 Flow, Scene, asset, 사운드 설정을 복원할 수 있습니다.

### Project JSON
가장 정확한 백업 포맷입니다. 프로젝트 상태와 사용 asset을 함께 저장하며, 다른 브라우저/기기로 옮길 때 권장합니다.

상단 `결과 불러오기` 또는 편집기의 `결과 불러오기`에서 WebM / SVG / Project JSON을 읽을 수 있습니다.

## 잔류 데이터 자동 정리

v12는 프로젝트 저장소와 IndexedDB 이름을 v12 전용으로 변경했습니다.

첫 실행 시:

- v1–v11 프로젝트/내보내기 키 삭제
- v5–v11 asset IndexedDB 삭제 요청
- 사용자 템플릿은 가능한 경우 v11 → v12로 한 번만 이전
- 새 프로젝트는 빈 Scene에서 시작

`새 프로젝트`/`초기화`는 현재 v12 프로젝트 asset과 export 기록도 비웁니다. 사용자가 이전 버전 데이터를 하나씩 지울 필요가 없습니다.

## 로컬 검증

Node.js만 있으면 됩니다.

```bash
node scripts/verify.mjs
```

검증 항목:

- 17 concepts
- 3 source types
- concept당 3 draft options
- 24 built-in motion templates
- 6 workflow stages
- Analysis Review UI
- Target Lock fail-closed navigation
- synthetic click 방지
- WebM / SVG / Project import/export
- v12 storage / IndexedDB cleanup
- DOM id/reference consistency
- ES module syntax

## GitHub Pages 배포

1. 프로젝트 안쪽 파일 전체를 repository root에 업로드합니다.
2. `main` branch에 push합니다.
3. GitHub → Settings → Pages → Source를 `GitHub Actions`로 지정합니다.
4. 포함된 workflow가 검증 후 정적 사이트를 배포합니다.

```text
https://USERNAME.github.io/REPOSITORY/
```

## URL 분석 제한

GitHub Pages는 정적 호스팅이므로 외부 origin DOM을 직접 읽을 수 없습니다. 현재 공개 URL 분석은 browser capture API에 의존합니다. 로그인 세션을 포함한 실제 브라우저 탐색/클릭까지 완전 자동화하려면 추후 Playwright/Chromium worker를 분리하는 것이 더 안정적입니다.

## License

MIT
