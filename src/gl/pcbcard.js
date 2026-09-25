import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CARD, qrMatrix } from '../lib/card';

/*
  The contact card as a real circuit board, 1 unit ≈ 25 mm. Black solder
  mask with an orange-peel clear coat over copper you can feel, gold (ENIG)
  pads and edge fingers, plated holes drilled right through, a routed
  fibreglass edge, and soldered parts that cast shadows. The logo boots on
  a small TFT, the name is lit on a micro-LED matrix, and the contact
  details and QR are laser-engraved into the mask on the back.
*/

const coarse = matchMedia('(pointer: coarse)').matches;
const W0 = 3.4, H0 = 2.14, T = 0.064, R = 0.13; // a bank card, 1.6 mm thick
const BEV = 0.005; // the routed edge is eased, not knife-sharp
const TAB = { w: 0.46, h: 0.62, r: 0.05 }; // USB-style edge tab
const minX = -W0 / 2, maxX = W0 / 2 + TAB.w, minY = -H0 / 2, maxY = H0 / 2;
const SPANX = maxX - minX, SPANY = maxY - minY;
const PX = coarse ? 420 : 600; // texture pixels per unit

const GOLD = '#b8862f', MASK = '#0b0c0d', COPPER = '#191d1f', SILK = '#ecebe6';
const font = (w, px, mono) => `${w} ${px}px ${mono ? '"Geist Mono", ui-monospace, monospace' : 'Geist, "Helvetica Neue", Arial, sans-serif'}`;

// where the parts sit, shared by the artwork and the 3D parts
const CHIP = { x: 0.62, y: 0.22, s: 0.44 };
const PASSIVES = [[0.2, -0.05, 'cap'], [0.36, -0.05, 'cap'], [1.0, 0.62, 'res'], [1.0, 0.5, 'res']];
const XTAL = { x: 0.1, y: 0.62 };
const BTN = { x: 1.42, y: 0.4 };
const LED = { x: 1.38, y: 0.62 };
const HOLES = Array.from({ length: 6 }, (_, k) => [0.12 + k * 0.2, -0.8]);
const DRILL = 0.024; // a 1.2 mm hole: header pins go through
const FINGERS = [-0.2, -0.067, 0.067, 0.2];
const CORNERS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const EDGE = -1.52; // the left column lines up on this
const TFT = { x: -0.98, y: 0.62, w: 1.08, h: 0.6 }; // a 1.14" 240×135 panel
const FPC = { x: -0.26, y: 0.59, pads: [0.5, 0.56, 0.62, 0.68] }; // its flex connector
const PITCH = 0.019; // micro-LED matrix: 0.48 mm pitch
const MATRIX = { x: EDGE + 0.015, y: 0.155 }; // top-left LED
// the HB mark, in its 28-unit glyph box
const INK = [['M4 3.5v21', 21], ['M13 3.5v21', 21], ['M13 3.5h4.5a5.25 5.25 0 0 1 0 10.5H13', 25.5], ['M13 14h5.5a5.25 5.25 0 0 1 0 10.5H13', 27.5]];
// 5×7 dot-matrix glyphs, enough for the name
const GLYPHS = {
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
};
// the name as columns of lit dots
const NAME = [...CARD.name.toUpperCase()].flatMap((ch, i) => {
  const g = GLYPHS[ch] || Array(7).fill('00000');
  const cols = Array.from({ length: 5 }, (_, c) => g.map((row) => row[c] === '1'));
  return i ? [Array(7).fill(false), ...cols] : cols;
});
const pin = (side, k) => {
  const off = -0.1575 + k * 0.045, e = CHIP.s / 2 + 0.03;
  return [[CHIP.x + e, CHIP.y + off], [CHIP.x - e, CHIP.y + off], [CHIP.x + off, CHIP.y + e], [CHIP.x + off, CHIP.y - e]][side];
};

function outline(mirror, d = 0) {
  const m = (x) => (mirror ? -x : x);
  const x0 = -W0 / 2 + d, x1 = W0 / 2 - d, y0 = -H0 / 2 + d, y1 = H0 / 2 - d, r = R - d;
  const ty0 = -TAB.h / 2 + d, ty1 = TAB.h / 2 - d, tx1 = W0 / 2 + TAB.w - d, tr = TAB.r - d;
  const s = new THREE.Shape();
  s.moveTo(m(x0 + r), y0);
  s.lineTo(m(x1 - r), y0);
  s.quadraticCurveTo(m(x1), y0, m(x1), y0 + r);
  s.lineTo(m(x1), ty0);
  s.lineTo(m(tx1 - tr), ty0);
  s.quadraticCurveTo(m(tx1), ty0, m(tx1), ty0 + tr);
  s.lineTo(m(tx1), ty1 - tr);
  s.quadraticCurveTo(m(tx1), ty1, m(tx1 - tr), ty1);
  s.lineTo(m(x1), ty1);
  s.lineTo(m(x1), y1 - r);
  s.quadraticCurveTo(m(x1), y1, m(x1 - r), y1);
  s.lineTo(m(x0 + r), y1);
  s.quadraticCurveTo(m(x0), y1, m(x0), y1 - r);
  s.lineTo(m(x0), y0 + r);
  s.quadraticCurveTo(m(x0), y0, m(x0 + r), y0);
  return s;
}

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/* ── Artwork: colour, an ORM-style map (R clearcoat, G roughness, B metal)
      and a height map, painted together layer by layer ── */
