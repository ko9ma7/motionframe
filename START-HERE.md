# MotionFrame Studio v11 — 시작하기

## 가장 먼저 할 일

페이지에 들어가면 URL부터 입력하지 말고 **컨셉부터 선택**합니다.

1. `AI 제품 리뷰`, `기능 투어`, `런칭 임팩트` 등 원하는 컨셉을 고릅니다.
2. 소스를 `웹사이트 URL / 이미지 / 영상` 중 하나로 고릅니다.
3. 컨셉이 요구하는 데이터만 넣습니다.
4. 기본 자동 기능에서 필요 없는 항목만 체크 해제합니다.
5. `분석하고 추천 초안 만들기`를 누릅니다.
6. 생성된 3개 초안 중 하나를 선택합니다.
7. Flow에서 순서나 클릭 행동을 고칩니다.
8. 필요한 경우에만 편집기에서 카메라 path/zoom/cursor를 세밀하게 수정합니다.
9. 사운드를 미리듣고 `WebM 내보내기`를 실행합니다.

## MotionFrame 자체를 URL 예제로 테스트

```text
https://ko9ma7.github.io/motionframe/
https://ko9ma7.github.io/motionframe/#capture
https://ko9ma7.github.io/motionframe/#templates
https://ko9ma7.github.io/motionframe/#studio
```

권장값:

- 컨셉: `AI 제품 리뷰`
- 소스: `웹사이트 URL`
- 자동 기능: 기본값 그대로
- 추천 초안: 첫 번째 `추천 초안`

## 이미지를 사용하는 경우

이미지를 여러 장 선택하면 파일 순서를 기본 스토리 순서로 사용합니다. URL처럼 버튼/DOM을 추측하지 않습니다.

- 기능 설명 이미지 → `핵심 기능 집중`
- 제품 스크린샷 여러 장 → `AI 제품 리뷰` 또는 `기능 투어`
- Before/After 두 장 → `비포 / 애프터`
- 브랜드 이미지 → `프리미엄 쇼케이스`

## 영상/화면 녹화

MP4/WebM을 넣거나 브라우저 화면 녹화를 사용할 수 있습니다. 영상은 원본 클립 흐름을 유지하고 컨셉에 맞는 카메라와 사운드를 얹습니다.

## GitHub Pages 배포

프로젝트 **안쪽 파일 전체**를 repository root에 업로드하고:

`Settings → Pages → Source → GitHub Actions`

를 선택합니다.

push 시 workflow가 검증 후 자동 배포합니다.
