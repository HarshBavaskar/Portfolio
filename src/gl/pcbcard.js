import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CARD, qrMatrix } from '../lib/card';

/*
  The contact card as a real circuit board: black solder mask with a clear
  coat over faint copper, gold (ENIG) pads and edge fingers, a fibreglass
  edge, and parts on top. The H of the silkscreen logo is crossed by a real
  orange LED. Lit by a studio environment so the gloss and the gold read.
*/

const W0 = 3.4, H0 = 2.14, T = 0.06, R = 0.13; // a bank card, 1.6 mm thick
const TAB = { w: 0.46, h: 0.62, r: 0.05 }; // USB-style edge tab
const minX = -W0 / 2, maxX = W0 / 2 + TAB.w, minY = -H0 / 2, maxY = H0 / 2;
const SPANX = maxX - minX, SPANY = maxY - minY;
const PX = 560; // texture pixels per unit

const GOLD = '#b8862f', MASK = '#0b0c0d', COPPER = '#191d1f', SILK = '#ecebe6';
const LOGO = { x: -1.45, y: 0.8, s: 0.34 / 28 }; // HB glyph origin + scale
const font = (w, px, mono) => `${w} ${px}px ${mono ? '"Geist Mono", ui-monospace, monospace' : 'Geist, "Helvetica Neue", Arial, sans-serif'}`;

function outline(mirror) {
  const m = (x) => (mirror ? -x : x);
  const x0 = -W0 / 2, x1 = W0 / 2, y0 = -H0 / 2, y1 = H0 / 2, r = R;
  const ty0 = -TAB.h / 2, ty1 = TAB.h / 2, tx1 = x1 + TAB.w, tr = TAB.r;
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

/* ── Textures: colour + an ORM-style map (R clearcoat, G roughness, B metal) ── */
function surface() {
  const make = () => {
    const c = document.createElement('canvas');
    c.width = Math.round(SPANX * PX);
    c.height = Math.round(SPANY * PX);
    return c;
  };
  const col = make(), orm = make();
  const a = col.getContext('2d'), b = orm.getContext('2d');
  a.fillStyle = MASK;
  a.fillRect(0, 0, col.width, col.height);
  b.fillStyle = 'rgb(255,120,0)'; // mask: satin under a clear coat
  b.fillRect(0, 0, orm.width, orm.height);
  // faint speckle in the mask
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9000; i++) {
    a.fillStyle = `rgba(255,255,255,${rnd() * 0.025})`;
    a.fillRect(rnd() * col.width, rnd() * col.height, 1.5, 1.5);
  }
  return { col, orm, a, b };
}

// board units → canvas pixels, for a face drawn as the viewer sees it
const toPx = (vxMin) => ({ X: (x) => (x - vxMin) * PX, Y: (y) => (maxY - y) * PX, L: (u) => u * PX });

