/*
  TUX's avatar, as a dot matrix. Colour is state, exactly as in TUX:
  idle blue, listening cyan, thinking violet, done green, rose for stop.
  Each mood is a field of cell sizes; switching mood ripples outward from
  the centre, and cells swell toward the pointer.
*/
export const MOODS = {
  idle: [58, 102, 232],
  listen: [20, 184, 204],
  think: [124, 77, 245],
  done: [62, 203, 141],
  error: [232, 80, 107],
};

const ring = (d, r, w) => Math.max(0, 1 - Math.abs(d - r) / w);
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

function field(mood, x, y, t) {
  const d = Math.abs(x) + Math.abs(y);
  if (d > 1.02) return 0;
  switch (mood) {
    case 'listen': {
      // ripples travelling outward, as if hearing
      const wave = Math.max(0, Math.sin(d * 11 - t * 5.5));
      return Math.max(ring(d, 0.86, 0.1) * 0.9, (0.25 + 0.75 * wave) * (1 - d * 0.55), d < 0.18 ? 0.95 : 0);
    }
    case 'think': {
      // a lit arc chasing round the diamond
      const a = (Math.atan2(y, x) / (Math.PI * 2) + 1 - t * 0.45) % 1;
      const arc = a < 0.3 ? 1 - a / 0.3 : 0.12;
      const core = ring(d, 0.3 + 0.08 * Math.sin(t * 4), 0.1);
      return Math.max(ring(d, 0.8, 0.14) * arc, core * 0.9, d < 0.1 ? 1 : 0);
    }
    case 'done': {
      const tick = Math.min(segDist(x, y, -0.48, 0.02, -0.14, 0.38), segDist(x, y, -0.14, 0.38, 0.5, -0.32));
      return Math.max(tick < 0.13 ? 1 - tick * 2.5 : 0, ring(d, 0.9, 0.06) * 0.35);
    }
    case 'error': {
      const cross = Math.min(Math.abs(x - y), Math.abs(x + y)) / Math.SQRT2;
      return Math.max(cross < 0.1 && d < 0.8 ? 1 - cross * 3 : 0, ring(d, 0.9, 0.06) * 0.35);
    }
    default: {
      // idle: an outer diamond, a breathing inner ring, a bright core
      const breathe = 0.5 + 0.5 * Math.sin(d * 7 - t * 1.4);
      return Math.max(
        ring(d, 0.82, 0.13) * (0.7 + 0.3 * breathe),
        ring(d, 0.56, 0.06) * 0.45 * breathe,
        d < 0.32 ? 0.98 - d * 0.9 : 0,
        0.1,
      );
    }
  }
}

export function createAvatar(canvas, { cells = 27 } = {}) {
  const c = canvas.getContext('2d');
  const N = cells;
  const cur = new Float32Array(N * N);
  const dist = new Float32Array(N * N);
  let mood = 'idle', changedAt = 0, t = 0, last = 0, raf = 0, visible = false, size = 0;
  const col = MOODS.idle.slice(), target = MOODS.idle.slice();
  const ptr = { x: 9, y: 9, on: false };

  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 2 - 1, y = (j / (N - 1)) * 2 - 1;
    dist[j * N + i] = Math.abs(x) + Math.abs(y);
  }

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio, 2);
    size = Math.min(r.width, r.height);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    t += dt;
    for (let k = 0; k < 3; k++) col[k] += (target[k] - col[k]) * Math.min(1, dt * 5);

    const w = canvas.clientWidth, h = canvas.clientHeight;
    c.clearRect(0, 0, w, h);
    const pitch = size / N, ox = (w - size) / 2, oy = (h - size) / 2;
    const rgb = `${col[0] | 0},${col[1] | 0},${col[2] | 0}`;
    const lit = `${(col[0] + (255 - col[0]) * 0.35) | 0},${(col[1] + (255 - col[1]) * 0.35) | 0},${(col[2] + (255 - col[2]) * 0.35) | 0}`;
    const since = t - changedAt;

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const k = j * N + i;
        const x = (i / (N - 1)) * 2 - 1, y = (j / (N - 1)) * 2 - 1;
        let v = field(mood, x, y, t);
        if (ptr.on && dist[k] < 1.02) v = Math.max(v, 0.85 * Math.exp(-((x - ptr.x) ** 2 + (y - ptr.y) ** 2) / 0.035));
        // the change ripples out from the centre
        const rate = since > dist[k] * 0.28 ? 9 : 0.6;
        cur[k] += (v - cur[k]) * Math.min(1, dt * rate);
        const s = cur[k];
        if (s < 0.04) continue;
        const side = pitch * (0.12 + 0.74 * s);
        c.fillStyle = `rgba(${s > 0.82 ? lit : rgb},${0.18 + 0.82 * s})`;
        c.fillRect(ox + i * pitch + (pitch - side) / 2, oy + j * pitch + (pitch - side) / 2, side, side);
      }
    }
  }

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
  const ro = new ResizeObserver(resize);
  const move = (e) => {
    const r = canvas.getBoundingClientRect();
    const s = Math.min(r.width, r.height);
    ptr.x = ((e.clientX - r.left - (r.width - s) / 2) / s) * 2 - 1;
    ptr.y = ((e.clientY - r.top - (r.height - s) / 2) / s) * 2 - 1;
    ptr.on = Math.abs(ptr.x) + Math.abs(ptr.y) < 1.4;
  };
  const leave = () => { ptr.on = false; };
  resize();
  io.observe(canvas);
  ro.observe(canvas);
  addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerleave', leave);

  return {
    setMood(m) {
      if (m === mood) return;
      mood = m;
      changedAt = t;
      target.splice(0, 3, ...(MOODS[m] || MOODS.idle));
    },
    // cells start dark and ripple on from the centre
    boot() { cur.fill(0); changedAt = t; },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    },
  };
}