function surface() {
  const make = () => {
    const c = document.createElement('canvas');
    c.width = Math.round(SPANX * PX);
    c.height = Math.round(SPANY * PX);
    return c;
  };
  const col = make(), orm = make(), bump = make();
  const P = { col, orm, bump, a: col.getContext('2d'), b: orm.getContext('2d'), h: bump.getContext('2d') };
  P.a.fillStyle = MASK;
  P.a.fillRect(0, 0, col.width, col.height);
  P.b.fillStyle = 'rgb(255,120,0)'; // mask: satin under a clear coat
  P.b.fillRect(0, 0, orm.width, orm.height);
  P.h.fillStyle = 'rgb(110,110,110)';
  P.h.fillRect(0, 0, bump.width, bump.height);
  // pigment in the mask, and the glass weave faintly printing through it
  for (let i = 0; i < 14000; i++) {
    P.a.fillStyle = `rgba(255,255,255,${rnd() * 0.022})`;
    P.a.fillRect(rnd() * col.width, rnd() * col.height, 1.5, 1.5);
  }
  P.h.globalAlpha = 0.022;
  P.h.fillStyle = '#fff';
  for (let x = 0; x < bump.width; x += PX * 0.02) P.h.fillRect(x, 0, PX * 0.008, bump.height);
  for (let y = 0; y < bump.height; y += PX * 0.02) P.h.fillRect(0, y, bump.width, PX * 0.008);
  P.h.globalAlpha = 1;
  // the satin varies a little across the board, as sprayed mask does
  for (let i = 0; i < 60; i++) {
    const x = rnd() * orm.width, y = rnd() * orm.height, r = PX * (0.08 + rnd() * 0.25);
    const g = P.b.createRadialGradient(x, y, 0, x, y, r);
    const v = rnd() > 0.5 ? 150 : 95;
    g.addColorStop(0, `rgba(255,${v},0,0.35)`);
    g.addColorStop(1, `rgba(255,${v},0,0)`);
    P.b.fillStyle = g;
    P.b.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return P;
}

// board units → canvas pixels, for a face drawn as the viewer sees it
const toPx = (vxMin) => ({ X: (x) => (x - vxMin) * PX, Y: (y) => (maxY - y) * PX, L: (u) => u * PX });

function layer(c, style, draw) {
  c.save();
  c.fillStyle = style;
  c.strokeStyle = style;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  draw(c);
  c.restore();
}
// mask openings: gold sits a little below the mask around it
const gold = (P, draw) => { layer(P.a, GOLD, draw); layer(P.b, 'rgb(0,105,255)', draw); layer(P.h, 'rgb(80,80,80)', draw); };
// ink sits on top of the mask: matte, no clear coat, raised
const silk = (P, draw) => { layer(P.a, SILK, draw); layer(P.b, 'rgb(30,175,0)', draw); layer(P.h, 'rgb(170,170,170)', draw); };
// copper under the mask: barely a colour, but its edges catch the light
const copper = (P, draw) => { layer(P.a, COPPER, draw); layer(P.h, 'rgb(158,158,158)', draw); };

/* Laser engraving: the beam ablates the mask down to a satin metal floor.
   The cut is recessed; its top-left wall falls in shadow and its
   bottom-right wall catches the light. `draw` paints white onto a mask. */
function engrave(P, draw, depth = 0.0032) {
  const w = P.col.width, h = P.col.height, d = depth * PX;
  const sheet = () => Object.assign(document.createElement('canvas'), { width: w, height: h });
  const mask = sheet(), m = mask.getContext('2d');
  m.fillStyle = m.strokeStyle = '#fff';
  draw(m);
  // one scratch sheet, reused for each pass
  const scratch = sheet(), g = scratch.getContext('2d');
  const pass = (target, style, shift = 0) => {
    g.globalCompositeOperation = 'copy';
    g.drawImage(mask, 0, 0);
    if (shift) { g.globalCompositeOperation = 'destination-out'; g.drawImage(mask, shift, shift); }
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = style;
    g.fillRect(0, 0, w, h);
    target.drawImage(scratch, 0, 0);
  };
  pass(P.a, '#a98c5a');
  pass(P.a, 'rgba(18,12,4,0.9)', d);
  pass(P.a, 'rgba(255,238,200,0.6)', -d);
  pass(P.b, 'rgb(0,140,255)');
  pass(P.h, 'rgb(38,38,38)');
  mask.width = scratch.width = 0; // hand the memory back now
}

function ring(P, x, y, r, drill) {
  gold(P, (c) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
  if (!drill) {
    layer(P.a, '#050505', (c) => { c.beginPath(); c.arc(x, y, r * 0.45, 0, Math.PI * 2); c.fill(); });
    return;
  }
  // the plated lip darkens as it turns down into the hole
  layer(P.a, '#4a3413', (c) => { c.beginPath(); c.arc(x, y, drill * 1.22, 0, Math.PI * 2); c.fill(); });
  // drilled clean through: the colour map goes transparent there
  P.a.save();
  P.a.globalCompositeOperation = 'destination-out';
  P.a.fillStyle = '#000';
  P.a.beginPath(); P.a.arc(x, y, drill, 0, Math.PI * 2); P.a.fill();
  P.a.restore();
}
// a via under the mask: just a tented bump
const tented = (P, x, y, r) => layer(P.h, 'rgb(160,160,160)', (c) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });

// soft contact shadow baked under a part (shadow trick, so no ctx.filter)
function ao(P, x, y, w, h, blur, alpha = 0.85) {
  const c = P.a, off = 20000;
  c.save();
  c.shadowColor = `rgba(0,0,0,${alpha})`;
  c.shadowBlur = blur;
  c.shadowOffsetX = off;
  c.fillStyle = '#000';
  c.fillRect(x - w / 2 - off, y - h / 2, w, h);
  c.restore();
}

function frontFace() {
  const P = surface();
  const { X, Y, L } = toPx(minX);
  const path = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.stroke(); };

  // routed copper, 45° bends, every trace going somewhere
  copper(P, (c) => {
    c.lineWidth = L(0.02);
    FINGERS.forEach((fy, k) => {
      const [px, py] = pin(0, 2 + k);
      path(c, [[px, py], [1.12, py], [1.12 + Math.abs(fy - py), fy], [1.78, fy]]);
    });
    HOLES.forEach(([hx, hy], k) => {
      const [px, py] = pin(3, 1 + k);
      path(c, [[px, py], [px, -0.3], [hx, -0.3 - Math.abs(hx - px)], [hx, hy]]);
    });
    const [a1, b1] = pin(2, 1), [a2, b2] = pin(2, 2), [a3, b3] = pin(2, 3), [a6, b6] = pin(2, 6), [a7, b7] = pin(2, 7);
    path(c, [[a1, b1], [a1, 0.59], [XTAL.x + 0.085, 0.59]]); // crystal
    path(c, [[a2, b2], [a2, 0.65], [XTAL.x + 0.085, 0.65]]);
    path(c, [[a3, b3], [a3, 0.8], [a3 - 0.06, 0.86], [0.34, 0.86]]); // to a via
    path(c, [[a6, b6], [a6, 0.52], [a6 + 0.1, 0.62], [0.97, 0.62]]); // → R1 → D1
    path(c, [[1.03, 0.62], [LED.x - 0.03, 0.62]]);
    path(c, [[LED.x + 0.03, 0.62], [1.5, 0.62], [1.54, 0.66]]);
    path(c, [[a7, b7], [a7, 0.5], [0.97, 0.5]]); // → R2 → the button
    path(c, [[1.03, 0.5], [1.08, 0.5], [1.135, BTN.y + 0.04], [BTN.x - 0.09, BTN.y + 0.04]]);
    path(c, [[BTN.x + 0.09, BTN.y - 0.04], [1.585, BTN.y - 0.095]]);
    const [p0x, p0y] = pin(3, 0);
    path(c, [[p0x, p0y], [p0x, -0.05], [0.39, -0.05]]); // decoupling caps
    path(c, [[0.23, -0.05], [0.33, -0.05]]);
    [0, 1, 2].forEach((k, i) => {
      const [px, py] = pin(1, k);
      path(c, [[px, py], [0.1 - i * 0.12, py], [-0.1 - i * 0.12, py - 0.2], [-0.1 - i * 0.12, -0.55 - i * 0.06]]);
    });
    // SPI out to the display's flex connector
    FPC.pads.forEach((fy, i) => {
      const [px, py] = pin(1, 4 + i), tx = 0.1 + i * 0.06;
      path(c, [[px, py], [tx, py], [tx - (fy - py), fy], [FPC.x + 0.07, fy]]);
    });
    // a ground pour along the lower edge, stitched with vias
    c.globalAlpha = 0.6;
    c.fillRect(X(-1.62), Y(-0.93), L(1.5), L(0.08));
  });
  for (let i = 0; i < 9; i++) tented(P, X(-1.55 + i * 0.16), Y(-0.89), L(0.02));

  // gold: pads, fingers, fiducials
  gold(P, (c) => {
    for (let k = 0; k < 8; k++) {
      [0, 1].forEach((side) => { const [x, y] = pin(side, k); c.fillRect(X(x) - L(0.03), Y(y) - L(0.009), L(0.06), L(0.018)); });
      [2, 3].forEach((side) => { const [x, y] = pin(side, k); c.fillRect(X(x) - L(0.009), Y(y) - L(0.03), L(0.018), L(0.06)); });
    }
    const pad = (x, y, w, h) => c.fillRect(X(x - w / 2), Y(y + h / 2), L(w), L(h));
    PASSIVES.forEach(([x, y]) => { pad(x - 0.032, y, 0.034, 0.044); pad(x + 0.032, y, 0.034, 0.044); });
    CORNERS.forEach(([sx, sy]) => {
      pad(XTAL.x + sx * 0.085, XTAL.y + sy * 0.03, 0.04, 0.034);
      pad(BTN.x + sx * 0.09, BTN.y + sy * 0.04, 0.045, 0.03);
    });
    pad(LED.x - 0.03, LED.y, 0.03, 0.04);
    pad(LED.x + 0.03, LED.y, 0.03, 0.04);
    FPC.pads.forEach((fy) => pad(FPC.x + 0.065, fy, 0.04, 0.026));
    [-1, 1].forEach((s) => pad(FPC.x, FPC.y + s * 0.155, 0.09, 0.03));
    FINGERS.forEach((fy) => { c.beginPath(); c.roundRect(X(1.8), Y(fy + 0.045), L(0.36), L(0.09), L(0.015)); c.fill(); });
    [[1.55, 0.9], [-1.55, -0.62]].forEach(([x, y]) => { c.beginPath(); c.arc(X(x), Y(y), L(0.022), 0, Math.PI * 2); c.fill(); });
  });
  // fiducials sit in a clear ring of bare laminate
  layer(P.a, '#1c1a14', (c) => [[1.55, 0.9], [-1.55, -0.62]].forEach(([x, y]) => {
    c.lineWidth = L(0.012); c.beginPath(); c.arc(X(x), Y(y), L(0.04), 0, Math.PI * 2); c.stroke();
  }));
  [[0.34, 0.86], [-0.1, -0.55], [-0.22, -0.61], [-0.34, -0.67], [1.54, 0.66], [1.585, BTN.y - 0.095]].forEach(([x, y]) => ring(P, X(x), Y(y), L(0.022)));
  HOLES.forEach(([x, y]) => ring(P, X(x), Y(y), L(0.052), L(DRILL)));

  // contact shadows under the parts
  ao(P, X(CHIP.x), Y(CHIP.y), L(0.4), L(0.4), L(0.05));
  ao(P, X(TFT.x), Y(TFT.y), L(TFT.w), L(TFT.h), L(0.06));
  ao(P, X(MATRIX.x + (NAME.length - 1) * PITCH / 2), Y(MATRIX.y - 3 * PITCH), L(NAME.length * PITCH + 0.05), L(7 * PITCH + 0.05), L(0.04), 0.7);
  ao(P, X(FPC.x), Y(FPC.y), L(0.08), L(0.28), L(0.03));
  ao(P, X(XTAL.x), Y(XTAL.y), L(0.2), L(0.1), L(0.03));
  ao(P, X(BTN.x), Y(BTN.y), L(0.15), L(0.11), L(0.03));
  PASSIVES.forEach(([x, y]) => ao(P, X(x), Y(y), L(0.06), L(0.034), L(0.02), 0.7));

  // silkscreen: logo, name, refdes, header labels, outlines
  silk(P, (c) => {
    c.lineWidth = L(0.012);
    c.lineCap = 'butt';
    c.font = font(500, L(0.052), true);
    c.fillText('ROBOTICS · EMBEDDED SYSTEMS · COMPUTER VISION', X(EDGE), Y(-0.07));
    c.fillText('HB-26 · REV A · MUMBAI', X(EDGE), Y(-0.73));
    c.font = font(500, L(0.045), true);
    ['3V3', 'GND', 'TX', 'RX', 'IO0', 'EN'].forEach((t, k) => {
      const w = c.measureText(t).width;
      c.fillText(t, X(HOLES[k][0]) - w / 2, Y(-0.95));
    });
    c.strokeRect(X(0.0), Y(-0.69), L(1.24), L(0.22));
    c.strokeRect(X(HOLES[0][0] - 0.07), Y(-0.73), L(0.14), L(0.14)); // pin 1 gets a square
    [['U1', CHIP.x - 0.22, CHIP.y + 0.3], ['Y1', -0.05, 0.75], ['D1', 1.3, 0.73], ['J1', 1.4, -0.52], ['J2', 1.27, -0.83],
      ['C1', 0.17, -0.13], ['C2', 0.33, -0.13], ['LCD1', EDGE, 0.955], ['LED1', EDGE, 0.235], ['J3', FPC.x - 0.04, 0.765], ['R1', 0.96, 0.7], ['R2', 0.96, 0.42], ['SW1', BTN.x - 0.08, BTN.y + 0.12], ['BOOT', BTN.x - 0.08, BTN.y - 0.15]]
      .forEach(([t, x, y]) => c.fillText(t, X(x), Y(y)));
    c.strokeRect(X(CHIP.x - 0.26), Y(CHIP.y + 0.26), L(0.52), L(0.52));
    c.beginPath(); c.arc(X(CHIP.x - 0.3), Y(CHIP.y + 0.3), L(0.014), 0, Math.PI * 2); c.fill(); // pin 1
    // LED polarity
    c.beginPath(); c.moveTo(X(LED.x + 0.07), Y(LED.y + 0.035)); c.lineTo(X(LED.x + 0.07), Y(LED.y - 0.035)); c.stroke();
    c.font = font(600, L(0.05), true);
    c.fillText('USB', X(1.86), Y(0.36));
  });

  return P;
}

