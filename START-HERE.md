# MotionFrame Studio v3 — 가장 빠른 배포 방법

이 폴더는 **빌드가 필요 없는 GitHub Pages 정적 웹앱**입니다. `npm install`은 필요하지 않습니다.

## 기존 `ko9ma7/motionframe` 저장소를 업데이트하는 경우

1. 이 폴더 안의 파일을 모두 기존 저장소 루트에 덮어씁니다.
2. 특히 아래 파일이 반드시 새 버전이어야 합니다.
   - `index.html`
   - `assets/app.js`
   - `assets/templates.js`
   - `assets/audio.js`
   - `assets/styles.css`
   - `scripts/verify.mjs`
   - `.github/workflows/deploy.yml`
3. GitHub에 commit / push 합니다.
4. Repository → **Actions**에서 `Deploy MotionFrame Studio to GitHub Pages`가 성공하는지 확인합니다.
5. Repository → **Settings → Pages**에서 Source가 **GitHub Actions**인지 확인합니다.
6. 배포 후 `https://ko9ma7.github.io/motionframe/`에서 강력 새로고침합니다.

브라우저가 이전 JavaScript를 캐시하고 있다면 `Ctrl+Shift+R` 또는 모바일 브라우저의 새로고침을 사용하세요.

## 이번 버전에서 바로 확인할 것

### 1. 템플릿

`/#templates`로 이동하면 기본 템플릿 **24개**가 보여야 합니다.

- Website Story
- Hero Dive
- Landing Page Scroll
- Section Hopper
- CTA Finale
- Portfolio Glide
- Product Tour
- Cursor Walkthrough
- Dashboard Scan
- Feature Spotlight
- Form Flow
- Settings Tour
- Data Table Focus
- Mobile App Demo
- Launch Cuts
- Quick Demo
- Social Punch
- Feature Trio
- Before / After
- Release Notes
- Calm Showcase
- Editorial Drift
- Luxury Scroll
- Slow Product Film

장면을 아직 추가하지 않은 상태에서 템플릿을 눌러도 샘플 장면이 자동 생성되어 편집기에서 즉시 확인할 수 있습니다.

### 2. URL 캡처

`/#capture`에서 URL을 한 줄에 하나씩 입력합니다.

```text
https://example.com/
https://example.com/features
https://example.com/pricing
```

그 다음:

1. 캡처 방식 선택
2. 뷰포트 선택
3. 적용 템플릿 선택
4. **URL 시퀀스로 쇼릴** 클릭

클릭하는 순간 오른쪽 상태 패널이 `캡처 중…` 상태로 바뀌어야 합니다.

공개 사이트는 Microlink를 우선 사용하고 실패하면 mShots를 한 번 더 시도합니다. 로그인 화면, 사내 서비스, 데스크톱 프로그램은 `화면 녹화 클립` 기능을 사용하는 것이 안정적입니다.

### 3. 사운드

편집기 오른쪽의 Sound에서 기본 사운드를 선택하거나 자신의 MP3/WAV/OGG 파일을 추가할 수 있습니다. 최종 WebM 렌더링에서는 선택한 사운드가 영상 스트림과 함께 기록됩니다.

## 배포 오류 확인

GitHub Actions의 `Verify static app` 단계가 통과하지 않으면 배포가 중단됩니다. v3 검증은 단순 문자열 검사뿐 아니라 ES module 문법을 실제 module mode로 검사하고, HTML에 없는 DOM ID를 JavaScript가 참조하는지도 확인합니다.

현재 포함된 검증 명령:

```bash
node scripts/verify.mjs
```

성공 시 기본 템플릿 수, 모션 프리셋 수, DOM 참조 수가 함께 출력됩니다.
