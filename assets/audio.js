export const soundPresets = [
  { id: 'none', label: '사운드 없음', description: '무음으로 내보냅니다.' },
  { id: 'softPulse', label: 'Soft Pulse', description: '차분한 B2B 제품 소개용 펄스.' },
  { id: 'airPad', label: 'Air Pad', description: '여백이 많은 브랜드·포트폴리오용.' },
  { id: 'focusGrid', label: 'Focus Grid', description: '클릭 포인트가 분명한 제품 데모용.' },
  { id: 'launchBeat', label: 'Launch Beat', description: '짧고 빠른 런칭·티저 영상용.' },
  { id: 'custom', label: '내 오디오 파일', description: '업로드한 MP3/WAV/OGG 등을 사용합니다.' }
];

function envelope(t, attack, release, duration) {
  const a = Math.min(1, t / Math.max(.001, attack));
  const r = Math.min(1, Math.max(0, (duration - t) / Math.max(.001, release)));
  return Math.min(a, r);
}

function noise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export function createProceduralBuffer(context, presetId, duration) {
  const sampleRate = context.sampleRate || 44100;
  const length = Math.max(1, Math.ceil(duration * sampleRate));
  const buffer = context.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const bpm = presetId === 'launchBeat' ? 126 : presetId === 'focusGrid' ? 104 : presetId === 'softPulse' ? 88 : 72;
  const beat = 60 / bpm;

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    let v = 0;
    if (presetId === 'airPad') {
      v = Math.sin(t * Math.PI * 2 * 110) * .11 + Math.sin(t * Math.PI * 2 * 164.81) * .075 + Math.sin(t * Math.PI * 2 * 220) * .045;
      v *= .65 + .35 * Math.sin(t * Math.PI * .28) ** 2;
    } else if (presetId === 'softPulse') {
      const phase = (t % beat) / beat;
      const pulse = Math.exp(-phase * 7.5);
      v = Math.sin(t * Math.PI * 2 * 82.41) * .16 * pulse + Math.sin(t * Math.PI * 2 * 164.81) * .045;
    } else if (presetId === 'focusGrid') {
      const phase = (t % beat) / beat;
      const tick = phase < .08 ? Math.exp(-phase * 48) : 0;
      const sub = Math.sin(t * Math.PI * 2 * 73.42) * .12 * Math.exp(-phase * 5.2);
      v = sub + Math.sin(t * Math.PI * 2 * 293.66) * .055 * tick;
    } else if (presetId === 'launchBeat') {
      const half = beat / 2;
      const phase = (t % half) / half;
      const hit = Math.exp(-phase * 10);
      const kickFreq = 58 + 54 * Math.exp(-phase * 8);
      v = Math.sin(t * Math.PI * 2 * kickFreq) * .22 * hit;
      if ((Math.floor(t / half) % 2) === 1) v += noise(i * .07) * .055 * Math.exp(-phase * 16);
    }
    const edge = envelope(t, .08, .35, duration);
    const drift = 1 + .025 * Math.sin(t * .7);
    left[i] = v * edge * drift;
    right[i] = v * edge * (2 - drift);
  }
  return buffer;
}

export function applyFade(gainParam, context, volume, duration, fadeEnabled, startAt = 0) {
  const now = context.currentTime;
  gainParam.cancelScheduledValues(now);
  if (!fadeEnabled) {
    gainParam.setValueAtTime(volume, now);
    return;
  }
  const fade = Math.min(.8, duration / 3);
  const initial = startAt < fade ? volume * (startAt / Math.max(.001, fade)) : volume;
  gainParam.setValueAtTime(initial, now);
  if (startAt < fade) gainParam.linearRampToValueAtTime(volume, now + (fade - startAt));
  const remaining = Math.max(0, duration - startAt);
  if (remaining > fade) gainParam.setValueAtTime(volume, now + remaining - fade);
  gainParam.linearRampToValueAtTime(0.0001, now + remaining);
}
