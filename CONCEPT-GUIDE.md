# MotionFrame Studio v12 — 컨셉 가이드

| 컨셉 | 주요 목적 | 권장 소스 | 기본 연출 방향 |
|---|---|---|---|
| AI 제품 리뷰 | 처음 보는 사람이 제품을 둘러보는 리뷰 | URL | Brand → Hero → Product → Exact action → Chapter |
| 기능 투어 | 기능과 결과를 순서 있게 설명 | URL·이미지 | Feature → UI → Action → Result |
| 온보딩 / 사용법 | 처음부터 사용 순서를 설명 | URL·영상 | Step → Control → Click → Next step |
| 클릭 워크스루 | 메뉴/CTA 행동 중심 | URL | Target lock → Hover → Click → Destination |
| 랜딩 페이지 쇼케이스 | 랜딩의 시각적 구성 강조 | URL | Establish → Section sweep → CTA |
| 런칭 티저 | 짧고 강한 공개 영상 | URL·이미지·영상 | Hook → Punch → Feature → CTA |
| UI 인터랙션 데모 | UI 조작 흐름 강조 | URL·영상 | Control → Cursor → State change |
| 대시보드 / 데이터 스토리 | 데이터 화면과 핵심 영역 설명 | URL·이미지 | Overview → Metric/UI focus → Detail |
| 핵심 기능 집중 | 1~3개 기능만 집중 | URL·이미지 | Strong focus → Detail → Result |
| 업데이트 / 릴리즈 | 새 기능/변경점 소개 | URL·이미지·영상 | Before/context → New feature → Result |
| 비포 / 애프터 | 전후 변화 비교 | 이미지·영상 | Before → Transition → After |
| 포트폴리오 / 케이스 스터디 | 작업 결과와 과정 소개 | URL·이미지 | Intro → Work → Detail → Outcome |
| 이미지 스토리 | 이미지 묶음을 영상으로 구성 | 이미지·SVG | Overview → Detail → Sequence |
| 영상 하이라이트 | 여러 클립의 주요 순간 편집 | 영상·WebM | Clip → Emphasis → Transition |
| 모바일 앱 데모 | 모바일 화면/세로 동선 | URL·이미지·영상 | 9:16 framing → Tap-like focus → Step |
| 숏폼 / 소셜 | 짧은 Hook 중심 | 이미지·영상·URL | 2s Hook → 3 beats → CTA |
| 프리미엄 시네마틱 | 느리고 고급스러운 제품 필름 | 이미지·영상·URL | Establish → Orbit/Float → Detail → Resolve |

## 공통 원칙

컨셉은 단순 카메라 프리셋이 아닙니다. 다음을 함께 결정합니다.

- 어떤 소스가 적합한지
- 어떤 역할의 요소를 우선 분석할지
- 요소/페이지/클립당 최대 비트 수
- 클릭을 적극 사용할지
- 화면 비율과 속도
- 기본 자동 기능 체크
- 추천 초안 3개
- 기본 사운드

## URL의 클릭 원칙

자동 클릭은 반드시 Target Lock을 통과해야 합니다.

```text
현재 분석 요소 href
        ==
사용자가 입력한 다음 URL / hash
        ↓
TARGET LOCK
        ↓
자동 Click/Navigate 허용
```

일치하지 않으면 다른 CTA를 대신 누르지 않고 Focus만 합니다.

## 이미지/영상 원칙

이미지나 영상에는 존재하지 않는 DOM/버튼을 생성하지 않습니다. 이미지 순서 또는 원본 클립 시간축을 기반으로 컨셉 카메라와 전환만 적용합니다.
