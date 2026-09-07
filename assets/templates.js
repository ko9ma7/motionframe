export const motionPresets = {
  custom: { label: '직접 설정' },
  overview: { label: '전체 → 중심', startZoom: 100, endZoom: 116, startX: 50, startY: 50, endX: 50, endY: 46, cursorEnabled: false },
  focus: { label: '디테일 포커스', startZoom: 108, endZoom: 156, startX: 50, startY: 50, endX: 68, endY: 48, cursorEnabled: true, cursorX: 69, cursorY: 50 },
  pullout: { label: '줌아웃', startZoom: 150, endZoom: 100, startX: 55, startY: 48, endX: 50, endY: 50, cursorEnabled: false },
  panRight: { label: '좌 → 우', startZoom: 128, endZoom: 128, startX: 25, startY: 50, endX: 75, endY: 50, cursorEnabled: false },
  panLeft: { label: '우 → 좌', startZoom: 128, endZoom: 128, startX: 75, startY: 50, endX: 25, endY: 50, cursorEnabled: false },
  scrollDown: { label: '위 → 아래 스크롤', startZoom: 112, endZoom: 112, startX: 50, startY: 12, endX: 50, endY: 88, cursorEnabled: false },
  scrollUp: { label: '아래 → 위 스크롤', startZoom: 112, endZoom: 112, startX: 50, startY: 88, endX: 50, endY: 12, cursorEnabled: false },
  cursorChase: { label: '커서 추적', startZoom: 112, endZoom: 142, startX: 38, startY: 40, endX: 70, endY: 58, cursorEnabled: true, cursorX: 72, cursorY: 60 },
  snapDetail: { label: '빠른 디테일', startZoom: 100, endZoom: 175, startX: 50, startY: 50, endX: 62, endY: 45, cursorEnabled: true, cursorX: 64, cursorY: 47 },
  calmFloat: { label: '잔잔한 플로트', startZoom: 108, endZoom: 118, startX: 46, startY: 48, endX: 54, endY: 52, cursorEnabled: false },
  mobileFocus: { label: '모바일 포커스', startZoom: 104, endZoom: 132, startX: 50, startY: 45, endX: 50, endY: 58, cursorEnabled: true, cursorX: 50, cursorY: 60 }
};

const s = (motion, duration, transition = 'crossfade', override = {}) => ({ motion, duration, transition, ...override });