function gold(a, b, draw) {
  a.fillStyle = GOLD;
  a.strokeStyle = GOLD;
  draw(a);
  b.fillStyle = 'rgb(0,105,255)';
  b.strokeStyle = 'rgb(0,105,255)';
  draw(b);
}
function silk(a, b, draw) {
  a.fillStyle = SILK;
  a.strokeStyle = SILK;
  draw(a);
  b.fillStyle = 'rgb(40,170,0)';
  b.strokeStyle = 'rgb(40,170,0)';
  draw(b);
}
function copper(a, draw) {
  a.save();
  a.strokeStyle = COPPER;
  a.fillStyle = COPPER;
  a.lineCap = 'round';
  a.lineJoin = 'round';
  draw(a);
  a.restore();
}
function hole(a, b, x, y, r) {
  gold(a, b, (c) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
  a.fillStyle = '#030303';
  a.beginPath(); a.arc(x, y, r * 0.52, 0, Math.PI * 2); a.fill();
  b.fillStyle = 'rgb(0,230,0)';
  b.beginPath(); b.arc(x, y, r * 0.52, 0, Math.PI * 2); b.fill();
}

function frontFace() {
  const { col, orm, a, b } = surface();
  const { X, Y, L } = toPx(minX);
  const chip = { x: 0.62, y: 0.22, s: 0.44 };
  const pin = (side, k) => {
    const off = -0.1575 + k * 0.045;
    const e = chip.s / 2 + 0.03;
    return [[chip.x + e, chip.y + off], [chip.x - e, chip.y + off], [chip.x + off, chip.y + e], [chip.x + off, chip.y - e]][side];
  };
  const holes = Array.from({ length: 6 }, (_, k) => [0.12 + k * 0.2, -0.8]);
  const fingers = [-0.2, -0.067, 0.067, 0.2];

  // copper under the mask: routed traces with 45° bends
  copper(a, (c) => {
    c.lineWidth = L(0.02);
    const path = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.stroke(); };
    fingers.forEach((fy, k) => {
      const [px, py] = pin(0, 2 + k);
      path([[px, py], [1.12, py], [1.12 + Math.abs(fy - py), fy], [1.78, fy]]);
    });
    holes.forEach(([hx, hy], k) => {
      const [px, py] = pin(3, 1 + k);
      path([[px, py], [px, -0.3], [hx, -0.3 - Math.abs(hx - px)], [hx, hy]]);
    });
    [[pin(2, 1), [0.1, 0.62]], [pin(2, 6), [1.38, 0.62]], [pin(2, 3), [0.34, 0.86]]].forEach(([[px, py], [tx, ty]]) => {
      path([[px, py], [px, ty - Math.abs(tx - px) * 0.4], [tx, ty]]);
    });
    [2, 4, 6].forEach((k, i) => {
      const [px, py] = pin(1, k);
      path([[px, py], [0.1 - i * 0.12, py], [-0.1 - i * 0.12, py - 0.2], [-0.1 - i * 0.12, -0.55 - i * 0.06]]);
    });
    // a copper pour along the lower edge, stitched with vias
    c.globalAlpha = 0.55;
    c.fillRect(X(-1.62), Y(-0.93), L(1.5), L(0.08));
    c.globalAlpha = 1;
  });
  for (let i = 0; i < 9; i++) hole(a, b, X(-1.55 + i * 0.16), Y(-0.89), L(0.018));

  // gold: chip pads, header, fingers, fiducials, test points
  gold(a, b, (c) => {
    for (let k = 0; k < 8; k++) {
      [0, 1].forEach((side) => { const [x, y] = pin(side, k); c.fillRect(X(x) - L(0.03), Y(y) - L(0.009), L(0.06), L(0.018)); });
      [2, 3].forEach((side) => { const [x, y] = pin(side, k); c.fillRect(X(x) - L(0.009), Y(y) - L(0.03), L(0.018), L(0.06)); });
    }
    c.fillRect(X(chip.x - 0.13), Y(chip.y + 0.13), L(0.26), L(0.26)); // exposed pad, under the chip
    fingers.forEach((fy) => {
      c.beginPath();
      c.roundRect(X(1.8), Y(fy + 0.045), L(0.36), L(0.09), L(0.015));
      c.fill();
    });
    [[1.55, 0.9], [-1.55, -0.62]].forEach(([x, y]) => { c.beginPath(); c.arc(X(x), Y(y), L(0.022), 0, Math.PI * 2); c.fill(); });
  });
  holes.forEach(([x, y]) => hole(a, b, X(x), Y(y), L(0.05)));
  [[0.34, 0.86], [-0.34, -0.61], [-0.46, -0.67]].forEach(([x, y]) => hole(a, b, X(x), Y(y), L(0.022)));

  // silkscreen: logo, name, refdes, header labels, outlines
  silk(a, b, (c) => {
    c.lineWidth = L(0.012);
    // the HB mark; its crossbar is left for the LED
    c.save();
    c.translate(X(LOGO.x), Y(LOGO.y));
    c.scale(LOGO.s * PX, LOGO.s * PX);
    c.lineWidth = 2.6;
    c.lineCap = 'square';
    ['M4 3.5v21', 'M13 3.5v21', 'M13 3.5h4.5a5.25 5.25 0 0 1 0 10.5H13', 'M13 14h5.5a5.25 5.25 0 0 1 0 10.5H13'].forEach((d) => c.stroke(new Path2D(d)));
    c.restore();

    c.font = font(700, L(0.17), false);
    c.fillText(CARD.name.toUpperCase(), X(-1.46), Y(-0.2));
    c.font = font(500, L(0.052), true);
    c.fillText('ROBOTICS · EMBEDDED SYSTEMS · COMPUTER VISION', X(-1.45), Y(-0.34));
    c.fillText('HB-26 · REV A · MUMBAI', X(-1.45), Y(-0.73));
    c.font = font(500, L(0.045), true);
    ['3V3', 'GND', 'TX', 'RX', 'IO0', 'EN'].forEach((t, k) => {
      const w = c.measureText(t).width;
      c.fillText(t, X(holes[k][0]) - w / 2, Y(-0.95));
    });
    c.strokeRect(X(0.0), Y(-0.69), L(1.24), L(0.22));
    [['U1', chip.x - 0.22, chip.y + 0.3], ['Y1', -0.05, 0.75], ['D1', 1.3, 0.73], ['J1', 1.4, -0.52], ['J2', -0.02, -0.63], ['C1', 0.2, -0.12], ['C2', 0.36, -0.12], ['R1', 1.0, 0.72]].forEach(([t, x, y]) => c.fillText(t, X(x), Y(y)));
    c.strokeRect(X(chip.x - 0.26), Y(chip.y + 0.26), L(0.52), L(0.52));
    c.beginPath(); c.arc(X(chip.x - 0.3), Y(chip.y + 0.3), L(0.014), 0, Math.PI * 2); c.fill(); // pin 1
    c.font = font(600, L(0.05), true);
    c.fillText('USB', X(1.86), Y(0.36));
  });

  return { col, orm };
}