function backFace() {
  const P = surface();
  // drawn as the viewer sees the back: the tab is on the left
  const { X, Y, L } = toPx(-maxX);
  // an antenna coil around the edge, in copper under the mask
  copper(P, (c) => {
    c.lineWidth = L(0.016);
    for (let i = 0; i < 3; i++) {
      const d = 0.06 + i * 0.028;
      c.beginPath();
      c.roundRect(X(-W0 / 2 + d), Y(H0 / 2 - d), L(W0 - d * 2), L(H0 - d * 2), L(0.1));
      c.stroke();
    }
  });
  gold(P, (c) => FINGERS.forEach((fy) => {
    c.beginPath(); c.roundRect(X(-2.16), Y(fy + 0.045), L(0.36), L(0.09), L(0.015)); c.fill();
  }));
  HOLES.forEach(([x, y]) => ring(P, X(-x), Y(y), L(0.052), L(DRILL)));
  for (let i = 0; i < 9; i++) tented(P, X(1.55 - i * 0.16), Y(-0.89), L(0.02));

  // the QR is engraved as a field with the dark modules left standing in
  // mask, so it reads the right way round to a camera
  const { size, on } = qrMatrix();
  const q = 0.88, qx = 0.58, qy = 0.46, quiet = 3, cell = q / (size + quiet * 2);
  const gap = CARD.rows.length > 4 ? 0.245 : 0.3;
  // shallow, so the walls don't eat into the light modules; a 3-module quiet zone
  engrave(P, (c) => {
    c.fillRect(X(qx), Y(qy), L(q), L(q));
    c.globalCompositeOperation = 'destination-out';
    for (let r = 0; r < size; r++) for (let k = 0; k < size; k++) if (on(r, k)) c.fillRect(X(qx + (k + quiet) * cell), Y(qy - (r + quiet) * cell), L(cell) + 0.6, L(cell) + 0.6);
  }, 0.0015);
  engrave(P, (c) => {
    c.font = font(500, L(0.048), true);
    c.fillText('CONTACT', X(-1.36), Y(0.74));
    c.fillText('SCAN → PORTFOLIO', X(qx), Y(qy - q - 0.08));
    CARD.rows.forEach(([k, v], i) => {
      const y = 0.46 - i * gap;
      c.font = font(500, L(0.045), true);
      c.fillText(k.toUpperCase(), X(-1.36), Y(y));
      c.font = font(600, L(0.085), false);
      c.fillText(v, X(-1.36), Y(y - 0.12));
    });
    c.lineWidth = L(0.012);
    c.strokeRect(X(-1.42), Y(0.86), L(0.06), L(0.06));
  });

  silk(P, (c) => {
    // the same six holes, labelled from this side too
    c.font = font(500, L(0.036), true);
    ['3V3', 'GND', 'TX', 'RX', 'IO0', 'EN'].forEach((t, k) => {
      const w = c.measureText(t).width;
      c.fillText(t, X(-HOLES[k][0]) - w / 2, Y(-0.912));
    });
    c.font = font(500, L(0.042), true);
    c.fillText('HB-26 · ANT1 · SN 0001', X(qx), Y(-0.66));
    c.fillText('94V-0 · 2626', X(qx), Y(-0.74));
  });
  return P;
}

