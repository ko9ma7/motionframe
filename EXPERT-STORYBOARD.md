# MotionFrame Studio v12 — 기본 연출 기준

v12의 기본값은 `Concept → Source → Review → Draft → Flow → Studio` 순서입니다.

## AI 제품 리뷰 + URL

```text
01 Brand reveal
02 First viewport establish
03 H1 focus
04 Product/UI spotlight
05 Important section sweep
06 Exact linked control settle
07 Cursor hover + click (Target Lock만)
08 Destination chapter
09 Chapter title
10 Product/UI detail
11 Next exact action
12 Resolve
```

페이지가 많아도 모든 요소를 영상에 넣지 않습니다. 분석 검수 단계에서 컨셉별 핵심 후보만 먼저 보여주고, 선택한 항목으로 Flow를 만듭니다.

## 클릭 안전 기준

- 정확한 href/target 매칭이 없으면 Navigate를 만들지 않음
- synthetic fallback 버튼에 cursor/click을 만들지 않음
- Review 단계에서 Target Lock 상태를 눈으로 확인 가능
- 사용자가 Navigate로 바꾸려 해도 exact target이 없으면 Focus로 되돌림

## 이미지

```text
Image 1 · Establish
→ Image 1 · Detail
→ Image 2 · Focus
→ Image 3 · Focus / Compare
→ Resolve
```

DOM/CTA를 추측하지 않습니다.

## 영상

```text
Clip establish
→ camera emphasis
→ selected moment / next clip
→ transition
→ sound accent
→ resolve
```

원본 시간 흐름을 존중하며 가짜 클릭을 만들지 않습니다.

## 재편집용 저장

- WebM: 최종 전달 영상
- SVG: MotionFrame 메타데이터 포함 재편집용 모션 보드
- Project JSON: 가장 정확한 전체 백업