function backFace() {
  const { col, orm, a, b } = surface();
  // drawn as the viewer sees the back: the tab is on the left
  const { X, Y, L } = toPx(-maxX);
  // an antenna coil around the edge, in copper under the mask
  copper(a, (c) => {
    c.lineWidth = L(0.018);
    for (let i = 0; i < 4; i++) {
      const d = 0.1 + i * 0.045;
      c.beginPath();
      c.roundRect(X(-W0 / 2 + d), Y(H0 / 2 - d), L(W0 - d * 2), L(H0 - d * 2), L(0.1));
      c.stroke();
    }
  });
  gold(a, b, (c) => [-0.2, -0.067, 0.067, 0.2].forEach((fy) => {
    c.beginPath(); c.roundRect(X(-2.16), Y(fy + 0.045), L(0.36), L(0.09), L(0.015)); c.fill();
  }));

  // QR: silkscreen ground, mask modules, so it scans the right way round
  const { size, on } = qrMatrix();
  const q = 0.84, qx = 0.6, qy = 0.44, cell = q / (size + 2);
  silk(a, b, (c) => c.fillRect(X(qx), Y(qy), L(q), L(q)));
  a.fillStyle = MASK;
  for (let r = 0; r < size; r++) for (let k = 0; k < size; k++) if (on(r, k)) a.fillRect(X(qx + (k + 1) * cell), Y(qy - (r + 1) * cell), L(cell) + 0.6, L(cell) + 0.6);

  silk(a, b, (c) => {
    c.font = font(500, L(0.048), true);
    c.fillText('CONTACT', X(-1.36), Y(0.74));
    c.fillText('SCAN → PORTFOLIO', X(qx), Y(qy - q - 0.1));
    CARD.rows.forEach(([k, v], i) => {
      const y = 0.46 - i * 0.3;
      c.font = font(500, L(0.045), true);
      c.fillText(k.toUpperCase(), X(-1.36), Y(y));
      c.font = font(600, L(0.085), false);
      c.fillText(v, X(-1.36), Y(y - 0.12));
    });
    c.font = font(500, L(0.042), true);
    c.fillText('HB-26 · ANT1 · SN 0001', X(-1.36), Y(-0.86));
    c.lineWidth = L(0.01);
    c.strokeRect(X(-1.42), Y(0.86), L(0.06), L(0.06));
  });
  return { col, orm };
}

function uvRemap(geo, xMin) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - xMin) / SPANX, (p.getY(i) - minY) / SPANY);
  uv.needsUpdate = true;
}