function uvRemap(geo, xMin) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - xMin) / SPANX, (p.getY(i) - minY) / SPANY);
  uv.needsUpdate = true;
}

// tileable value noise → a normal map: the clear coat's orange peel
function peel() {
  const n = 256, g = 16, data = new Uint8Array(n * n * 4);
  const grid = (m) => Array.from({ length: m * m }, rnd);
  const oct = [[g, grid(g), 1], [g * 2, grid(g * 2), 0.45]];
  const height = (x, y) => oct.reduce((s, [m, v, amp]) => {
    const fx = (x / n) * m, fy = (y / n) * m, ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const at = (i, j) => v[(j % m) * m + (i % m)];
    const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const bot = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
    return s + (top + (bot - top) * sy) * amp;
  }, 0);
  const H = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) H[y * n + x] = height(x, y);
  const h = (x, y) => H[((y + n) % n) * n + ((x + n) % n)];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (h(x - 1, y) - h(x + 1, y)) * 3, dy = (h(x, y - 1) - h(x, y + 1)) * 3;
    const l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    data[i] = ((dx / l) * 0.5 + 0.5) * 255;
    data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255;
    data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
    data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, n, n);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.repeat.set(SPANX * 1.2, SPANY * 1.2);
  t.needsUpdate = true;
  return t;
}

