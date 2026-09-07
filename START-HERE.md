# MotionFrame Studio v5 — `ko9ma7/motionframe` 업데이트

이번 v5는 **URL 캡처 후 사람이 일일이 장면을 만드는 버전이 아닙니다.**

URL의 실제 DOM 위치와 링크 href를 읽은 뒤 Auto Director가 기본 소개 흐름을 먼저 만듭니다.

## 1. 기존 GitHub Pages 교체

1. `motionframe-studio-v5` 폴더 **안쪽 파일 전체**를 `ko9ma7/motionframe` 저장소 루트에 덮어씁니다.
2. commit / push 합니다.
3. Repository → **Actions**에서 `Deploy MotionFrame Studio to GitHub Pages` 성공을 확인합니다.
4. Repository → **Settings → Pages**의 Source가 **GitHub Actions**인지 확인합니다.
5. 아래 주소를 확인합니다.

```text
https://ko9ma7.github.io/motionframe/
https://ko9ma7.github.io/motionframe/#capture
https://ko9ma7.github.io/motionframe/#director
https://ko9ma7.github.io/motionframe/#templates
https://ko9ma7.github.io/motionframe/#studio
```

v5는 CSS/JavaScript asset에 `?v=5.0.0`을 사용하므로 이전 버전 캐시와 구분됩니다.

## 2. 가장 먼저 테스트할 흐름

### 방법 A — 연결할 URL을 직접 지정

`URL 분석`에서 다음처럼 한 줄에 하나씩 입력합니다.

```text
https://사이트주소/
https://사이트주소/features
https://사이트주소/pricing
```

`Auto Director로 쇼릴 만들기`를 누릅니다.

성공하면 Auto Director가 각 페이지에서 실제로 찾은:

- H1/H2/H3
- header/nav 링크
- button / role=button
- 일반 링크 / CTA
- 요소 위치
- href

를 기준으로 기본 흐름을 생성합니다.

정상적인 예:

```text
Home 전체
→ Home H1
→ 핵심 기능 H2
→ Features 메뉴로 이동
→ Features 메뉴 클릭
→ Features 페이지 전체
→ Features H1
→ 기능 상세 H2
→ Pricing 메뉴 클릭
→ Pricing 페이지 전체
→ Pricing H1
→ Start free CTA 클릭
→ 전체 줌아웃
```

### 방법 B — URL 하나만 입력

`입력 URL이 1개면 내부 핵심 링크 2개까지 자동 분석`을 켜 두면 Home의 내부 메뉴/CTA 중 제품 소개에 적합한 링크를 최대 2개 더 따라갑니다.

자동으로 고른 경로가 마음에 들지 않으면 Auto Director에서 바로 수정합니다.

## 3. 링크마다 동작 지정

`Auto Director` 섹션에서 각 페이지의 **이 페이지의 요소별 연출 지정**을 펼칩니다.

각 제목/메뉴/버튼마다 다음 중 하나를 고를 수 있습니다.

```text
포커스
클릭
다음 페이지 이동
제외
```

`다음 페이지 이동`을 고르면 대상 페이지도 직접 선택합니다.

예:

```text
Features 메뉴 → 다음 페이지 이동 → Features
Login → 제외
Watch demo → 클릭
Pricing → 다음 페이지 이동 → Pricing
Start free → 클릭
```

수정 후 **이 흐름으로 편집**을 누르면 타임라인을 다시 만듭니다.

## 4. 템플릿의 역할

v5에서 24개 템플릿은 사이트 내용을 임의로 고르는 용도가 아닙니다.

Auto Director의:

```text
어떤 페이지
어떤 제목
어떤 버튼
어떤 다음 페이지
```

구조는 유지하고, 템플릿은 카메라 속도/줌/전환/커서/사운드 스타일만 바꿉니다.

따라서 먼저 Auto Director에서 내용 흐름을 확인한 뒤 모션 스타일을 선택하는 것이 권장 순서입니다.

## 5. 좌표 수정

자동 DOM 좌표가 마음에 들지 않으면 `편집기` 미리보기 위에서 직접 수정합니다.

- 직선: 두 점 클릭
- 곡선: 여러 점 클릭 후 완료
- 자유선: 드래그

X/Y 숫자를 직접 입력할 필요는 없습니다.

## 6. 사운드

Sound 카드의 ▶ 버튼을 눌러 미리듣습니다.

내장 사운드 또는 MP3/WAV/OGG를 선택하면 WebM 내보내기 시 Canvas 영상과 오디오를 같은 MediaStream으로 기록합니다.

## 7. 검증

GitHub Actions는 배포 전에 다음 명령을 실행합니다.

```bash
node scripts/verify.mjs
```

깨진 JavaScript나 Auto Director 핵심 테스트가 실패하면 Pages 배포도 중단됩니다.