function chipTop() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#141414';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(210,210,205,0.55)';
  g.font = font(600, 34, true);
  g.fillText('HB·MCU', 40, 110);
  g.font = font(500, 24, true);
  g.fillText('2626 A1', 40, 150);
  g.fillText('MUMBAI', 40, 182);
  g.beginPath(); g.arc(34, 34, 9, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function createPcbCard(canvas, { still = false } = {}) {
  await document.fonts?.ready;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // a dim studio: the mask stays black, the gloss and the gold still catch it
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 9.2);

  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(-6, 7, 2.5);
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
  const faceMat = ({ col, orm }) => {
    const m = tex(orm, false);
    return new THREE.MeshPhysicalMaterial({
      map: tex(col, true), roughnessMap: m, metalnessMap: m, clearcoatMap: m,
      roughness: 1, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.12,
    });
  };

  const card = new THREE.Group();
  const flipper = new THREE.Group();
  flipper.add(card);
  scene.add(flipper);

  // board: fibreglass edge + two textured faces
  const edge = new THREE.ExtrudeGeometry(outline(false), { depth: T, bevelEnabled: false, curveSegments: 10 });
  edge.translate(0, 0, -T / 2);
  card.add(new THREE.Mesh(edge, [new THREE.MeshBasicMaterial({ visible: false }), new THREE.MeshStandardMaterial({ color: '#77705a', roughness: 0.75 })]));
  const top = new THREE.ShapeGeometry(outline(false), 10);
  uvRemap(top, minX);
  const topMesh = new THREE.Mesh(top, faceMat(frontFace()));
  topMesh.position.z = T / 2 + 0.0006;
  const bot = new THREE.ShapeGeometry(outline(true), 10);
  uvRemap(bot, -maxX);
  const botMesh = new THREE.Mesh(bot, faceMat(backFace()));
  botMesh.rotation.y = Math.PI;
  botMesh.position.z = -T / 2 - 0.0006;
  card.add(topMesh, botMesh);

  // parts on top
  const z0 = T / 2;
  const part = (w, h, d, mat, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z0 + d / 2);
    card.add(m);
    return m;
  };
  const mold = new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.55 });
  part(0.44, 0.44, 0.045, [mold, mold, mold, mold, new THREE.MeshStandardMaterial({ map: chipTop(), roughness: 0.6 }), mold], 0.62, 0.22);
  part(0.22, 0.1, 0.045, new THREE.MeshStandardMaterial({ color: '#d9dcdf', metalness: 1, roughness: 0.28 }), 0.1, 0.62);
  const ceramic = new THREE.MeshStandardMaterial({ color: '#a8895a', roughness: 0.6 });
  const resist = new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.5 });
  [[0.2, -0.05, ceramic], [0.36, -0.05, ceramic], [1.0, 0.62, resist], [1.0, 0.5, resist]].forEach(([x, y, m]) => part(0.075, 0.038, 0.024, m, x, y));

  // LEDs: the logo's crossbar, and a blinking status light
  const ledMat = () => new THREE.MeshStandardMaterial({ color: '#ffb58c', emissive: '#ff5b14', emissiveIntensity: 1.2, roughness: 0.3 });
  const logoLed = part(9 * LOGO.s, 0.042, 0.022, ledMat(), LOGO.x + 8.5 * LOGO.s, LOGO.y - 14 * LOGO.s);
  const statusLed = part(0.07, 0.04, 0.022, ledMat(), 1.38, 0.62);
  const spill = new THREE.PointLight('#ff6a24', 0.35, 0.9, 2);
  spill.position.set(LOGO.x + 8.5 * LOGO.s, LOGO.y - 14 * LOGO.s, z0 + 0.12);
  card.add(spill);

  /* ── Motion ── */
  const state = { enter: 0, flip: 0, flipTo: 0, drag: 0, dragV: 0, tx: 0, ty: 0, px: 0, py: 0 };
  let W = 0, H = 0, t = 0, raf = 0, visible = false, last = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.75 : 2));
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
    const blink = Math.sin(t * 5) > 0.55 ? 2.4 : 0.15;
    statusLed.material.emissiveIntensity = blink;
    logoLed.material.emissiveIntensity = 1.1 + Math.sin(t * 1.6) * 0.35;
    spill.intensity = 0.28 + Math.sin(t * 1.6) * 0.1;
    pose();
    renderer.render(scene, camera);
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
  const ro = new ResizeObserver(resize);
  resize();
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
      const keep = { ...state }, keepPR = renderer.getPixelRatio();
      renderer.setPixelRatio(1);
      renderer.setSize(1700, 1100, false);
      camera.aspect = 1700 / 1100;
      // zoom rather than move closer, so reflections sit as they do live
      camera.zoom = 1.3;
      camera.updateProjectionMatrix();
      const shoot = (flip, y) => {
        Object.assign(state, { flip, flipTo: flip, drag: 0, dragV: 0, tx: 0, ty: 0, px: 0, py: 0 });
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
      if (!visible) { pose(); renderer.render(scene, camera); }
      renderer.setPixelRatio(keepPR);
      resize();
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
      scene.traverse((o) => { o.geometry?.dispose(); });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