// where hands have been: the clear coat's gloss, smudged a little
function smudges(thumb) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = Math.round((512 * SPANY) / SPANX);
  const g = c.getContext('2d');
  g.fillStyle = 'rgb(0,24,0)';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 5; i++) {
    const x = rnd() * c.width, y = rnd() * c.height, r = 40 + rnd() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,70,0,0.5)');
    gr.addColorStop(1, 'rgba(0,70,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const [x, y] = thumb;
  g.save();
  g.translate(x * c.width, y * c.height);
  g.rotate(-0.5);
  g.strokeStyle = 'rgba(0,95,0,0.22)';
  g.lineWidth = 1.4;
  for (let r = 3; r < 30; r += 2.6) { g.beginPath(); g.ellipse(0, 0, r * 0.75, r, 0, 0.2, Math.PI * 2 - 0.4); g.stroke(); }
  g.restore();
  return new THREE.CanvasTexture(c);
}

// the routed edge: glass-fibre laminate, copper and mask lines at each face
function fr4() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#7a7155';
  g.fillRect(0, 0, 256, 64);
  for (let y = 4; y < 60; y++) {
    g.fillStyle = rnd() > 0.5 ? `rgba(255,248,215,${rnd() * 0.09})` : `rgba(30,26,12,${rnd() * 0.1})`;
    g.fillRect(0, y, 256, 1);
  }
  for (let i = 0; i < 500; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(255,250,225,0.18)' : 'rgba(20,18,10,0.2)';
    g.fillRect(rnd() * 256, 4 + rnd() * 56, 2 + rnd() * 10, 1);
  }
  g.fillStyle = '#0c0d0d';
  g.fillRect(0, 0, 256, 3);
  g.fillRect(0, 61, 256, 3);
  g.fillStyle = '#8a6a3e';
  g.fillRect(0, 3, 256, 1);
  g.fillRect(0, 60, 256, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  // side-wall v runs 1 − z across the board's depth; map exactly that band
  t.repeat.set(5, 1 / T);
  t.offset.set(0, -(1 - T + BEV) / T);
  return t;
}

/* The TFT's picture: drawn at the panel's 240×135, then spread over RGB
   subpixel stripes so it reads as a real LCD up close. */
