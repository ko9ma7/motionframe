# MotionFrame Studio v12 — 시작하기

## 6단계로 사용합니다

MotionFrame은 더 이상 긴 페이지를 끝까지 내려가며 설정하지 않습니다.

### 1. 컨셉
먼저 영상 목적을 고릅니다. `AI 제품 리뷰`, `기능 투어`, `온보딩`, `클릭 워크스루`, `런칭 티저`, `이미지 스토리`, `영상 하이라이트`, `숏폼`, `프리미엄 시네마틱` 등 17개 타입이 있습니다.

### 2. 소스
`URL / 이미지 / 영상` 중 하나를 고릅니다. 컨셉에 맞는 자동 기능이 기본 체크되어 있으므로 필요 없는 것만 끕니다.

### 3. 분석 검수
URL이라면 가장 중요한 단계입니다. 캡처 화면 위에서 감지된 제목·메뉴·버튼 위치를 확인합니다.

- `TARGET LOCK` = 실제 다음 입력 URL과 정확히 연결되어 자동 클릭 가능
- `Focus` = 보여주기만 함
- `제외` = Flow에서 사용하지 않음

잘못된 버튼은 이 단계에서 제외하세요. Target Lock이 없는 버튼은 자동으로 다른 버튼을 대신 클릭하지 않습니다.

### 4. 추천 초안
컨셉과 분석 결과에 맞는 3개 초안만 보여줍니다. 하나를 고릅니다.

### 5. Flow
영상의 사람이 읽을 수 있는 순서를 확인합니다. 항목 순서, Focus/Click/Navigate 여부, 연출 타입을 조정합니다.

### 6. 편집 · 출력
Flow를 영상으로 적용한 뒤 필요한 장면만 세부 조절합니다. WebM / SVG / Project JSON으로 저장할 수 있습니다.

## MotionFrame 자체 URL 테스트

```text
https://ko9ma7.github.io/motionframe/
https://ko9ma7.github.io/motionframe/#capture
https://ko9ma7.github.io/motionframe/#templates
https://ko9ma7.github.io/motionframe/#studio
```

권장:

- 컨셉: `AI 제품 리뷰`
- 소스: `URL`
- 자동 기능: 기본값
- Review 단계에서 `URL로 시작하기 → #capture`, `모션 스타일 → #templates`, `편집기 → #studio`처럼 실제 연결된 항목에만 Target Lock이 생기는지 확인

## 저장과 다시 열기

- **WebM**: 완성 영상. 같은 브라우저의 최근 MotionFrame export라면 로컬 기록과 매칭해 편집 상태 복원을 시도합니다. 아니면 편집 가능한 영상 클립으로 가져옵니다.
- **SVG**: MotionFrame 메타데이터가 들어간 재편집용 모션 보드. 다른 브라우저에서도 다시 열어 Flow/Scene을 복원할 수 있습니다.
- **Project JSON**: 가장 정확한 전체 백업. 장기 보관/이동에 권장합니다.

## 이전 버전 데이터

v12 첫 실행 시 v11 이하 프로젝트/asset 잔류 데이터를 자동 정리합니다. 새 프로젝트를 누르면 현재 v12 asset과 export 기록도 함께 정리되므로 수동 삭제가 필요하지 않습니다.

## GitHub Pages 배포

프로젝트 **안쪽 파일 전체**를 기존 repository root에 덮어쓰고 push합니다.

GitHub에서:

`Settings → Pages → Source → GitHub Actions`

을 선택하면 포함된 workflow가 검증 후 배포합니다.
