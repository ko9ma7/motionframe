# MotionFrame Studio — 가장 빠른 배포 방법

이 프로젝트는 **GitHub Pages에서 그대로 동작하는 정적 웹앱**입니다. Node.js, npm, 데이터베이스, 별도 빌드 서버가 없어도 됩니다.

## 1. GitHub Repository 만들기

1. GitHub에서 새 Repository를 만듭니다.
2. 예: `motionframe-studio`
3. Public / Private 중 Pages 사용 가능한 형태를 선택합니다.
4. 이 폴더 안의 파일을 **폴더째가 아니라 내용 전체** Repository 루트에 업로드합니다.

업로드 후 저장소 루트에 최소한 아래가 보여야 합니다.

```text
index.html
assets/
.github/
manifest.webmanifest
README.md
```

## 2. GitHub Pages 켜기

Repository에서:

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

을 선택합니다.

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로:

1. 정적 파일 검증
2. GitHub Pages URL 계산
3. canonical / OG / sitemap URL 치환
4. Pages artifact 업로드
5. 배포

를 수행합니다.

배포 주소는 보통 다음과 같습니다.

```text
https://USERNAME.github.io/REPOSITORY/
```

## 3. 사용 방법

### 공개 사이트

`URL 캡처` 영역에 주소를 넣습니다.

한 사이트의 여러 화면을 연결하려면 URL을 줄바꿈으로 입력할 수 있습니다.

```text
https://example.com/
https://example.com/features
https://example.com/pricing
```

`URL 시퀀스로 쇼릴`을 누르면 선택한 템플릿을 적용해 타임라인을 만듭니다.

### 로그인된 웹앱 / 데스크톱 프로그램

외부 캡처 서비스가 로그인 세션을 알 수 없으므로 `화면 녹화 클립`을 사용합니다.

브라우저에서 화면 공유 권한을 허용하고 실제 기능을 조작한 뒤 녹화를 종료하면 WebM 클립이 타임라인 장면으로 추가됩니다.

### 템플릿

기본 템플릿을 적용한 뒤 줌, 포커스, 커서, 전환, 길이를 수정합니다.

`현재 연출 저장`으로 내 템플릿을 만들 수 있으며, 저장된 템플릿은:

- 다시 적용
- 현재 설정으로 갱신
- JSON 백업
- 삭제

할 수 있습니다.

### 사운드

기본 트랙은 브라우저에서 직접 합성합니다.

- Soft Pulse
- Air Pad
- Focus Grid
- Launch Beat

또는 MP3/WAV/OGG/WebM/MP4 오디오 파일을 직접 넣을 수 있습니다.

### 영상 내보내기

`WebM 내보내기`를 누르면 Canvas 영상 스트림과 오디오 스트림을 결합해 브라우저에서 실시간 렌더링합니다.

## URL 캡처에 관해

기본 URL 캡처는 Microlink 공개 API를 사용합니다.

현재 공개 무료 사용량이 있으므로 별도 API key 없이 바로 시험할 수 있습니다. 다만 무료 쿼터를 넘는 규모에서 운영할 경우 **유료 API key를 GitHub Pages JavaScript에 직접 넣으면 안 됩니다.** 그때는 Cloudflare Worker 같은 아주 얇은 Serverless Proxy에 key를 보관하는 방식으로 확장하세요.

URL 캡처가 막힌 사이트는 다음 대안을 사용합니다.

- 화면 녹화 클립
- 현재 화면 한 장
- 이미지/영상 업로드

## 로컬 실행

ES Module을 사용하므로 `index.html` 파일을 더블클릭하는 것보다 작은 정적 서버로 여는 것을 권장합니다.

Python이 있다면:

```bash
python -m http.server 8080
```

그 후:

```text
http://localhost:8080/
```

## 검증

Node.js가 있다면 dependency 설치 없이 다음 검사를 실행할 수 있습니다.

```bash
node scripts/verify.mjs
node --check assets/app.js
node --check assets/templates.js
node --check assets/audio.js
```

GitHub Actions 배포 과정에서도 `verify.mjs`가 자동 실행됩니다.
