# MotionFrame를 GitHub Pages에 올리는 가장 간단한 방법

이 프로젝트는 **npm, Node.js, 서버, DB가 필요 없습니다.** GitHub가 정적 파일을 그대로 배포합니다.

## 1. ZIP 압축을 풉니다

압축을 풀면 `index.html`, `assets/`, `.github/`, `404.html` 등이 보입니다.

중요: ZIP 파일 자체를 GitHub에 올리는 것이 아니라 **압축을 푼 프로젝트 파일 전체**를 Repository에 넣습니다.

## 2. GitHub에서 빈 Repository를 만듭니다

예시 이름: `motionframe`

- Public Repository로 만들어도 됩니다.
- README, .gitignore, License 자동 생성 옵션은 체크하지 않아도 됩니다. 프로젝트 안에 이미 포함되어 있습니다.

## 3. 프로젝트 파일 전체를 main 브랜치에 올립니다

GitHub Desktop, Git CLI, VS Code 중 익숙한 방법을 사용하면 됩니다.

Git CLI 예시:

```bash
git init
git add .
git commit -m "Initial MotionFrame"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

## 4. GitHub Pages를 켭니다

Repository에서:

`Settings → Pages → Build and deployment → Source → GitHub Actions`

을 선택합니다.

이미 `.github/workflows/deploy.yml`이 들어 있으므로 다른 Workflow 파일을 만들 필요가 없습니다.

## 5. Actions 완료 후 주소를 엽니다

일반 Repository라면:

```text
https://USERNAME.github.io/REPOSITORY/
```

형태로 서비스됩니다.

예를 들어 GitHub 사용자명이 `kim`이고 Repository가 `motionframe`이면:

```text
https://kim.github.io/motionframe/
```

입니다.

## 사용 방법

1. `이미지 추가`로 제품 화면 스크린샷을 넣습니다.
2. 또는 `화면 한 장 캡처`를 눌러 브라우저 탭/프로그램 창을 선택합니다.
3. 장면을 선택하고 오른쪽에서 길이, 줌, 포커스 위치, 커서 위치를 조절합니다.
4. 가운데 미리보기의 재생 버튼으로 전체 흐름을 확인합니다.
5. `WebM 내보내기`를 누르면 실제 WebM 파일이 생성됩니다.

WebM 생성은 영상 길이만큼 실시간으로 렌더링됩니다. 내보내는 동안 브라우저 탭을 닫지 마세요.

## 중요한 GitHub Pages 제약

정적 GitHub Pages에서는 URL 하나만 입력받아 다른 웹사이트를 자동으로 열고 클릭하거나 그 DOM을 직접 조작할 수 없습니다. 동일 출처 정책과 브라우저 화면 캡처 권한 때문입니다.

그래서 이 버전은 **사용자가 제공한 스크린샷 / 사용자가 직접 허용한 화면 캡처**를 원본으로 사용합니다. 나중에 URL 자동 촬영까지 필요해지면 그때만 별도의 Playwright/Chromium 렌더링 서버를 추가하는 것이 맞습니다.