export const builtinTemplates = [
  {
    id: 'web-story', title: 'Website Story', category: 'website', motion: 'scroll', durationLabel: '11–14 sec', audioPreset: 'softPulse',
    description: '한 장의 full-page 캡처를 상단·중단·디테일·CTA로 나눠 자연스럽게 훑습니다.',
    sequence: [s('overview', 2.4), s('scrollDown', 3.2, 'slide', { startY: 12, endY: 58 }), s('focus', 2.5), s('scrollDown', 2.6, 'crossfade', { startY: 55, endY: 90 }), s('pullout', 2.0, 'zoom-out')]
  },
  {
    id: 'product-tour', title: 'Product Tour', category: 'product', motion: 'zoom', durationLabel: '10–12 sec', audioPreset: 'focusGrid',
    description: '전체 화면에서 기능으로 빨려 들어가고 커서 클릭 후 다시 빠져나오는 제품 데모 흐름.',
    sequence: [s('overview', 2.2), s('focus', 2.5), s('cursorChase', 2.4, 'zoom-out'), s('pullout', 2.2)]
  },
  {
    id: 'launch-fast', title: 'Launch Cuts', category: 'fast', motion: 'cut', durationLabel: '6–8 sec', audioPreset: 'launchBeat',
    description: '짧은 줌과 컷을 빠르게 연결해 런칭 영상이나 SNS 티저에 맞춥니다.',
    sequence: [s('overview', 1.3, 'cut'), s('snapDetail', 1.25, 'cut'), s('panRight', 1.2, 'cut'), s('snapDetail', 1.25, 'zoom-out'), s('pullout', 1.4, 'cut')]
  },
  {
    id: 'dashboard-scan', title: 'Dashboard Scan', category: 'product', motion: 'pan', durationLabel: '9–11 sec', audioPreset: 'softPulse',
    description: '대시보드의 왼쪽·오른쪽·하단을 순차적으로 훑고 중요한 수치로 포커스합니다.',
    sequence: [s('panRight', 2.3), s('focus', 2.2), s('scrollDown', 2.5, 'slide', { startY: 38, endY: 76 }), s('pullout', 2.0)]
  },
  {
    id: 'cursor-flow', title: 'Cursor Flow', category: 'product', motion: 'zoom', durationLabel: '8–10 sec', audioPreset: 'focusGrid',
    description: '마우스가 화면 곳곳을 이동하며 기능을 클릭하는 듯한 사용 흐름을 강조합니다.',
    sequence: [s('cursorChase', 2.4, 'zoom-out', { cursorX: 30, cursorY: 38, endX: 30, endY: 38 }), s('cursorChase', 2.4, 'crossfade', { cursorX: 70, cursorY: 42, endX: 70, endY: 42 }), s('cursorChase', 2.4, 'zoom-out', { cursorX: 62, cursorY: 72, endX: 62, endY: 72 }), s('pullout', 1.8)]
  },
  {
    id: 'calm-showcase', title: 'Calm Showcase', category: 'calm', motion: 'zoom', durationLabel: '12–15 sec', audioPreset: 'airPad',
    description: '여백을 살린 느린 이동과 페이드로 포트폴리오·브랜드 사이트를 차분하게 보여줍니다.',
    sequence: [s('calmFloat', 3.2), s('panRight', 3.2), s('focus', 3.0), s('pullout', 2.8)]
  },
  {
    id: 'mobile-app', title: 'Mobile Spotlight', category: 'product', motion: 'mobile', durationLabel: '9–11 sec', audioPreset: 'softPulse', aspect: '9:16', frameStyle: 'floating',
    description: '모바일 화면을 세로형 쇼츠 비율로 보여주고 터치 포인트를 커서 연출로 강조합니다.',
    sequence: [s('mobileFocus', 2.4), s('scrollDown', 2.6, 'slide', { startY: 18, endY: 72 }), s('mobileFocus', 2.4, 'zoom-out', { endY: 66, cursorY: 68 }), s('pullout', 1.8)]
  },
  {
    id: 'feature-trio', title: 'Feature Trio', category: 'website', motion: 'cut', durationLabel: '8–10 sec', audioPreset: 'focusGrid',
    description: '세 가지 핵심 기능을 각기 다른 포커스 위치로 빠르게 소개하는 범용 템플릿.',
    sequence: [s('overview', 1.8), s('focus', 2.0, 'crossfade', { endX: 28, endY: 45, cursorX: 28, cursorY: 47 }), s('focus', 2.0, 'crossfade', { endX: 50, endY: 60, cursorX: 50, cursorY: 62 }), s('focus', 2.0, 'zoom-out', { endX: 75, endY: 42, cursorX: 75, cursorY: 44 }), s('pullout', 1.4)]
  },
  {
    id: 'compare-flow', title: 'Before / After', category: 'website', motion: 'pan', durationLabel: '7–9 sec', audioPreset: 'airPad',
    description: '두 장 이상의 화면을 부드러운 좌우 이동과 컷으로 비교할 때 적합합니다.',
    sequence: [s('panRight', 2.4, 'crossfade'), s('panLeft', 2.4, 'crossfade'), s('overview', 2.0, 'zoom-out')]
  },
  {
    id: 'short-demo', title: 'Quick Demo', category: 'fast', motion: 'zoom', durationLabel: '5–7 sec', audioPreset: 'launchBeat',
    description: '한 기능만 빠르게 보여주기 위한 짧은 줌인 → 클릭 → 줌아웃 구성.',
    sequence: [s('overview', 1.2, 'cut'), s('snapDetail', 2.0, 'zoom-out'), s('pullout', 1.6, 'cut')]
  }
];

export const templateCategories = [
  ['all', '전체'], ['website', 'Website'], ['product', 'Product'], ['fast', 'Fast'], ['calm', 'Calm'], ['custom', '내 템플릿']
];

export function hydrateMotion(scene, presetId, overrides = {}) {
  const preset = motionPresets[presetId] || motionPresets.overview;
  return {
    ...scene,
    motionPreset: presetId,
    startZoom: preset.startZoom ?? scene.startZoom ?? 100,
    endZoom: preset.endZoom ?? scene.endZoom ?? 120,
    startX: preset.startX ?? scene.startX ?? 50,
    startY: preset.startY ?? scene.startY ?? 50,
    endX: preset.endX ?? scene.endX ?? 50,
    endY: preset.endY ?? scene.endY ?? 50,
    cursorEnabled: preset.cursorEnabled ?? scene.cursorEnabled ?? false,
    cursorX: preset.cursorX ?? scene.cursorX ?? 66,
    cursorY: preset.cursorY ?? scene.cursorY ?? 52,
    ...overrides
  };
}
