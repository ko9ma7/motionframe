# MotionFrame Studio v8 — 시작하기

## 기존 `ko9ma7/motionframe` 저장소에 배포

1. `motionframe-studio-v8-ready.zip`을 풉니다.
2. `motionframe-studio-v8` 폴더 **안의 파일 전체**를 기존 repository root에 덮어씁니다.
3. `main` branch에 commit/push합니다.
4. GitHub → **Actions**에서 `Deploy MotionFrame Studio to GitHub Pages`가 성공하는지 확인합니다.
5. GitHub → Settings → Pages의 Source가 **GitHub Actions**인지 확인합니다.

배포 후:

```text
https://ko9ma7.github.io/motionframe/
```

브라우저가 이전 JS를 캐시하면 `Ctrl + Shift + R`로 한 번 강력 새로고침하세요. v8 asset에는 `?v=8.0.0`이 붙어 있습니다.

## 가장 먼저 시험할 방법

1. URL 분석 영역에 사이트 URL을 넣습니다.
2. `분석 범위`에서 기본값을 그대로 사용합니다.
   - 최대 3페이지
   - 페이지당 핵심 10개
   - 한 화면 단위
   - 제목/미디어/메뉴/CTA
3. `Auto Director로 쇼릴 만들기`를 누릅니다.
4. Auto Director에서 먼저 **분석된 요소 선택**을 봅니다.
5. 필요 없는 제목/버튼은 체크를 끕니다.
6. `선택으로 Flow 다시 만들기`를 누릅니다.
7. 아래 Flow가 다음처럼 읽히는지 확인합니다.

```text
페이지 전체
→ H1
→ 제품 화면
→ 버튼/메뉴 클릭
→ 실제 목적지 섹션
→ 다음 기능
→ 다음 페이지 또는 CTA
→ Resolve
```

8. `플로우를 영상으로 적용`을 누릅니다.
9. 편집기에서 재생하고 사운드를 미리듣습니다.
10. WebM으로 내보냅니다.

## MotionFrame 자체 URL 테스트

MotionFrame처럼 한 페이지 안에 `#capture`, `#director`, `#templates`, `#studio`가 있다면 링크의 목적지 Y 좌표까지 읽어:

```text
Hero
→ URL로 시작하기 Click
→ #capture
→ Auto Director Click
→ #director
→ 템플릿 Click
→ #templates
→ 편집기 Click
→ #studio
→ Resolve
```

형태로 구성되는 것이 정상입니다.

## 이전 프로젝트 데이터 주의

v7 프로젝트는 읽을 수 있지만 Director 데이터 모델이 바뀌었습니다. 새 기본 Flow 품질을 확인할 때는 URL을 다시 분석하는 것을 권장합니다.
