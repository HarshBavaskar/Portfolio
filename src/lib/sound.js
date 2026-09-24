// Tactile UI clicks, synthesised — off until the visitor turns them on.
let ctx = null;
export const sound = { on: false };

export function toggleSound() {
  sound.on = !sound.on;
  if (sound.on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (sound.on) click(880, 0.05);
  return sound.on;
}

export function click(freq = 1400, dur = 0.03, gain = 0.07) {
  if (!sound.on || !ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.01);
}
