# MotionFrame Studio v4 — `ko9ma7/motionframe` 업데이트

이 폴더는 **npm 설치나 빌드가 필요 없는 GitHub Pages 정적 웹앱**입니다.

## 기존 사이트 교체

1. `motionframe-studio-v4` 폴더 **안쪽의 파일 전체**를 기존 `ko9ma7/motionframe` 저장소 루트에 덮어씁니다.
2. GitHub에 commit / push 합니다.
3. Repository → **Actions**에서 `Deploy MotionFrame Studio to GitHub Pages`가 성공하는지 확인합니다.
4. Repository → **Settings → Pages**에서 Source가 **GitHub Actions**인지 확인합니다.
5. 배포 후 아래 주소에서 확인합니다.

```text
https://ko9ma7.github.io/motionframe/
https://ko9ma7.github.io/motionframe/#capture
https://ko9ma7.github.io/motionframe/#templates
https://ko9ma7.github.io/motionframe/#studio
```

`index.html`이 `app.js?v=4.0.0`, `templates.js?v=4.0.0`, `audio.js?v=4.0.0`을 사용하므로 이전 v3 JavaScript 캐시와 구분됩니다. 그래도 예전 화면이 보이면 한 번 강력 새로고침하세요.

## 배포 후 1분 확인

### URL 구조 기반 시퀀스

`/#capture`에서 공개 URL을 입력하고 `URL 시퀀스로 쇼릴`을 누릅니다.

성공하면 상태 영역에 캡처 진행이 표시되고, 가능한 사이트에서는 `페이지 구조 분석`에 **페이지 제목 / 헤딩 / CTA·버튼 개수와 일부 문구**가 나타납니다. 생성된 장면 이름도 실제 분석 문구를 사용합니다.

구조 분석이 막힌 사이트에서는 캡처 이미지는 유지하고 일반 쇼릴 흐름으로 자동 전환합니다. 로그인된 서비스는 `화면 녹화 클립`을 사용하세요.

### 컴팩트 템플릿

`/#templates`는 24개 카드를 세로로 길게 펼치지 않습니다. 카테고리 필터 아래 **가로 한 줄 라이브러리**로 표시됩니다. 좌우 스크롤하거나 검색해서 바로 적용할 수 있습니다.

### 모션 경로

`/#studio` 미리보기 아래에서:

- `직선` → `경로 그리기` → 시작/끝 두 지점 클릭
- `곡선` → `경로 그리기` → 경유 지점을 여러 번 클릭 → `경로 완료`
- `자유선` → `경로 그리기` → 화면 위에서 드래그

경로가 미리보기 위에 선과 점으로 바로 표시되어야 합니다. 숫자 X/Y 입력은 `고급 좌표 설정` 안에 남아 있습니다.

### 사운드

Sound 영역에는 Ambient Flow, Soft Corporate, Lo-fi Product, Minimal Keys, Glass Motion, Focus Drive, Launch Drive가 표시됩니다. 각 사운드 카드의 `▶`를 누르면 브라우저에서 바로 미리듣습니다.

`WebM 내보내기`에서는 선택한 내장 사운드 또는 업로드한 사용자 오디오가 실제 audio track으로 영상과 함께 기록됩니다. 소리를 넣고 싶지 않을 때만 `사운드 없음`을 선택합니다.

## 검증 명령

Repository의 GitHub Actions가 자동으로 다음 검사를 실행합니다.

```bash
node scripts/verify.mjs
```

이 단계가 실패하면 Pages 배포도 중단되므로 깨진 JavaScript가 그대로 배포되지 않도록 구성되어 있습니다.
