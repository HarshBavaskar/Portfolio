import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/*
  The toolkit as a piece of hardware, rendered: a bead-blasted aluminium
  body with chamfered cut-outs, a recessed keyboard well, PBT keycaps with
  printed legends that travel when pressed, a glass screen, and a knurled
  bank knob. Lit by a studio environment and a key light that casts real
  shadows: keys onto the well, the unit onto the desk it sits on.

  Two builds: the wide board for desktop, and a compact unit for phones
  with two screens (the skill, and the live bank's list) over six bank
  keys. Press a bank's key again to step through its skills, or touch
  a skill on the list.
*/

const SANS = 'Geist, "Helvetica Neue", Arial, sans-serif';
const MONO = '"Geist Mono", ui-monospace, monospace';
const coarse = matchMedia('(pointer: coarse)').matches;
const breathe = () => new Promise((r) => setTimeout(r, 0));

function rr(p, x, y, w, h, r) {
  // a rounded rectangle, centred on (x, y), drawn into a Shape or Path
  const x0 = x - w / 2, y0 = y - h / 2, x1 = x + w / 2, y1 = y + h / 2;
  p.moveTo(x0 + r, y0);
  p.lineTo(x1 - r, y0);
  p.quadraticCurveTo(x1, y0, x1, y0 + r);
  p.lineTo(x1, y1 - r);
  p.quadraticCurveTo(x1, y1, x1 - r, y1);
  p.lineTo(x0 + r, y1);
  p.quadraticCurveTo(x0, y1, x0, y1 - r);
  p.lineTo(x0, y0 + r);
  p.quadraticCurveTo(x0, y0, x0 + r, y0);
  return p;
}

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// bead-blast: fine grey noise, used for roughness and a whisper of bump
function grain(n = 256) {
  const c = Object.assign(document.createElement('canvas'), { width: n, height: n });
  const g = c.getContext('2d');
  const img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + rnd() * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// knurling for the knob's side
function knurl() {
  const c = Object.assign(document.createElement('canvas'), { width: 512, height: 8 });
  const g = c.getContext('2d');
  for (let x = 0; x < 512; x += 8) {
    const grd = g.createLinearGradient(x, 0, x + 8, 0);
    grd.addColorStop(0, '#303030');
    grd.addColorStop(0.5, '#d0d0d0');
    grd.addColorStop(1, '#303030');
    g.fillStyle = grd;
    g.fillRect(x, 0, 8, 8);
  }
  return new THREE.CanvasTexture(c);
}

// printed text on a transparent sheet; the material's colour is the ink
function printed(w, h, draw, px = 220) {
  const c = Object.assign(document.createElement('canvas'), { width: Math.ceil(w * px), height: Math.ceil(h * px) });
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  draw(g, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { t, c, g };
}

/* ── Layout ─────────────────────────────────────────────── */
function measure(text) {
  const g = document.createElement('canvas').getContext('2d');
  g.font = `500 100px ${SANS}`;
  return g.measureText(text).width / 100;
}

function layout(banks, compact) {
  const KH = 0.58, GAP = 0.1;
  if (!compact) {
    const BW = 12.4, BH = 7.6;
    const well = { x: 0, y: -1.02, w: 11.7, h: 4.56 };
    const rowY = (r) => 0.82 - r * 0.7;
    const keys = [], cats = [];
    banks.forEach((b, r) => {
      const y = rowY(r);
      cats.push({ c: r, x: -4.72, y, w: 1.86, h: KH });
      const x0 = -3.66, x1 = 5.72;
      const nat = b.keys.map(([k]) => measure(k) * 0.2 + 0.46);
      const scale = (x1 - x0 - GAP * (nat.length - 1)) / nat.reduce((a, v) => a + v, 0);
      let x = x0;
      nat.forEach((v, i) => {
        const w = v * scale;
        keys.push({ c: r, i, x: x + w / 2, y, w, h: KH });
        x += w + GAP;
      });
    });
    return {
      BW, BH, R: 0.5, tilt: -0.56, well, keys, cats,
      screen: { x: -0.62, y: 2.42, w: 10.3, h: 1.9 },
      knob: { x: 5.22, y: 2.42, r: 0.56 },
      foot: { y: -3.58 },
      screws: [[-5.85, 3.45], [5.85, 3.45], [-5.85, -3.45], [5.85, -3.45]],
    };
  }
  // phones: two screens (the skill, and the bank's list) over six bank keys
  const BW = 5.9, BH = 9.4;
  const cats = banks.map((b, r) => ({ c: r, x: -1.84 + (r % 3) * 1.84, y: -1.44 - Math.floor(r / 3) * 0.78, w: 1.74, h: 0.66 }));
  return {
    BW, BH, R: 0.46, tilt: -0.3, keys: [], cats,
    well: { x: 0, y: -1.83, w: 5.5, h: 1.84 },
    screen: { x: 0, y: 3.5, w: 5.4, h: 1.6 },
    list: { x: 0, y: 1.13, w: 5.4, h: 2.84 },
    knob: null,
    foot: { y: -3.2 },
    grille: { x: 0, y: -3.95, w: 3.6, h: 0.5 },
    screws: [[-2.62, 4.35], [2.62, 4.35], [-2.62, -4.35], [2.62, -4.35]],
  };
}

/* ── The screen ─────────────────────────────────────────── */
function display(banks, w, h) {
  const DW = 2048, DH = Math.round((2048 * h) / w);
  const c = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const pad = Math.min(DW * 0.035, DH * 0.14);
  const draw = (c0, i0, name) => {
    const bg = g.createRadialGradient(DW * 0.4, DH * 0.2, 0, DW * 0.4, DH * 0.2, DW * 0.8);
    bg.addColorStop(0, '#1a1c1b');
    bg.addColorStop(1, '#0c0d0d');
    g.fillStyle = bg;
    g.fillRect(0, 0, DW, DH);
    const small = Math.max(28, DH * 0.085);
    g.font = `500 ${small}px ${MONO}`;
    g.fillStyle = '#8c908b';
    g.textBaseline = 'top';
    g.fillText(`${String(c0 + 1).padStart(2, '0')}.${String(i0 + 1).padStart(2, '0')} / ${banks[c0].cat.toUpperCase()}`, pad, pad);
    // bank meter: one bar per bank, the live one lit
    banks.forEach((b, k) => {
      const bw = small * 0.36, bh = small * (0.5 + b.keys.length * 0.09);
      g.fillStyle = k === c0 ? '#ff5b14' : '#4a4d4a';
      g.fillRect(DW - pad - (banks.length - k) * bw * 1.7, pad + small - bh, bw, bh);
    });
    const big = Math.min(DH * 0.36, DW * 0.11);
    g.font = `500 ${big}px ${SANS}`;
    g.fillStyle = '#ecebe6';
    g.textBaseline = 'alphabetic';
    g.fillText(name, pad, DH * 0.47 + big * 0.36);
    g.font = `500 ${small * 0.92}px ${MONO}`;
    g.fillStyle = '#8c908b';
    g.textBaseline = 'bottom';
    const note = banks[c0].keys[i0][1].toUpperCase();
    g.fillText(note, pad, DH - pad, DW - pad * 2);
    // the LCD's pixel grid, faintly
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < DH; y += 4) g.fillRect(0, y, DW, 1);
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

// the second screen: the live bank's skills, the selected one lit
function listing(banks, w, h) {
  const DW = 1536, DH = Math.round((1536 * h) / w);
  const c = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const pad = DW * 0.05, head = DH * 0.14;
  const geo = (n) => {
    const per = Math.ceil(n / 2), rowH = (DH - head - pad * 1.4) / per, colW = (DW - pad * 2.6) / 2;
    return { per, rowH, colW };
  };
  const draw = (c0, i0) => {
    const keys = banks[c0].keys;
    g.fillStyle = '#0e0f0f';
    g.fillRect(0, 0, DW, DH);
    const small = DH * 0.052;
    g.font = `500 ${small}px ${MONO}`;
    g.textBaseline = 'middle';
    g.fillStyle = '#8c908b';
    g.fillText(banks[c0].cat.toUpperCase(), pad, pad + small / 2);
    g.textAlign = 'right';
    g.fillText(`${keys.length} SKILLS`, DW - pad, pad + small / 2);
    g.textAlign = 'left';
    const { per, rowH, colW } = geo(keys.length);
    keys.forEach(([name], k) => {
      const col = Math.floor(k / per), row = k % per;
      const x = pad + col * (colW + pad * 0.6), y = head + pad * 0.4 + row * rowH;
      const on = k === i0;
      if (on) {
        g.fillStyle = '#ff5b14';
        g.beginPath();
        g.roundRect(x - pad * 0.3, y + rowH * 0.1, colW + pad * 0.3, rowH * 0.8, rowH * 0.18);
        g.fill();
      }
      g.font = `500 ${small * 0.8}px ${MONO}`;
      g.fillStyle = on ? 'rgba(18,18,18,0.7)' : '#5d615d';
      g.fillText(String(k + 1).padStart(2, '0'), x, y + rowH / 2);
      g.font = `500 ${Math.min(rowH * 0.36, DH * 0.075)}px ${SANS}`;
      g.fillStyle = on ? '#121212' : '#e4e3dd';
      g.fillText(name, x + small * 1.9, y + rowH / 2, colW - small * 2.2);
    });
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < DH; y += 4) g.fillRect(0, y, DW, 1);
    tex.needsUpdate = true;
  };
  // which skill sits under a point on the screen (uv, 0..1)
  const at = (c0, u, v) => {
    const n = banks[c0].keys.length, { per, rowH, colW } = geo(n);
    const x = u * DW, y = (1 - v) * DH;
    const col = x > pad + colW + pad * 0.3 ? 1 : 0;
    const row = Math.floor((y - head - pad * 0.4) / rowH);
    const k = col * per + row;
    return row >= 0 && row < per && k < n ? k : -1;
  };
  return { tex, draw, at };
}

/* ── The build ──────────────────────────────────────────── */
export async function createConsole(canvas, { banks, compact = false, onPick } = {}) {
  await document.fonts?.ready;
  seed = 7;
  const L = layout(banks, compact);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = compact ? 0.4 : 0.5;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);

  // light from above-left-front: soft, long shadows across the keys
  const key = new THREE.DirectionalLight(0xfff7ee, compact ? 1.5 : 2.3);
  key.position.set(-5, 9, 10);
  key.castShadow = true;
  const sm = coarse ? 1024 : 2048;
  key.shadow.mapSize.set(sm, sm);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 0.35));

  const unit = new THREE.Group(); // tilt + entrance
  scene.add(unit);

  /* body: aluminium, with the screen window, the key well (and the knob's seat) cut through */
  const T = 0.42, BEV = 0.06;
  const shape = rr(new THREE.Shape(), 0, 0, L.BW, L.BH, L.R);
  shape.holes.push(rr(new THREE.Path(), L.screen.x, L.screen.y, L.screen.w, L.screen.h, 0.16));
  shape.holes.push(rr(new THREE.Path(), L.well.x, L.well.y, L.well.w, L.well.h, 0.22));
  if (L.list) shape.holes.push(rr(new THREE.Path(), L.list.x, L.list.y, L.list.w, L.list.h, 0.16));
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: T - BEV * 2, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelOffset: -BEV, bevelSegments: 3, curveSegments: 10 });
  bodyGeo.translate(0, 0, -T + BEV);
  const blast = grain();
  blast.repeat.set(L.BW / 1.2, L.BH / 1.2);
  const alu = new THREE.MeshPhysicalMaterial({
    color: '#c4c5c1', metalness: 0.82, roughness: 0.46, roughnessMap: blast, bumpMap: blast, bumpScale: 0.08,
    clearcoat: 0.15, clearcoatRoughness: 0.5,
  });
  // the extrude's UVs are in world units: scale them to the grain
  const uv = bodyGeo.attributes.uv;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) / L.BW, uv.getY(k) / L.BH);
  const body = new THREE.Mesh(bodyGeo, alu);
  body.castShadow = body.receiveShadow = true;
  unit.add(body);

  // the base closes the unit from below
  const base = new THREE.Mesh(new THREE.ShapeGeometry(rr(new THREE.Shape(), 0, 0, L.BW - 0.1, L.BH - 0.1, L.R)), new THREE.MeshStandardMaterial({ color: '#202020' }));
  base.position.z = -T + 0.02;
  unit.add(base);

  // the key well's floor: dark anodised, a few millimetres down
  const floor = new THREE.Mesh(new RoundedBoxGeometry(L.well.w, L.well.h, 0.06, 2, 0.05), new THREE.MeshPhysicalMaterial({ color: '#1f201f', metalness: 0.5, roughness: 0.62, roughnessMap: blast }));
  floor.position.set(L.well.x, L.well.y, -0.26);
  floor.receiveShadow = true;
  unit.add(floor);

  /* the screen: a glass window over a lit panel */
  const disp = display(banks, L.screen.w - 0.3, L.screen.h - 0.3);
  const screenBack = new THREE.Mesh(new RoundedBoxGeometry(L.screen.w, L.screen.h, 0.08, 2, 0.14), new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.7 }));
  screenBack.position.set(L.screen.x, L.screen.y, -0.2);
  unit.add(screenBack);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(L.screen.w - 0.3, L.screen.h - 0.3), new THREE.MeshPhysicalMaterial({
    color: '#000', emissive: '#fff', emissiveMap: disp.tex, emissiveIntensity: 1.25, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04,
  }));
  panel.position.set(L.screen.x, L.screen.y, -0.155);
  panel.receiveShadow = true;
  unit.add(panel);
  let list = null, listPanel = null;
  if (L.list) {
    list = listing(banks, L.list.w - 0.3, L.list.h - 0.3);
    const back = new THREE.Mesh(new RoundedBoxGeometry(L.list.w, L.list.h, 0.08, 2, 0.14), new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.7 }));
    back.position.set(L.list.x, L.list.y, -0.2);
    listPanel = new THREE.Mesh(new THREE.PlaneGeometry(L.list.w - 0.3, L.list.h - 0.3), new THREE.MeshPhysicalMaterial({
      color: '#000', emissive: '#fff', emissiveMap: list.tex, emissiveIntensity: 1.25, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04,
    }));
    listPanel.position.set(L.list.x, L.list.y, -0.155);
    unit.add(back, listPanel);
  }

  /* keycaps: PBT, printed legends */
  const pbt = new THREE.MeshPhysicalMaterial({ color: '#e9e6de', roughness: 0.74, roughnessMap: blast, clearcoat: 0.08 });
  const dark = new THREE.MeshPhysicalMaterial({ color: '#181918', roughness: 0.55, roughnessMap: blast, clearcoat: 0.12 });
  const orange = new THREE.MeshPhysicalMaterial({ color: '#ff5b14', roughness: 0.55, roughnessMap: blast, clearcoat: 0.12 });
  const CAP = 0.32, REST = -0.26 + 0.03 + CAP / 2; // resting on the well floor
  const caps = [];
  const makeCap = (spec, label, mono) => {
    const g = new THREE.Group();
    const cap = new THREE.Mesh(new RoundedBoxGeometry(spec.w, spec.h, CAP, 3, 0.08), pbt);
    cap.castShadow = cap.receiveShadow = true;
    const ink = printed(spec.w - 0.1, spec.h - 0.12, () => {});
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(spec.w - 0.1, spec.h - 0.12), new THREE.MeshBasicMaterial({ map: ink.t, transparent: true, color: '#1d1c1a', depthWrite: false, toneMapped: false }));
    lg.position.z = CAP / 2 + 0.002;
    g.add(cap, lg);
    g.position.set(spec.x, spec.y, REST);
    unit.add(g);
    const item = { ...spec, g, cap, lg, ink, mono, rest: REST, label: '' };
    item.setLabel = (text) => {
      if (item.label === text) return;
      item.label = text;
      const { g: c2, c } = ink;
      c2.clearRect(0, 0, c.width, c.height);
      c2.fillStyle = '#fff';
      if (mono) {
        c2.font = `600 ${c.height * 0.3}px ${MONO}`;
        c2.textBaseline = 'middle';
        c2.fillText(text.toUpperCase(), c.height * 0.2, c.height / 2, c.width - c.height * 0.4);
      } else {
        // shrink long legends to fit, never squash them
        let size = c.height * 0.42;
        c2.font = `500 ${size}px ${SANS}`;
        const room = c.width - c.height * 0.3;
        const wide = c2.measureText(text).width;
        if (wide > room) { size *= room / wide; c2.font = `500 ${size}px ${SANS}`; }
        c2.textAlign = 'center';
        c2.textBaseline = 'middle';
        c2.fillText(text, c.width / 2, c.height / 2 + 1);
      }
      ink.t.needsUpdate = true;
    };
    item.setLabel(label);
    caps.push(item);
    return item;
  };
  const catCaps = L.cats.map((s) => makeCap({ ...s, kind: 'cat' }, banks[s.c].cat, true));
  await breathe();
  const keyCaps = L.keys.map((s) => makeCap({ ...s, kind: 'key' }, banks[s.c].keys[s.i][0], false));
  await breathe();

  /* knob: knurled aluminium, it turns to the live bank */
  let knob = null;
  if (L.knob) {
    const side = knurl();
    side.wrapS = THREE.RepeatWrapping;
    const kGeo = new THREE.CylinderGeometry(L.knob.r, L.knob.r, 0.46, 64, 1);
    kGeo.rotateX(Math.PI / 2);
    const kMat = [new THREE.MeshPhysicalMaterial({ color: '#d2d3cf', metalness: 0.9, roughness: 0.34, bumpMap: side, bumpScale: 0.6 }),
      new THREE.MeshPhysicalMaterial({ color: '#cfd0cc', metalness: 0.9, roughness: 0.22, roughnessMap: blast }),
      new THREE.MeshPhysicalMaterial({ color: '#cfd0cc', metalness: 0.9, roughness: 0.22 })];
    knob = new THREE.Group();
    const kMesh = new THREE.Mesh(kGeo, kMat);
    kMesh.castShadow = true;
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ff5b14', emissive: '#ff5b14', emissiveIntensity: 0.4 }));
    dot.position.set(0, L.knob.r * 0.68, 0.235);
    knob.add(kMesh, dot);
    knob.position.set(L.knob.x, L.knob.y, 0.23);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(L.knob.r + 0.08, 0.035, 12, 64), new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.6 }));
    ring.position.set(L.knob.x, L.knob.y, 0.005);
    unit.add(knob, ring);
    // bank ticks printed around the knob
    const ticks = printed(1.8, 1.8, (g, w) => {
      g.translate(w / 2, w / 2);
      for (let k = 0; k < banks.length; k++) {
        g.save();
        g.rotate((k / banks.length) * Math.PI * 2);
        g.fillRect(-3, -w / 2 + 6, 6, w * 0.07);
        g.restore();
      }
    });
    const tickPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: ticks.t, transparent: true, color: '#2c2c2b', depthWrite: false }));
    tickPlane.position.set(L.knob.x, L.knob.y, 0.003);
    unit.add(tickPlane);
  }

  /* printed legend on the body, screws, a status LED, the phone's grille */
  const footW = L.BW - 1.2;
  const foot = printed(footW, 0.3, (g, w, h) => {
    g.font = `600 ${h * 0.46}px ${MONO}`;
    g.textBaseline = 'middle';
    const n = banks.reduce((a, b) => a + b.keys.length, 0);
    g.fillText(`${n} KEYS · ${banks.length} BANKS`, 0, h / 2);
    g.textAlign = 'right';
    g.fillText('HB-05 TOOLKIT', w - h * 0.9, h / 2);
  });
  const footPlane = new THREE.Mesh(new THREE.PlaneGeometry(footW, 0.3), new THREE.MeshBasicMaterial({ map: foot.t, transparent: true, color: '#3a3b39', depthWrite: false }));
  footPlane.position.set(0, L.foot.y, 0.002);
  unit.add(footPlane);
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ff8a55', emissive: '#ff5b14', emissiveIntensity: 1.2 }));
  led.position.set(footW / 2 - 0.08, L.foot.y, 0.012);
  unit.add(led);
  const screwMat = new THREE.MeshPhysicalMaterial({ color: '#9a9b98', metalness: 1, roughness: 0.3 });
  const slotMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a' });
  L.screws.forEach(([x, y], k) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 24).rotateX(Math.PI / 2), screwMat);
    s.position.set(x, y, 0.012);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.012), slotMat);
    slot.position.set(x, y, 0.027);
    slot.rotation.z = 0.4 + k * 0.9;
    unit.add(s, slot);
  });
  if (L.grille) {
    const gr = printed(L.grille.w, L.grille.h, (g, w, h) => {
      const step = h / 3.2;
      for (let y = step * 0.6; y < h; y += step) for (let x = step * 0.6; x < w; x += step) {
        g.beginPath(); g.arc(x, y, step * 0.26, 0, Math.PI * 2); g.fill();
      }
    });
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(L.grille.w, L.grille.h), new THREE.MeshBasicMaterial({ map: gr.t, transparent: true, color: '#161616', depthWrite: false }));
    grille.position.set(L.grille.x, L.grille.y, 0.002);
    unit.add(grille);
  }

  // the desk: catches the unit's shadow and nothing else
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(L.BW * 3, L.BH * 3), new THREE.ShadowMaterial({ opacity: 0.5 }));
  desk.position.z = -T - 0.02;
  desk.receiveShadow = true;
  unit.add(desk);

  /* ── State ── */
  const state = { c: -1, i: -1, rise: 0, px: 0, py: 0, tx: 0, ty: 0 };
  let need = true, anim = 0, scramble = null, knobTurn = null;
  const kick = () => { need = true; };
  const setLook = (item, look) => {
    item.cap.material = look === 'orange' ? orange : look === 'dark' ? dark : pbt;
    item.lg.material.color.set(look === 'light' ? '#1d1c1a' : '#f1efe8');
  };
  const refresh = () => {
    catCaps.forEach((k) => setLook(k, k.c === state.c ? 'orange' : 'dark'));
    list?.draw(state.c, state.i);
    keyCaps.forEach((k) => setLook(k, k.c === state.c && k.i === state.i ? 'dark' : 'light'));
  };
  const travel = (item, down) => {
    const to = item.rest - (down ? 0.1 : 0);
    const from = item.g.position.z, t0 = performance.now(), dur = down ? 60 : 160;
    anim++;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const e = down ? k : 1 - Math.pow(1 - k, 3);
      item.g.position.z = from + (to - from) * e;
      need = true;
      if (k < 1) requestAnimationFrame(step); else anim--;
    };
    step();
  };
  const pressKey = (item) => { travel(item, true); setTimeout(() => travel(item, false), 110); };

  const select = (c, i) => {
    if (c === state.c && i === state.i) return;
    const bankChanged = c !== state.c;
    state.c = c; state.i = i;
    refresh();
    scramble = { t0: performance.now(), name: banks[c].keys[i][0] };
    if (knob && bankChanged) knobTurn = { from: knob.rotation.z, to: -(c / banks.length) * Math.PI * 2, t0: performance.now() };
    need = true;
  };

  /* ── Framing ── */
  let W = 0, H = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.75 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // fit the tilted unit with a little air around it
    const fov = (camera.fov * Math.PI) / 180;
    const h = L.BH * Math.cos(L.tilt) + 1.2, w = L.BW + 1.0;
    const d = Math.max(h / 2 / Math.tan(fov / 2), w / 2 / Math.tan(fov / 2) / camera.aspect);
    camera.position.set(0, 0, d);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    need = true;
  };
  const pose = () => {
    state.px += (state.tx - state.px) * 0.08;
    state.py += (state.ty - state.py) * 0.08;
    const out = 1 - state.rise;
    unit.rotation.x = L.tilt - out * 0.9 + state.py * 0.08;
    unit.rotation.y = state.px * 0.12;
    unit.position.y = -out * 2.4;
    return Math.abs(state.tx - state.px) + Math.abs(state.ty - state.py) > 1e-4;
  };

  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let raf = 0, visible = false;
  function frame() {
    raf = visible ? requestAnimationFrame(frame) : 0;
    if (pose()) need = true;
    if (scramble) {
      const k = Math.min(1, (performance.now() - scramble.t0) / 550);
      const n = scramble.name;
      const shown = [...n].map((ch, j) => (ch === ' ' || k >= (j / n.length) * 0.85 + 0.15 ? ch : CH[(Math.random() * CH.length) | 0])).join('');
      disp.draw(state.c, state.i, shown);
      if (k >= 1) scramble = null;
      need = true;
    }
    if (knobTurn) {
      const k = Math.min(1, (performance.now() - knobTurn.t0) / 500);
      knob.rotation.z = knobTurn.from + (knobTurn.to - knobTurn.from) * (1 - Math.pow(1 - k, 3));
      if (k >= 1) knobTurn = null;
      need = true;
    }
    if (!need && !anim) return;
    need = false;
    renderer.render(scene, camera);
  }

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { need = true; raf = requestAnimationFrame(frame); }
  });
  const ro = new ResizeObserver(resize);
  resize();
  select(0, 0);
  disp.draw(0, 0, banks[0].keys[0][0]);
  scramble = null;
  await renderer.compileAsync(scene, camera);
  // a warm frame at rest: textures and shadow maps go up now, not on scroll
  state.rise = 1; pose(); renderer.render(scene, camera);
  state.rise = 0; pose(); renderer.clear();
  io.observe(canvas);
  ro.observe(canvas);

  /* ── Pointer ── */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickables = [...catCaps, ...keyCaps];
  const hitAt = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const meshes = pickables.filter((p) => p.g.visible).map((p) => p.cap);
    if (knob) meshes.push(knob.children[0]);
    if (listPanel) meshes.push(listPanel);
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    if (knob && hit.object === knob.children[0]) return { knob: true, still: true };
    if (hit.object === listPanel) {
      const k = list.at(state.c, hit.uv.x, hit.uv.y);
      return k < 0 ? null : { list: k, still: true };
    }
    return pickables.find((p) => p.cap === hit.object);
  };
  const target = (item) => {
    if (item.kind !== 'cat') return [item.c, item.i];
    // pressing the live bank's key again steps to its next skill
    return item.c === state.c ? [item.c, (state.i + 1) % banks[item.c].keys.length] : [item.c, 0];
  };
  let down = null, hover = null;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.pointerType === 'mouse') {
      state.tx = (e.clientX - r.left) / r.width - 0.5;
      state.ty = (e.clientY - r.top) / r.height - 0.5;
      const h = hitAt(e);
      if (h) canvas.setAttribute('data-cursor', ''); else canvas.removeAttribute('data-cursor');
      canvas.style.cursor = h ? 'pointer' : '';
      if (h && !h.still && h !== hover && h.kind === 'key') {
        const [c, i] = target(h);
        onPick?.(c, i, 'hover');
      }
      hover = h;
    }
  };
  const onDown = (e) => {
    const h = hitAt(e);
    down = h ? { h, x: e.clientX, y: e.clientY } : null;
    if (h && !h.still) travel(h, true);
  };
  const onCancel = () => {
    if (down && !down.h.still) travel(down.h, false);
    down = null;
  };
  const onUp = (e) => {
    if (!down) return;
    const { h, x, y } = down;
    down = null;
    if (!h.still) travel(h, false);
    if (Math.hypot(e.clientX - x, e.clientY - y) > 12) return;
    if (h.knob) { onPick?.((state.c + 1) % banks.length, 0, 'tap'); return; }
    if (h.list !== undefined) { onPick?.(state.c, h.list, 'tap'); return; }
    const [c, i] = target(h);
    onPick?.(c, i, 'tap');
  };
  const onLeave = () => { state.tx = 0; state.ty = 0; hover = null; };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onCancel);
  canvas.addEventListener('pointerleave', onLeave);

  return {
    select,
    // a key pressed from the real keyboard
    press(c, i) {
      const item = L.list ? catCaps[c] : keyCaps.find((k) => k.c === c && k.i === i);
      if (item) pressKey(item);
    },
    setRise(v) { state.rise = v; kick(); },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onCancel);
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