function display(aniso) {
  const lw = 240, lh = 135;
  const src = Object.assign(document.createElement('canvas'), { width: lw, height: lh });
  const out = Object.assign(document.createElement('canvas'), { width: lw * 3, height: lh * 3 });
  const g = src.getContext('2d', { willReadFrequently: true }), o = out.getContext('2d');
  const img = o.createImageData(lw * 3, lh * 3), px = img.data;
  for (let i = 3; i < px.length; i += 4) px[i] = 255;
  const tex = new THREE.CanvasTexture(out);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  const total = INK.reduce((s, [, l]) => s + l, 0) + 9;
  const draw = (prog, cursor) => {
    g.fillStyle = '#07090b';
    g.fillRect(0, 0, lw, lh);
    g.font = '600 9px "Geist Mono", ui-monospace, monospace';
    g.fillStyle = '#62666d';
    g.fillText('HB-26', 8, 14);
    g.textAlign = 'right';
    g.fillText('READY', 222, 14);
    g.textAlign = 'left';
    g.fillStyle = '#ff5b14';
    g.beginPath(); g.arc(230, 11, 2.6, 0, Math.PI * 2); g.fill();
    // the mark draws itself, stroke by stroke
    const s = 2.5;
    g.save();
    g.translate(120 - 13.9 * s, 66 - 14 * s);
    g.scale(s, s);
    g.lineCap = 'square';
    let at = prog * total;
    const stroke = (d, len, style, width) => {
      const part = Math.max(0, Math.min(1, at / len));
      at -= len;
      if (!part) return;
      g.setLineDash([len * part, 999]);
      g.strokeStyle = style;
      g.lineWidth = width;
      g.stroke(new Path2D(d));
    };
    INK.forEach(([d, len]) => stroke(d, len, '#ecebe6', 2.6));
    stroke('M4 14h9', 9, '#ff5b14', 3.4);
    g.restore();
    g.font = '500 9px "Geist Mono", ui-monospace, monospace';
    g.fillStyle = '#8b8f96';
    const line = prog < 1 ? '> boot' : '> hello, world';
    g.fillText(line, 8, 126);
    if (cursor) g.fillRect(10 + g.measureText(line).width, 118, 5, 9);
    // subpixels: R, G, B stripes, with a dark row between pixel rows
    const d = g.getImageData(0, 0, lw, lh).data, W3 = lw * 3;
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const i = (y * lw + x) * 4;
      for (let j = 0; j < 3; j++) {
        const k = j === 2 ? 0.3 : 1, row = ((y * 3 + j) * W3 + x * 3) * 4;
        for (let c = 0; c < 3; c++) {
          const o4 = row + c * 4;
          px[o4] = d[i] * k * (c === 0 ? 1 : 0.28);
          px[o4 + 1] = d[i + 1] * k * (c === 1 ? 1 : 0.28);
          px[o4 + 2] = d[i + 2] * k * (c === 2 ? 1 : 0.28);
        }
      }
    }
    o.putImageData(img, 0, 0);
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

function flexArt() {
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 });
  const g = c.getContext('2d');
  g.fillStyle = '#c97a1c';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,214,150,0.55)';
  for (let i = 0; i < 8; i++) g.fillRect(0, 5 + i * 7.5, 64, 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function chipTop() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#161616';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = `rgba(255,255,255,${rnd() * 0.04})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1, 1);
  }
  // laser marking: lighter and rougher than the mould
  g.fillStyle = 'rgba(190,190,185,0.6)';
  g.font = font(600, 34, true);
  g.fillText('HB·MCU', 40, 118);
  g.font = font(500, 22, true);
  g.fillText('2626 A1', 40, 156);
  g.fillText('MUMBAI', 40, 186);
  // pin-1 dimple
  g.fillStyle = '#0b0b0b';
  g.beginPath(); g.arc(36, 36, 11, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function createPcbCard(canvas, { still = false } = {}) {
  await document.fonts?.ready;
  seed = 11;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // a dim studio: the mask stays black, the gloss and the gold still catch it
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 8.6);

  // a raking key light: long, soft shadows off every part
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(-6, 7, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 1, far: 20 });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.002;
  key.shadow.radius = 3;
  // a cool rim from behind picks the board out of the dark page
  const rim = new THREE.DirectionalLight(0xdfe6ff, 1.1);
  rim.position.set(4, 3, -5);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.15));

  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (canvasEl, srgb) => {
    const t = new THREE.CanvasTexture(canvasEl);
    t.anisotropy = aniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const coat = peel();
  const faceMat = ({ col, orm, bump }, thumb) => {
    const m = tex(orm, false);
    return new THREE.MeshPhysicalMaterial({
      map: tex(col, true), roughnessMap: m, metalnessMap: m, clearcoatMap: m,
      bumpMap: tex(bump, false), bumpScale: 1.4,
      roughness: 1, metalness: 1, clearcoat: 1,
      clearcoatRoughness: 1, clearcoatRoughnessMap: smudges(thumb),
      clearcoatNormalMap: coat, clearcoatNormalScale: new THREE.Vector2(0.022, 0.022),
      alphaTest: 0.5,
    });
  };

  const card = new THREE.Group();
  const flipper = new THREE.Group();
  flipper.add(card);
  scene.add(flipper);

  // board: routed fibreglass edge + two textured faces, holes drilled through both
  const edge = new THREE.ExtrudeGeometry(outline(false), {
    depth: T - BEV * 2, curveSegments: 12,
    bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelOffset: -BEV, bevelSegments: 2,
  });
  edge.translate(0, 0, -(T / 2 - BEV));
  const edgeTex = fr4();
  card.add(new THREE.Mesh(edge, [
    new THREE.MeshBasicMaterial({ visible: false }),
    new THREE.MeshStandardMaterial({ map: edgeTex, bumpMap: edgeTex, bumpScale: 0.6, roughness: 0.8 }),
  ]));
  const top = new THREE.ShapeGeometry(outline(false, BEV), 12);
  uvRemap(top, minX);
  const topMesh = new THREE.Mesh(top, faceMat(frontFace(), [0.86, 0.72]));
  topMesh.position.z = T / 2 + 0.0004;
  const bot = new THREE.ShapeGeometry(outline(true, BEV), 12);
  uvRemap(bot, -maxX);
  const botMesh = new THREE.Mesh(bot, faceMat(backFace(), [0.12, 0.3]));
  botMesh.rotation.y = Math.PI;
  botMesh.position.z = -T / 2 - 0.0004;
  topMesh.receiveShadow = botMesh.receiveShadow = true;
  card.add(topMesh, botMesh);

  // plated barrels inside the drilled holes
  const barrels = mergeGeometries(HOLES.map(([x, y]) => {
    const g = new THREE.CylinderGeometry(DRILL, DRILL, T + 0.001, 20, 1, true);
    g.rotateX(Math.PI / 2);
    g.translate(x, y, 0);
    return g;
  }));
  card.add(new THREE.Mesh(barrels, new THREE.MeshStandardMaterial({ color: '#8a6428', metalness: 1, roughness: 0.45, side: THREE.DoubleSide, envMapIntensity: 0.5 })));

  /* ── Parts ── */
  const z0 = T / 2;
  const tin = new THREE.MeshStandardMaterial({ color: '#d4d7da', metalness: 1, roughness: 0.3 });
  const nickel = new THREE.MeshStandardMaterial({ color: '#c9ccd0', metalness: 1, roughness: 0.2 });
  const mold = new THREE.MeshStandardMaterial({ color: '#181818', roughness: 0.66 });
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z0 + z);
    m.castShadow = m.receiveShadow = true;
    card.add(m);
    return m;
  };
  const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 2, r);

  // U1: a QFP, body plus 32 gull-wing leads soldered to their pads
  add(rbox(0.4, 0.4, 0.05, 0.008), mold, CHIP.x, CHIP.y, 0.026);
  const mark = add(new THREE.PlaneGeometry(0.38, 0.38), new THREE.MeshStandardMaterial({ map: chipTop(), roughness: 0.55 }), CHIP.x, CHIP.y, 0.0515);
  mark.castShadow = false;
  const lead = mergeGeometries([
    new THREE.BoxGeometry(0.024, 0.016, 0.006).translate(0.212, 0, 0.024),
    new THREE.BoxGeometry(0.006, 0.016, 0.024).translate(0.224, 0, 0.013),
    new THREE.BoxGeometry(0.03, 0.016, 0.006).translate(0.237, 0, 0.003),
  ]);
  const leads = [];
  for (let side = 0; side < 4; side++) for (let k = 0; k < 8; k++) {
    const off = -0.1575 + k * 0.045;
    const g = lead.clone().rotateZ([0, Math.PI, Math.PI / 2, -Math.PI / 2][side]);
    g.translate(side < 2 ? 0 : off, side < 2 ? off : 0, 0);
    leads.push(g);
  }
  add(mergeGeometries(leads), tin, CHIP.x, CHIP.y, 0);

  // Y1: a ceramic crystal can under a nickel lid
  add(rbox(0.2, 0.1, 0.014, 0.003), new THREE.MeshStandardMaterial({ color: '#d6ccb4', roughness: 0.6 }), XTAL.x, XTAL.y, 0.007);
  add(rbox(0.184, 0.086, 0.016, 0.005), nickel, XTAL.x, XTAL.y, 0.021);

  // 0603 passives: body, tinned end caps, a solder fillet on each pad
  const ceramic = new THREE.MeshStandardMaterial({ color: '#a4865a', roughness: 0.62 });
  const film = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.45 });
  PASSIVES.forEach(([x, y, kind]) => {
    add(rbox(0.05, 0.032, 0.02, 0.003), kind === 'cap' ? ceramic : film, x, y, 0.011);
    [-1, 1].forEach((s) => {
      add(rbox(0.012, 0.034, 0.022, 0.003), tin, x + s * 0.029, y, 0.011);
      add(new THREE.BoxGeometry(0.014, 0.04, 0.006), tin, x + s * 0.04, y, 0.003);
    });
  });

  // SW1: a tactile switch, steel frame and a black plunger
  add(rbox(0.15, 0.11, 0.024, 0.004), nickel, BTN.x, BTN.y, 0.012);
  const plunger = add(new THREE.CylinderGeometry(0.03, 0.03, 0.016, 28).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.5 }), BTN.x, BTN.y, 0.032);
  CORNERS.forEach(([sx, sy]) => add(new THREE.BoxGeometry(0.036, 0.018, 0.006), tin, BTN.x + sx * 0.09, BTN.y + sy * 0.04, 0.003));

  // D1: a status LED on a white package
  const white = new THREE.MeshStandardMaterial({ color: '#ece8de', roughness: 0.45 });
  add(rbox(0.064, 0.034, 0.012, 0.003), white, LED.x, LED.y, 0.006);
  const statusLed = add(rbox(0.05, 0.028, 0.01, 0.004), new THREE.MeshPhysicalMaterial({ color: '#ffb58c', emissive: '#ff5b14', emissiveIntensity: 1.2, roughness: 0.15, clearcoat: 1 }), LED.x, LED.y, 0.015);
  [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.012, 0.036, 0.006), tin, LED.x + s * 0.036, LED.y, 0.003));

  // LCD1: backlight frame, cover glass, the lit panel, and its amber flex
  add(rbox(TFT.w, TFT.h, 0.026, 0.01), new THREE.MeshStandardMaterial({ color: '#d8d8d4', roughness: 0.5 }), TFT.x, TFT.y, 0.013);
  add(rbox(TFT.w - 0.012, TFT.h - 0.012, 0.012, 0.004), new THREE.MeshPhysicalMaterial({ color: '#050607', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 }), TFT.x, TFT.y, 0.032);
  const screen = display(aniso);
  const panel = add(new THREE.PlaneGeometry(0.92, 0.5175), new THREE.MeshPhysicalMaterial({
    color: '#000', emissive: '#fff', emissiveMap: screen.tex, emissiveIntensity: 2.2,
    roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03,
  }), TFT.x - 0.035, TFT.y, 0.0385);
  panel.castShadow = false;
  const flex = new THREE.PlaneGeometry(0.2, 0.2, 16, 1);
  const fp = flex.attributes.position;
  for (let i = 0; i < fp.count; i++) {
    const u = (fp.getX(i) + 0.1) / 0.2;
    fp.setZ(i, 0.005 + 0.018 * (2 * u - 1) ** 2 - (u > 0.5 ? 0.004 : 0));
  }
  flex.computeVertexNormals();
  add(flex, new THREE.MeshPhysicalMaterial({ map: flexArt(), roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.94 }), TFT.x + TFT.w / 2 - 0.06 + 0.1, FPC.y, 0);
  // J3: the flex connector, with its brown locking flap
  add(rbox(0.08, 0.28, 0.026, 0.004), new THREE.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.55 }), FPC.x, FPC.y, 0.013);
  add(rbox(0.034, 0.28, 0.01, 0.003), new THREE.MeshStandardMaterial({ color: '#4a3220', roughness: 0.4 }), FPC.x + 0.02, FPC.y, 0.031);
  FPC.pads.forEach((fy) => add(new THREE.BoxGeometry(0.03, 0.012, 0.006), tin, FPC.x + 0.06, fy, 0.003));

  // LED1: a micro-LED matrix on its own black carrier, spelling the name
  const cols = NAME.length;
  const mw = cols * PITCH + 0.04, mh = 7 * PITCH + 0.04;
  const mcx = MATRIX.x + (cols - 1) * PITCH / 2, mcy = MATRIX.y - 3 * PITCH;
  add(rbox(mw, mh, 0.012, 0.004), new THREE.MeshPhysicalMaterial({ color: '#0e0f10', roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.1 }), mcx, mcy, 0.006);
  const count = cols * 7;
  const pkgs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.014, 0.014, 0.005), new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.35 }), count);
  const dies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.011, 0.011, 0.002), new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false }), count);
  const mtx = new THREE.Matrix4();
  for (let c = 0; c < cols; c++) for (let r = 0; r < 7; r++) {
    const i = c * 7 + r, x = MATRIX.x + c * PITCH, y = MATRIX.y - r * PITCH;
    pkgs.setMatrixAt(i, mtx.makeTranslation(x, y, z0 + 0.0145));
    dies.setMatrixAt(i, mtx.makeTranslation(x, y, z0 + 0.0175));
  }
  pkgs.castShadow = pkgs.receiveShadow = true;
  card.add(pkgs, dies);
  const LIT = new THREE.Color(1, 0.3, 0.05), DARK = new THREE.Color(0.045, 0.042, 0.038);
  let shown = -1;
  const light = (n) => {
    if (n === shown) return;
    shown = n;
    for (let c = 0; c < cols; c++) for (let r = 0; r < 7; r++) dies.setColorAt(c * 7 + r, c < n && NAME[c][r] ? LIT : DARK);
    dies.instanceColor.needsUpdate = true;
  };
  light(0);

  /* ── Motion ── */
  const state = { enter: 0, flip: 0, flipTo: 0, drag: 0, dragV: 0, tx: 0, ty: 0, px: 0, py: 0, press: 0 };
  let W = 0, H = 0, t = 0, raf = 0, visible = false, last = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    // supersample a little on 1x screens: the detail is fine
    renderer.setPixelRatio(coarse ? Math.min(devicePixelRatio, 1.75) : Math.max(1.5, Math.min(devicePixelRatio, 2)));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  const pose = () => {
    state.drag += state.dragV;
    state.dragV *= 0.92;
    state.px += (state.tx - state.px) * 0.08;
    state.py += (state.ty - state.py) * 0.08;
    state.flip += (state.flipTo - state.flip) * 0.085;
    const idle = still ? 0 : 1, out = 1 - state.enter;
    flipper.rotation.y = state.flip + state.drag + state.py + Math.sin(t * 0.6) * 0.1 * idle - 0.32 - out * 2.2;
    flipper.rotation.x = -0.22 + state.px + Math.sin(t * 0.8) * 0.03 * idle + out * 1.1;
    flipper.rotation.z = 0.05 - out * 0.5;
    flipper.position.y = Math.sin(t * 1.1) * 0.05 * idle - out * 3.2;
  };
  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    t += dt;
    statusLed.material.emissiveIntensity = Math.sin(t * 5) > 0.55 ? 2.4 : 0.15;
    boot();
    // the switch clicks down on a flip and springs back
    state.press *= 0.86;
    plunger.position.z = z0 + 0.032 - state.press * 0.009;
    pose();
    renderer.render(scene, camera);
  }
  // once the card has swung in: the logo draws on the screen, then the name types across the matrix
  let bootAt = still ? -99 : null, drawn = '';
  function boot() {
    const now = performance.now() / 1000; // wall time: the boot takes the same on any frame rate
    if (bootAt === null && state.enter > 0.85) bootAt = now;
    const since = bootAt === null ? 0 : now - bootAt;
    const prog = Math.min(1, Math.max(0, since / 1.5));
    const cursor = prog >= 1 && Math.floor(now / 0.53) % 2 === 0;
    const key = `${prog.toFixed(3)}${cursor}`;
    if (key !== drawn) { drawn = key; screen.draw(prog, cursor); }
    const n = Math.round(Math.min(1, Math.max(0, (since - 1.1) / 1.1)) * cols);
    light(n);
  }
  boot();

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
  const ro = new ResizeObserver(resize);
  resize();
  // compile shaders in parallel where the GPU allows, so the first frame doesn't stall the page
  await renderer.compileAsync(scene, camera);
  io.observe(canvas);
  ro.observe(canvas);

  // pointer: lean toward it; drag to spin; a tap flips
  let down = null, lastX = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    if (down) {
      state.dragV += (e.clientX - lastX) * 0.004;
      lastX = e.clientX;
      return;
    }
    if (e.pointerType !== 'mouse') return;
    state.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
    state.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.45;
  };
  const onDown = (e) => { down = [e.clientX, e.clientY]; lastX = e.clientX; };
  const onUp = (e) => {
    if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 7) {
      state.flipTo = state.flipTo ? 0 : Math.PI;
      state.press = 1;
      // settle any spin so the flip lands square
      state.drag = ((state.drag % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (state.drag > Math.PI) state.drag -= Math.PI * 2;
      state.dragV = 0;
      state.drag *= 0.2;
    }
    down = null;
  };
  const onLeave = () => { state.tx = 0; state.ty = 0; down = null; };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onLeave);

  return {
    // 0 → 1: the card swings up into place
    setEnter(v) { state.enter = v; },
    // both faces, rendered large, on one dark sheet
    async snapshot() {
      const out = document.createElement('canvas');
      out.width = 1800; out.height = 2440;
      const g = out.getContext('2d');
      g.fillStyle = '#0e0e0d';
      g.fillRect(0, 0, out.width, out.height);
      bootAt = -1e9;
      boot();
      const keep = { ...state }, keepPR = renderer.getPixelRatio();
      renderer.setPixelRatio(1);
      renderer.setSize(1700, 1100, false);
      camera.aspect = 1700 / 1100;
      // zoom rather than move closer, so reflections sit as they do live
      camera.zoom = 1.25;
      camera.updateProjectionMatrix();
      const shoot = (flip, y) => {
        flipper.rotation.set(-0.22, flip - 0.32, 0.05); // the resting pose
        flipper.position.y = 0;
        renderer.render(scene, camera);
        g.drawImage(renderer.domElement, 50, y);
      };
      shoot(0, 60);
      shoot(Math.PI, 1180);
      g.fillStyle = 'rgba(236,234,228,0.45)';
      g.font = font(500, 26, true);
      g.textAlign = 'center';
      g.fillText('HARSHBAVASKAR.GITHUB.IO/PORTFOLIO', out.width / 2, out.height - 60);
      Object.assign(state, keep);
      camera.zoom = 1;
      renderer.setPixelRatio(keepPR);
      resize();
      if (!visible) { pose(); renderer.render(scene, camera); }
      return new Promise((res) => out.toBlob(res, 'image/jpeg', 0.92));
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      scene.traverse((o) => {
        o.geometry?.dispose();
        [].concat(o.material || []).forEach((m) => {
          Object.values(m).forEach((v) => v?.isTexture && v.dispose());
          m.dispose();
        });
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
