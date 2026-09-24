/*
  Live screens for each project — small working models of the idea,
  drawn on a 2D canvas in the device's LCD palette.
  Each factory returns { frame(ctx, w, h, t, dt, pointer), click?(pointer), readout }.
*/

export const LCD = {
  bg: '#141413',
  fg: '#E9E6DF',
  dim: 'rgba(233,230,223,0.38)',
  faint: 'rgba(233,230,223,0.1)',
  sig: '#FF5B14',
};
const mono = (px) => `500 ${px}px "Geist Mono", ui-monospace, monospace`;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[(Math.random() * 16) | 0]).join('');

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15;

function brackets(c, x, y, w, h, l, color) {
  c.strokeStyle = color;
  c.lineWidth = 1.25;
  c.beginPath();
  c.moveTo(x, y + l); c.lineTo(x, y); c.lineTo(x + l, y);
  c.moveTo(x + w - l, y); c.lineTo(x + w, y); c.lineTo(x + w, y + l);
  c.moveTo(x + w, y + h - l); c.lineTo(x + w, y + h); c.lineTo(x + w - l, y + h);
  c.moveTo(x + l, y + h); c.lineTo(x, y + h); c.lineTo(x, y + h - l);
  c.stroke();
}

/* ── NatLang: pseudocode → streaming code, four targets ── */
export function natlang() {
  const pseudo = [
    'fetch the top scores',
    '  read rows from "scores.csv"',
    '  keep rows where score is above 90',
    '  sort them by score, highest first',
    '  return the first ten',
  ];
  const outs = [
    { lang: 'Python', lines: ['def fetch_top_scores():', '    rows = read_csv("scores.csv")', '    rows = [r for r in rows if r.score > 90]', '    rows.sort(key=lambda r: r.score, reverse=True)', '    return rows[:10]'] },
    { lang: 'Rust', lines: ['fn fetch_top_scores() -> Vec<Row> {', '    let mut rows = read_csv("scores.csv");', '    rows.retain(|r| r.score > 90);', '    rows.sort_by(|a, b| b.score.cmp(&a.score));', '    rows.truncate(10);', '    rows', '}'] },
    { lang: 'TypeScript', lines: ['function fetchTopScores(): Row[] {', '  return readCsv("scores.csv")', '    .filter((r) => r.score > 90)', '    .sort((a, b) => b.score - a.score)', '    .slice(0, 10);', '}'] },
    { lang: 'Go', lines: ['func FetchTopScores() []Row {', '    rows := ReadCSV("scores.csv")', '    rows = Keep(rows, func(r Row) bool {', '        return r.Score > 90 })', '    SortDesc(rows, ByScore)', '    return rows[:10]', '}'] },
  ];
  const KW = /^(def|fn|func|function|return|let|mut|const|for|in|if|lambda|bool)$/;
  let li = 0, chars = 0, hold = 0, readout = '';

  return {
    get readout() { return readout; },
    frame(c, w, h, t, dt) {
      const fs = clamp(w / 52, 8.5, 13), lh = fs * 1.62, pad = fs * 1.5;
      c.fillStyle = LCD.bg;
      c.fillRect(0, 0, w, h);
      const o = outs[li], full = o.lines.join('\n');
      if (chars < full.length) chars += dt * 46;
      else if ((hold += dt) > 2.4) { hold = 0; chars = 0; li = (li + 1) % outs.length; }

      // target tabs
      c.font = mono(fs * 0.82);
      let x = pad;
      const ty = pad * 0.7;
      outs.forEach((out, i) => {
        const label = out.lang.toUpperCase();
        const tw = c.measureText(label).width + fs * 1.4;
        if (i === li) { c.fillStyle = LCD.fg; c.fillRect(x, ty, tw, fs * 1.8); c.fillStyle = LCD.bg; }
        else { c.strokeStyle = LCD.faint; c.strokeRect(x + 0.5, ty + 0.5, tw - 1, fs * 1.8 - 1); c.fillStyle = LCD.dim; }
        c.fillText(label, x + fs * 0.7, ty + fs * 1.25);
        x += tw + fs * 0.5;
      });

      const typed = full.slice(0, chars | 0).split('\n');
      const cur = typed.length - 1;
      const active = chars < full.length ? Math.min(pseudo.length - 1, Math.floor((cur / o.lines.length) * pseudo.length)) : -1;

      let y = ty + fs * 1.8 + lh * 1.3;
      c.font = mono(fs * 0.78);
      c.fillStyle = LCD.dim;
      c.fillText('INTENT.NL', pad, y);
      y += lh;
      c.font = mono(fs);
      pseudo.forEach((p, i) => {
        if (i === active) { c.fillStyle = LCD.sig; c.fillRect(pad, y - fs * 0.9, 2, fs * 1.15); }
        c.fillStyle = i === active ? LCD.fg : LCD.dim;
        c.fillText(p, pad + fs, y);
        y += lh;
      });

      y += lh * 0.2;
      c.fillStyle = LCD.faint;
      c.fillRect(pad, y, w - pad * 2, 1);
      y += lh * 1.1;
      c.font = mono(fs * 0.78);
      c.fillStyle = LCD.dim;
      c.fillText(`OUTPUT.${o.lang === 'TypeScript' ? 'TS' : o.lang === 'Python' ? 'PY' : o.lang === 'Rust' ? 'RS' : 'GO'}`, pad, y);
      y += lh;
      c.font = mono(fs);
      const cw = c.measureText('m').width;
      typed.forEach((ln, i) => {
        let cx = pad;
        for (const tok of ln.match(/(\s+|"[^"]*"?|[A-Za-z_]+|.)/g) || []) {
          c.fillStyle = KW.test(tok) ? LCD.sig : tok[0] === '"' ? LCD.dim : LCD.fg;
          c.fillText(tok, cx, y);
          cx += tok.length * cw;
        }
        if (i === cur && (t * 2) % 1 < 0.6) { c.fillStyle = LCD.fg; c.fillRect(cx + 1, y - fs * 0.85, cw * 0.6, fs * 1.1); }
        y += lh;
      });
      readout = chars < full.length ? `→ ${o.lang.toUpperCase()} · LINE ${cur + 1}/${o.lines.length}` : `✓ ${o.lang.toUpperCase()} · DONE`;
    },
  };
}

/* ── Polaris: sky density → risk series → alert ── */
export function polaris() {
  const hist = [];
  const seeds = [];
  let risk = 0, alerts = 0, alertT = 0, sample = 0, seedT = 0, readout = '';

  return {
    get readout() { return readout; },
    frame(c, w, h, t, dt, p) {
      c.fillStyle = LCD.bg;
      c.fillRect(0, 0, w, h);
      const skyH = h * 0.6, cell = Math.max(7, w / 70), pad = Math.max(10, w / 45);
      const zx0 = w * 0.36, zx1 = w * 0.64;

      if (p.inside && p.y < skyH && (seedT += dt) > 0.04) { seedT = 0; seeds.push({ x: p.x, y: p.y, life: 1 }); }
      for (let i = seeds.length - 1; i >= 0; i--) if ((seeds[i].life -= dt * 0.28) <= 0) seeds.splice(i, 1);

      // a storm cell that drifts across the frame on its own
      const sx = (((t * 0.035) % 1.5) - 0.25) * w, sy = skyH * 0.5, sr = w * 0.13;
      let sum = 0, n = 0;
      for (let y = cell / 2; y < skyH; y += cell) {
        for (let x = cell / 2; x < w; x += cell) {
          let d = (fbm(x * 0.011 + t * 0.06, y * 0.016 - t * 0.012) - 0.38) * 1.5;
          const ds = (x - sx) ** 2 + (y - sy) ** 2;
          d += 0.75 * Math.exp(-ds / (2 * sr * sr));
          for (const s of seeds) d += s.life * 0.8 * Math.exp(-((x - s.x) ** 2 + (y - s.y) ** 2) / 5000);
          d = clamp(d);
          if (x > zx0 && x < zx1) { sum += d; n++; }
          const sz = cell * 0.8 * d;
          if (sz < 0.6) continue;
          c.fillStyle = d > 0.78 ? LCD.sig : LCD.fg;
          c.globalAlpha = 0.35 + d * 0.65;
          c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
      }
      c.globalAlpha = 1;
      risk += ((n ? sum / n : 0) * 1.35 - risk) * Math.min(1, dt * 2.5);

      // watch zone brackets
      brackets(c, zx0, pad, zx1 - zx0, skyH - pad * 2, 10, LCD.dim);
      c.font = mono(Math.max(8, w / 70));
      c.fillStyle = LCD.dim;
      c.fillText('CAM 01 · SKY', pad, pad + 8);
      c.fillText('WATCH ZONE', zx0 + 6, skyH - pad - 6);

      // risk series + naive forecast
      if ((sample += dt) > 0.08) { sample = 0; hist.push(risk); if (hist.length > 90) hist.shift(); }
      const cy0 = skyH + pad * 1.4, cy1 = h - pad, ch = cy1 - cy0, cw = w - pad * 2;
      const yOf = (v) => cy1 - clamp(v) * ch;
      c.fillStyle = LCD.faint;
      c.fillRect(pad, cy0 - pad * 0.7, cw, 1);
      c.setLineDash([3, 4]);
      c.strokeStyle = LCD.dim;
      c.beginPath(); c.moveTo(pad, yOf(0.6)); c.lineTo(pad + cw, yOf(0.6)); c.stroke();
      c.setLineDash([]);
      c.fillStyle = LCD.dim;
      c.fillText('THRESHOLD', pad + cw - 64, yOf(0.6) - 5);
      const step = (cw * 0.75) / 90;
      c.strokeStyle = LCD.fg;
      c.lineWidth = 1.5;
      c.beginPath();
      hist.forEach((v, i) => (i ? c.lineTo(pad + i * step, yOf(v)) : c.moveTo(pad, yOf(v))));
      c.stroke();
      if (hist.length > 10) {
        const last = hist[hist.length - 1], slope = (last - hist[hist.length - 10]) / 9;
        const x0 = pad + (hist.length - 1) * step, pred = clamp(last + slope * 18);
        c.setLineDash([2, 3]);
        c.strokeStyle = pred > 0.6 ? LCD.sig : LCD.dim;
        c.beginPath(); c.moveTo(x0, yOf(last)); c.lineTo(x0 + 18 * step, yOf(pred)); c.stroke();
        c.setLineDash([]);
        c.fillStyle = LCD.dim;
        c.fillText('LSTM', x0 + 18 * step + 4, yOf(pred) + 3);
      }
      c.lineWidth = 1;

      if (risk > 0.6 && alertT <= 0) { alerts++; alertT = 3.2; }
      if (alertT > 0) {
        alertT -= dt;
        if ((t * 3) % 1 < 0.7) {
          const bw = Math.max(120, w * 0.3), bh = 26;
          c.fillStyle = LCD.sig;
          c.fillRect(w - pad - bw, pad, bw, bh);
          c.fillStyle = LCD.bg;
          c.fillText('ALERT → PUSH SENT', w - pad - bw + 9, pad + 17);
        }
      }
      readout = `RISK ${risk.toFixed(2)} · ${risk > 0.6 ? 'ALERT' : 'NOMINAL'} · ${alerts} SENT`;
    },
  };
}

/* ── AIRO Bot: line following with ultrasonic avoidance ── */
export function airo() {
  let u = 0, off = 0, readout = '';
  const trail = [];
  const fixed = [{ u: 0.18, r: 16 }, { u: 0.62, r: 20 }];

  return {
    get readout() { return readout; },
    frame(c, w, h, t, dt, p) {
      c.fillStyle = LCD.bg;
      c.fillRect(0, 0, w, h);
      const pad = Math.max(12, w / 36);
      const cx = w / 2, cy = h / 2, ax = w / 2 - pad * 3, ay = h / 2 - pad * 2.4;
      const pt = (s) => {
        const a = s * Math.PI * 2;
        return [cx + ax * Math.cos(a), cy + ay * Math.sin(a) * (1 - 0.22 * Math.cos(2 * a))];
      };
      const normal = (s) => {
        const [x0, y0] = pt(s - 0.001), [x1, y1] = pt(s + 0.001);
        const l = Math.hypot(x1 - x0, y1 - y0);
        return [-(y1 - y0) / l, (x1 - x0) / l];
      };

      // room
      c.strokeStyle = LCD.dim;
      c.strokeRect(pad * 0.6 + 0.5, pad * 0.6 + 0.5, w - pad * 1.2, h - pad * 1.2);
      c.fillStyle = LCD.faint;
      c.fillRect(pad * 0.6, h * 0.62, w * 0.18, h * 0.38 - pad * 0.6);
      c.fillRect(w * 0.7, pad * 0.6, w * 0.3 - pad * 0.6, h * 0.14);

      // the line
      c.strokeStyle = 'rgba(233,230,223,0.28)';
      c.lineWidth = 5;
      c.beginPath();
      for (let s = 0; s <= 1.001; s += 0.01) { const [x, y] = pt(s); s ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      c.lineWidth = 1;

      const obs = fixed.map((o) => { const [x, y] = pt(o.u); return { x, y, r: o.r }; });
      if (p.inside) obs.push({ x: p.x, y: p.y, r: 22, you: true });

      // look ahead along the line for anything in the way
      let want = 0, echo = Infinity;
      const [rx0, ry0] = pt(u);
      for (let k = 0.01; k < 0.09; k += 0.01) {
        const [lx, ly] = pt(u + k);
        for (const o of obs) {
          const d = Math.hypot(lx - o.x, ly - o.y);
          if (d < o.r + 26) want = o.r + 30;
          const dr = Math.hypot(rx0 - o.x, ry0 - o.y) - o.r;
          echo = Math.min(echo, dr);
        }
      }
      off += (want - off) * Math.min(1, dt * 3);
      u = (u + dt * 0.035 * (want ? 0.7 : 1)) % 1;

      const [nx, ny] = normal(u), [bx, by] = pt(u);
      const rx = bx + nx * off, ry = by + ny * off;
      const [fx, fy] = pt(u + 0.005);
      const head = Math.atan2(fy - by, fx - bx);
      trail.push([rx, ry]);
      if (trail.length > 70) trail.shift();

      obs.forEach((o) => {
        c.strokeStyle = o.you ? LCD.sig : LCD.fg;
        c.beginPath(); c.arc(o.x, o.y, o.r, 0, Math.PI * 2); c.stroke();
        c.save();
        c.beginPath(); c.arc(o.x, o.y, o.r, 0, Math.PI * 2); c.clip();
        c.strokeStyle = o.you ? 'rgba(255,91,20,0.5)' : LCD.dim;
        for (let i = -o.r * 2; i < o.r * 2; i += 5) { c.beginPath(); c.moveTo(o.x + i, o.y - o.r); c.lineTo(o.x + i + o.r * 2, o.y + o.r); c.stroke(); }
        c.restore();
      });

      c.fillStyle = LCD.dim;
      trail.forEach(([x, y], i) => { if (i % 3 === 0) c.fillRect(x - 1, y - 1, 2, 2); });

      // ultrasonic sweep
      const sweep = head + Math.sin(t * 5) * 0.35;
      c.fillStyle = 'rgba(233,230,223,0.07)';
      c.beginPath(); c.moveTo(rx, ry); c.arc(rx, ry, 70, head - 0.45, head + 0.45); c.closePath(); c.fill();
      c.strokeStyle = want ? LCD.sig : LCD.dim;
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(sweep) * 70, ry + Math.sin(sweep) * 70); c.stroke();

      c.save();
      c.translate(rx, ry);
      c.rotate(head);
      c.fillStyle = LCD.fg;
      c.fillRect(-11, -9, 22, 18);
      c.fillStyle = LCD.bg;
      c.fillRect(4, -5, 4, 10);
      c.fillStyle = LCD.sig;
      c.fillRect(-11, -11, 8, 2); c.fillRect(-11, 9, 8, 2);
      c.restore();

      const cm = Number.isFinite(echo) ? Math.max(4, Math.round(echo * 0.6)) : 0;
      readout = `ECHO ${String(cm).padStart(3, '0')} CM · ${want ? 'AVOIDING' : 'FOLLOWING LINE'}`;
    },
  };
}

/* ── BlockBallot: votes → Merkle root → proof of work ── */
export function ballot() {
  const chain = [{ n: 124, hash: '0000' + hex(6), votes: 4 }, { n: 125, hash: '0000' + hex(6), votes: 2 }, { n: 126, hash: '0000' + hex(6), votes: 5 }];
  let pending = [], nonce = 0, mined = 0, voteT = 0, shift = 0, id = 231, readout = '';
  const tally = { A: 18, B: 14, C: 9 };
  const cast = () => {
    const cand = ['A', 'B', 'C'][(Math.random() * 3) | 0];
    tally[cand]++;
    pending.push({ id: id++, cand });
    if (pending.length > 8) pending.shift();
  };

  return {
    get readout() { return readout; },
    click: cast,
    frame(c, w, h, t, dt) {
      c.fillStyle = LCD.bg;
      c.fillRect(0, 0, w, h);
      const pad = Math.max(12, w / 36), fs = clamp(w / 64, 8, 12);
      c.font = mono(fs);

      if ((voteT += dt) > 1.1) { voteT = 0; cast(); }
      nonce += (rnd(900, 2400) * dt * 60) | 0;
      if ((mined += dt) > 2.8 && pending.length) {
        mined = 0;
        chain.push({ n: chain[chain.length - 1].n + 1, hash: '0000' + hex(6), votes: pending.length });
        pending = [];
        nonce = 0;
        shift = 1;
      }
      shift = Math.max(0, shift - dt * 2.5);

      // chain
      const bw = clamp(w * 0.2, 90, 150), bh = bw * 0.62, gap = bw * 0.28, y0 = pad * 2.2;
      const ease = shift * shift * (3 - 2 * shift);
      const px = w - pad - bw;
      const visible = chain.slice(-4);
      visible.forEach((b, i) => {
        const x = px - (visible.length - i) * (bw + gap) + ease * (bw + gap);
        if (x + bw < 0) return;
        c.strokeStyle = LCD.fg;
        c.strokeRect(x + 0.5, y0 + 0.5, bw, bh);
        c.fillStyle = LCD.dim;
        c.fillText(`BLOCK #${b.n}`, x + 8, y0 + fs + 6);
        c.fillStyle = LCD.fg;
        c.fillText(`${b.hash.slice(0, 8)}…`, x + 8, y0 + bh / 2 + 4);
        c.fillStyle = LCD.dim;
        c.fillText(`${b.votes} VOTES`, x + 8, y0 + bh - 8);
        c.strokeStyle = LCD.dim;
        c.beginPath(); c.moveTo(x + bw, y0 + bh / 2); c.lineTo(x + bw + gap, y0 + bh / 2); c.stroke();
      });

      // pending block, mining
      c.setLineDash([4, 3]);
      c.strokeStyle = LCD.sig;
      c.strokeRect(px + 0.5, y0 + 0.5, bw, bh);
      c.setLineDash([]);
      c.fillStyle = LCD.sig;
      c.fillText('MINING', px + 8, y0 + fs + 6);
      c.fillStyle = LCD.fg;
      c.fillText(hex(8) + '…', px + 8, y0 + bh / 2 + 4);
      c.fillStyle = LCD.dim;
      c.fillText(`NONCE ${nonce}`, px + 8, y0 + bh - 8);

      // Merkle tree over the pending votes
      const leaves = pending.length ? pending : [{ id: '—', cand: '' }];
      const ty = y0 + bh + pad * 1.6, tb = h - pad * 3.2;
      const tx0 = pad, tw = w - pad * 2;
      let level = leaves.map((l, i) => ({ x: tx0 + ((i + 0.5) / leaves.length) * tw, y: tb, l }));
      const levels = [level];
      while (level.length > 1) {
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
          const a = level[i], b = level[i + 1] || a;
          next.push({ x: (a.x + b.x) / 2, y: 0, kids: [a, b] });
        }
        level = next;
        levels.push(level);
      }
      const dy = (tb - ty) / Math.max(1, levels.length - 1);
      levels.forEach((lv, d) => lv.forEach((nd) => { nd.y = tb - d * dy; }));
      c.strokeStyle = LCD.dim;
      levels.forEach((lv) => lv.forEach((nd) => nd.kids?.forEach((k) => { c.beginPath(); c.moveTo(nd.x, nd.y); c.lineTo(k.x, k.y); c.stroke(); })));
      levels.forEach((lv, d) => lv.forEach((nd) => {
        const root = d === levels.length - 1;
        c.fillStyle = root ? LCD.sig : LCD.fg;
        c.fillRect(nd.x - 3, nd.y - 3, 6, 6);
        if (root) { c.fillStyle = LCD.dim; c.fillText('MERKLE ROOT', nd.x + 8, nd.y + 4); }
        if (d === 0 && nd.l.cand) { c.fillStyle = LCD.dim; c.fillText(`#${nd.l.id}`, nd.x - fs * 1.4, nd.y + fs * 1.6); }
      }));

      // tally
      const total = tally.A + tally.B + tally.C;
      let bx = pad;
      const by = h - pad * 1.1;
      ['A', 'B', 'C'].forEach((k, i) => {
        const bwid = ((w - pad * 2) * tally[k]) / total;
        c.fillStyle = i === 0 ? LCD.fg : i === 1 ? LCD.dim : LCD.faint;
        c.fillRect(bx, by, bwid - 2, 6);
        bx += bwid;
      });
      readout = `BLOCK #${chain[chain.length - 1].n + 1} · ${pending.length} PENDING · NONCE ${nonce}`;
    },
  };
}

/* ── Footfall: detect, track, count across a line ── */
export function footfall() {
  const people = [];
  let nextId = 1, inC = 37, outC = 29, spawnT = 0, flash = 0, readout = '';
  const you = { side: 0 };

  return {
    get readout() { return readout; },
    frame(c, w, h, t, dt, p) {
      c.fillStyle = LCD.bg;
      c.fillRect(0, 0, w, h);
      const fs = clamp(w / 70, 8, 11), lineY = h * 0.52, s = clamp(w / 600, 0.7, 1.2);
      c.font = mono(fs);

      // floor
      c.fillStyle = LCD.faint;
      for (let x = 20; x < w; x += 28) for (let y = 16; y < h; y += 28) c.fillRect(x, y, 1.5, 1.5);

      if ((spawnT -= dt) < 0 && people.length < 8) {
        spawnT = rnd(0.5, 1.4);
        const down = Math.random() < 0.55;
        people.push({ x: rnd(w * 0.08, w * 0.92), y: down ? -30 : h + 30, vx: rnd(-12, 12), vy: (down ? 1 : -1) * rnd(28, 46) * s, id: nextId++, conf: rnd(0.84, 0.98), side: down ? -1 : 1, ph: rnd(0, 6) });
      }
      for (let i = people.length - 1; i >= 0; i--) {
        const q = people[i];
        q.x += q.vx * dt; q.y += q.vy * dt;
        const side = q.y < lineY ? -1 : 1;
        if (side !== q.side) { side > 0 ? inC++ : outC++; q.side = side; flash = 0.4; }
        if (q.y < -60 || q.y > h + 60) people.splice(i, 1);
      }
      if (p.inside) {
        const side = p.y < lineY ? -1 : 1;
        if (you.side && side !== you.side) { side > 0 ? inC++ : outC++; flash = 0.4; }
        you.side = side;
      } else you.side = 0;
      flash = Math.max(0, flash - dt);

      c.setLineDash([6, 5]);
      c.strokeStyle = flash > 0 ? LCD.sig : LCD.dim;
      c.lineWidth = flash > 0 ? 2 : 1;
      c.beginPath(); c.moveTo(0, lineY); c.lineTo(w, lineY); c.stroke();
      c.setLineDash([]);
      c.lineWidth = 1;
      c.fillStyle = LCD.dim;
      c.fillText('COUNT LINE', 12, lineY - 7);

      const draw = (x, y, label, near, bob) => {
        const bw = 26 * s, bh = 44 * s;
        c.fillStyle = LCD.fg;
        c.beginPath(); c.arc(x, y - bh * 0.3 + bob, 4.5 * s, 0, Math.PI * 2); c.fill();
        c.fillRect(x - 6 * s, y - bh * 0.16 + bob, 12 * s, 17 * s);
        c.fillRect(x - 5 * s, y + 3 * s + bob, 3.5 * s, 12 * s);
        c.fillRect(x + 1.5 * s, y + 3 * s - bob, 3.5 * s, 12 * s);
        brackets(c, x - bw / 2 - 4, y - bh / 2 - 6, bw + 8, bh + 8, 6, near ? LCD.sig : LCD.fg);
        c.fillStyle = near ? LCD.sig : LCD.fg;
        c.fillText(label, x - bw / 2 - 4, y - bh / 2 - 11);
      };
      people.forEach((q) => draw(q.x, q.y, `ID ${String(q.id).padStart(2, '0')} ${q.conf.toFixed(2)}`, Math.abs(q.y - lineY) < 30, Math.sin(t * 9 + q.ph) * 1.2));
      if (p.inside) draw(p.x, p.y, 'ID 00 YOU', Math.abs(p.y - lineY) < 30, 0);

      c.fillStyle = LCD.fg;
      c.font = mono(fs * 1.1);
      c.fillText(`IN  ${inC}`, w - 88, 22);
      c.fillText(`OUT ${outC}`, w - 88, 22 + fs * 1.7);
      readout = `IN ${inC} · OUT ${outC} · TRACKING ${people.length + (p.inside ? 1 : 0)}`;
    },
  };
}

/* ── PRISMRx: medication interaction graph ── */
export function prism() {
  const meds = ['Warfarin', 'Aspirin', 'Clopidogrel', 'Omeprazole', 'Simvastatin', 'Amiodarone', 'Lisinopril', 'Metformin'];
  const E = [
    [0, 1, 3, 'Bleeding risk'],
    [0, 5, 3, 'INR raised'],
    [4, 5, 3, 'Myopathy risk'],
    [2, 3, 2, 'Reduced activation'],
    [1, 2, 2, 'Bleeding risk'],
    [1, 6, 1, 'Reduced BP effect'],
    [0, 3, 1, 'INR may rise'],
  ];
  const SEV = ['', 'MINOR', 'MODERATE', 'MAJOR'];
  let focus = 0, auto = 0, readout = '';

  return {
    get readout() { return readout; },
    frame(c, w, h, t, dt, p) {
      c.fillStyle = LCD.bg;
      c.fillRect(0, 0, w, h);
      const fs = clamp(w / 62, 8, 12), cx = w / 2, cy = h / 2 + 4, R = Math.min(w * 0.3, h * 0.36);
      c.font = mono(fs);
      const pos = meds.map((_, i) => {
        const a = (i / meds.length) * Math.PI * 2 - Math.PI / 2 + Math.sin(t * 0.2) * 0.03;
        return [cx + Math.cos(a) * R, cy + Math.sin(a) * R, a];
      });

      let hover = -1;
      if (p.inside) pos.forEach(([x, y], i) => { if (Math.hypot(p.x - x, p.y - y) < 30) hover = i; });
      if (hover >= 0) focus = hover;
      else if ((auto += dt) > 2.2) { auto = 0; focus = [0, 5, 2, 1, 4][(Math.floor(t / 2.2)) % 5]; }

      const rel = E.filter((e) => e[0] === focus || e[1] === focus);
      E.forEach((e) => {
        const [a, b, sev] = e;
        const on = e[0] === focus || e[1] === focus;
        c.strokeStyle = sev === 3 ? LCD.sig : sev === 2 ? LCD.fg : LCD.dim;
        c.globalAlpha = on ? 1 : 0.16;
        c.lineWidth = sev === 3 ? 2 : 1.2;
        if (sev === 1) c.setLineDash([3, 4]);
        c.beginPath(); c.moveTo(pos[a][0], pos[a][1]); c.lineTo(pos[b][0], pos[b][1]); c.stroke();
        c.setLineDash([]);
        if (on) {
          const k = (t * 0.6 + a * 0.13) % 1;
          c.fillStyle = c.strokeStyle;
          c.fillRect(pos[a][0] + (pos[b][0] - pos[a][0]) * k - 2, pos[a][1] + (pos[b][1] - pos[a][1]) * k - 2, 4, 4);
        }
      });
      c.globalAlpha = 1;
      c.lineWidth = 1;

      pos.forEach(([x, y, a], i) => {
        const isF = i === focus;
        c.fillStyle = isF ? LCD.sig : LCD.bg;
        c.strokeStyle = isF ? LCD.sig : LCD.fg;
        c.beginPath(); c.arc(x, y, isF ? 7 : 5, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = isF ? LCD.fg : LCD.dim;
        const label = meds[i].toUpperCase();
        const tw = c.measureText(label).width;
        const lx = x + Math.cos(a) * 16 - (Math.cos(a) < -0.2 ? tw : Math.cos(a) > 0.2 ? 0 : tw / 2);
        c.fillText(label, lx, y + Math.sin(a) * 18 + 4);
      });

      // centre panel: the worst interaction for the focused medicine
      const worst = rel.sort((x, y) => y[2] - x[2])[0];
      c.textAlign = 'center';
      c.fillStyle = LCD.dim;
      c.fillText(meds[focus].toUpperCase(), cx, cy - fs * 1.2);
      if (worst) {
        const other = worst[0] === focus ? worst[1] : worst[0];
        c.fillStyle = LCD.fg;
        c.fillText(`× ${meds[other].toUpperCase()}`, cx, cy + fs * 0.4);
        c.fillStyle = worst[2] === 3 ? LCD.sig : LCD.dim;
        c.fillText(`${SEV[worst[2]]} · ${worst[3].toUpperCase()}`, cx, cy + fs * 2);
        readout = `${rel.length} INTERACTION${rel.length > 1 ? 'S' : ''} · WORST ${SEV[worst[2]]}`;
      } else {
        c.fillStyle = LCD.fg;
        c.fillText('NO KNOWN PAIRS', cx, cy + fs * 0.4);
        readout = 'CLEAR · 0 INTERACTIONS';
      }
      c.textAlign = 'left';
      c.fillStyle = LCD.dim;
      c.fillText('ILLUSTRATIVE DATA', 12, h - 12);
    },
  };
}

export const demos = { natlang, polaris, airo, ballot, footfall, prism };
