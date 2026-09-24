import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gsap, theme } from '../lib/motion';
import { roverState } from './state';

/*
  A rover drawn like an engineering figure: paper-coloured faces hide the
  back edges, ink edge lines carry the form. Six subsystems explode apart
  on scroll; the one being described turns signal orange.

  Every group of parts that moves together is merged into one mesh and one
  line set, so the whole figure costs ~30 draw calls.
*/

const SIGNAL = new THREE.Color('#FF5B14');
const ORDER = [0, 1, 2, 3, 4, 5];
const STAGGER = [0, 0.1, 0.05, 0.14, 0.02, 0.08];
const small = () => innerWidth < 700;

export function createRover(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: small() ? 'low-power' : 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 0.42, 0);

  const faceMat = new THREE.MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const subMats = ORDER.map(() => new THREE.LineBasicMaterial());
  const glow = ORDER.map(() => 0); // highlight amount per subsystem (a colour shift, not a glow)
  const groundMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 });

  const root = new THREE.Group(); // yaw + turntable
  const body = new THREE.Group(); // translates when driving
  root.add(body);
  scene.add(root);

  const parts = [];
  const spinners = [];
  const buckets = new Map();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), NOQ = new THREE.Quaternion(), ONE = new THREE.Vector3(1, 1, 1);
  const tmp = new THREE.Vector3();

  const bucket = (key, sub, dir, pivot = null, spin = false) => {
    if (!buckets.has(key)) buckets.set(key, { sub, dir, pivot, spin, faces: [], edges: [] });
    return buckets.get(key);
  };
  const strip = (g) => { g.deleteAttribute('normal'); g.deleteAttribute('uv'); return g; };
  function put(b, geo, matrix) {
    const f = strip(geo.clone());
    const e = new THREE.EdgesGeometry(geo, 24);
    if (matrix) { f.applyMatrix4(matrix); e.applyMatrix4(matrix); }
    b.faces.push(f);
    b.edges.push(e);
    geo.dispose();
  }
  function addPart(geo, sub, dir, pos, rot, quat) {
    const q = quat || (rot ? Q.setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])) : NOQ);
    put(bucket(`${sub}:${dir.x},${dir.y},${dir.z}`, sub, dir), geo, M.compose(pos, q, ONE));
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (r, h, s = 20) => new THREE.CylinderGeometry(r, r, h, s);
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const Z = [Math.PI / 2, 0, 0]; // cylinder axis → z
  const X = [0, 0, Math.PI / 2]; // cylinder axis → x

  function link(a, b, t, sub, dir) {
    const q = new THREE.Quaternion().setFromUnitVectors(v(1, 0, 0), tmp.copy(b).sub(a).normalize());
    addPart(box(a.distanceTo(b), t, t), sub, dir, a.clone().add(b).multiplyScalar(0.5), null, q);
  }

  /* 01 Chassis */
  const dC = v(0, 0, 0);
  addPart(box(0.86, 0.16, 0.44), 0, dC, v(0, 0.5, 0));
  addPart(box(0.94, 0.02, 0.52), 0, dC, v(0, 0.59, 0));
  addPart(box(0.04, 0.07, 0.5), 0, dC, v(0.47, 0.46, 0));
  addPart(box(0.04, 0.07, 0.5), 0, dC, v(-0.46, 0.46, 0));
  addPart(box(0.7, 0.02, 0.02), 0, dC, v(0, 0.43, 0.215));
  addPart(box(0.7, 0.02, 0.02), 0, dC, v(0, 0.43, -0.215));

  /* 03 Suspension — differential bar, rockers, bogies, struts */
  addPart(cyl(0.012, 0.66), 2, v(0, 0.12, 0), v(-0.02, 0.63, 0), Z);
  for (const s of [1, -1]) {
    const z = s * 0.3;
    const d = v(0, 0, s * 0.36);
    const P = v(0.08, 0.47, z), F = v(0.52, 0.3, z), B = v(-0.24, 0.34, z);
    const Mm = v(0, 0.28, z), R = v(-0.5, 0.28, z);
    link(P, F, 0.028, 2, d);
    link(P, B, 0.028, 2, d);
    link(B, Mm, 0.024, 2, d);
    link(B, R, 0.024, 2, d);
    for (const top of [F, Mm, R]) link(top, v(top.x, 0.2, z), 0.022, 2, d);
    addPart(cyl(0.032, 0.07), 2, d, P, Z);
    addPart(cyl(0.026, 0.06), 2, d, B, Z);
    addPart(box(0.02, 0.16, 0.02), 2, d, v(-0.02, 0.55, z * 0.95));
  }

  /* 02 Drivetrain · 04 Wheels */
  const R0 = 0.14, W0 = 0.1;
  const grousers = small() ? 10 : 14;
  let wi = 0;
  for (const s of [1, -1]) {
    for (const x of [0.52, 0, -0.5]) {
      const dD = v(0, -0.02, s * 0.62);
      addPart(cyl(0.042, 0.1), 1, dD, v(x, 0.14, s * 0.27), Z);
      addPart(box(0.075, 0.075, 0.05), 1, dD, v(x, 0.14, s * 0.335));

      // each wheel is its own group, pivoting on its hub so the tread can roll
      const w = bucket(`w${wi++}`, 3, v(0, -0.04, s * 0.95), v(x, 0.14, s * 0.41), true);
      const tire = cyl(R0, W0, small() ? 28 : 36);
      tire.rotateX(Math.PI / 2);
      put(w, tire);
      const hub = cyl(0.045, W0 + 0.03, 16);
      hub.rotateX(Math.PI / 2);
      put(w, hub);
      for (let i = 0; i < grousers; i++) {
        const g = box(0.026, 0.018, W0 + 0.004);
        g.translate(0, R0 + 0.006, 0);
        g.rotateZ((i / grousers) * Math.PI * 2);
        put(w, g);
      }
      for (let i = 0; i < 5; i++) {
        const g = box(0.012, 0.075, 0.008);
        g.translate(0, 0.08, s * (W0 / 2 + 0.004));
        g.rotateZ((i / 5) * Math.PI * 2);
        put(w, g);
      }
    }
  }

  /* 05 Electronics */
  const dE = v(0, 0.46, 0);
  addPart(box(0.3, 0.09, 0.22), 4, dE, v(-0.2, 0.645, 0));
  addPart(box(0.3, 0.012, 0.012), 4, dE, v(-0.2, 0.693, 0.05));
  addPart(box(0.3, 0.012, 0.012), 4, dE, v(-0.2, 0.693, -0.05));
  addPart(box(0.22, 0.008, 0.17), 4, dE, v(0.12, 0.63, 0));
  addPart(box(0.22, 0.008, 0.17), 4, dE, v(0.12, 0.695, 0));
  for (const [x, z] of [[0.03, 0.07], [0.21, 0.07], [0.03, -0.07], [0.21, -0.07]]) {
    addPart(cyl(0.006, 0.065, 8), 4, dE, v(x, 0.662, z));
  }
  addPart(box(0.11, 0.022, 0.09), 4, dE, v(0.12, 0.71, 0));
  for (let i = 0; i < 7; i++) addPart(box(0.006, 0.03, 0.09), 4, dE, v(0.075 + i * 0.015, 0.735, 0));

  /* 06 Controls — mast, stereo head, LiDAR, antenna */
  const dK = v(0.12, 0.82, 0);
  addPart(cyl(0.014, 0.32, 12), 5, dK, v(0.36, 0.76, 0.15));
  addPart(box(0.1, 0.065, 0.15), 5, dK, v(0.37, 0.95, 0.15));
  addPart(cyl(0.022, 0.03, 16), 5, dK, v(0.43, 0.95, 0.19), X);
  addPart(cyl(0.022, 0.03, 16), 5, dK, v(0.43, 0.95, 0.11), X);
  addPart(cyl(0.052, 0.05, 28), 5, dK, v(0.33, 0.625, -0.12));
  addPart(cyl(0.036, 0.03, 28), 5, dK, v(0.33, 0.665, -0.12));
  addPart(box(0.08, 0.04, 0.06), 5, dK, v(-0.38, 0.62, -0.17));
  addPart(cyl(0.005, 0.3, 6), 5, dK, v(-0.38, 0.79, -0.17));
  addPart(box(0.018, 0.018, 0.018), 5, dK, v(-0.38, 0.945, -0.17));

  // merge each bucket → one mesh + one line set
  for (const b of buckets.values()) {
    const g = new THREE.Group();
    if (b.pivot) g.position.copy(b.pivot);
    const faces = mergeGeometries(b.faces), edges = mergeGeometries(b.edges);
    b.faces.forEach((x) => x.dispose());
    b.edges.forEach((x) => x.dispose());
    g.add(new THREE.Mesh(faces, faceMat), new THREE.LineSegments(edges, subMats[b.sub]));
    body.add(g);
    parts.push({ g, base: g.position.clone(), dir: b.dir, sub: b.sub });
    if (b.spin) spinners.push(g);
  }

  /* Turntable — a measured ring the rover stands on */
  {
    const pts = [];
    const ring = (r, n = 128) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
        pts.push(v(Math.cos(a) * r, 0, Math.sin(a) * r), v(Math.cos(b) * r, 0, Math.sin(b) * r));
      }
    };
    ring(1.1);
    ring(1.16);
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, l = i % 6 === 0 ? 0.09 : 0.035;
      pts.push(v(Math.cos(a) * 1.16, 0, Math.sin(a) * 1.16), v(Math.cos(a) * (1.16 + l), 0, Math.sin(a) * (1.16 + l)));
    }
    pts.push(v(-1.3, 0, 0), v(1.3, 0, 0), v(0, 0, -1.3), v(0, 0, 1.3));
    root.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), groundMat));
  }

  const anchorsLocal = [
    [v(-0.28, 0.5, 0.22), 0],
    [v(0.52, 0.14, 0.3), 1],
    [v(0.08, 0.47, 0.3), 2],
    [v(-0.5, 0.14, 0.46), 3],
    [v(-0.2, 0.69, 0.11), 4],
    [v(0.37, 0.985, 0.15), 5],
  ];
  const partDirs = { 1: v(0, -0.02, 0.62), 2: v(0, 0, 0.36), 3: v(0, -0.04, 0.95), 4: dE, 5: dK, 0: dC };

  /* ── Interaction ── */
  let dragVel = 0, dragAngle = 0, autoAngle = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = (e) => {
    pointer.x = e.clientX / innerWidth - 0.5;
    pointer.y = e.clientY / innerHeight - 0.5;
  };
  addEventListener('pointermove', onMove, { passive: true });

  /* ── Sizing ── */
  let W = 0, H = 0;
  const touch = matchMedia('(pointer: coarse)').matches;
  function resize() {
    // phones resize on every address-bar show/hide; only react to real changes
    if (touch && W && innerWidth === W && Math.abs(innerHeight - H) < 160) return;
    W = innerWidth;
    H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, W < 700 ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  const smooth = (x) => x * x * (3 - 2 * x);
  const ease = (e, i) => smooth(Math.min(1, Math.max(0, (e - STAGGER[i]) / 0.8)));
  const col = new THREE.Color(), fg = new THREE.Color(), bg = new THREE.Color();
  const ndc = new THREE.Vector3();
  let last = performance.now();

  // the last frame's inputs — when nothing moved, the GPU gets the frame off
  const seen = new Float32Array(20);
  let shownAlpha = -1;
  function frame() {
    const s = roverState;
    const alpha = s.opacity * s.intro;
    if (Math.abs(alpha - shownAlpha) > 0.001) { canvas.style.opacity = alpha; shownAlpha = alpha; }
    if (alpha < 0.01) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // colours follow the paper ↔ ink theme
    bg.setRGB(theme.bg[0] / 255, theme.bg[1] / 255, theme.bg[2] / 255, THREE.SRGBColorSpace);
    fg.setRGB(theme.fg[0] / 255, theme.fg[1] / 255, theme.fg[2] / 255, THREE.SRGBColorSpace);
    faceMat.color.copy(bg);
    groundMat.color.copy(fg);
    for (let i = 0; i < 6; i++) {
      glow[i] += ((s.focus === i ? 1 : 0) - glow[i]) * Math.min(1, dt * 8);
      subMats[i].color.copy(col.copy(fg).lerp(SIGNAL, glow[i]));
    }

    // explode
    for (const p of parts) {
      const e = ease(s.explode, p.sub);
      p.g.position.copy(p.base).addScaledVector(p.dir, e);
    }

    // yaw: base three-quarter + idle + drag + scroll
    dragAngle += dragVel;
    dragVel *= 0.93;
    autoAngle += dt * 0.12 * s.auto;
    const free = -0.62 + autoAngle + dragAngle + s.turn;
    const off = Math.atan2(Math.sin(free - s.lockYaw), Math.cos(free - s.lockYaw));
    root.rotation.y = s.lockYaw + off * (1 - s.lock);

    // drive off
    const dx = s.drive * 5;
    body.position.x = dx;
    for (const w of spinners) w.rotation.z = -dx / R0;

    // camera: gentle pointer parallax
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;
    const aspect = W / H;
    const e = smooth(Math.min(1, s.explode));
    const span = 2 * Math.tan((14 * Math.PI) / 180) * 4.4 * aspect; // visible width at D = 4.4
    const fit = Math.max(1, 1.9 / span);
    target.y = 0.42 + e * 0.42;
    const D = 4.4 * s.dist * Math.max(fit * (1 + e * 0.55), (3.4 * e) / span);
    const az = pointer.sx * 0.18, el = 0.34 - pointer.sy * 0.1;
    camera.position.set(Math.sin(az) * Math.cos(el) * D, Math.sin(el) * D + target.y, Math.cos(az) * Math.cos(el) * D);
    camera.lookAt(target);
    camera.setViewOffset(W, H, -(s.cx - 0.5) * W, -(s.cy - 0.5) * H, W, H);

    let changed = false;
    const sig = [W, H, s.cx, s.cy, s.dist, s.explode, s.drive, root.rotation.y, pointer.sx, pointer.sy, theme.t, alpha, ...glow];
    for (let k = 0; k < sig.length; k++) if (Math.abs(sig[k] - seen[k]) > 1e-4) { changed = true; seen[k] = sig[k]; }
    if (!changed) return;

    renderer.render(scene, camera);

    // project callout anchors
    root.updateMatrixWorld();
    for (let i = 0; i < 6; i++) {
      const [p, sub] = anchorsLocal[i];
      ndc.copy(p).addScaledVector(partDirs[sub], ease(s.explode, sub));
      ndc.x += dx;
      ndc.applyMatrix4(root.matrixWorld).project(camera);
      s.anchors[i].x = (ndc.x * 0.5 + 0.5) * W;
      s.anchors[i].y = (-ndc.y * 0.5 + 0.5) * H;
    }
  }
  gsap.ticker.add(frame);

  return {
    drag(dx) { dragVel += dx * 0.00032; },
    dispose() {
      gsap.ticker.remove(frame);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onMove);
      scene.traverse((o) => o.geometry?.dispose());
      renderer.dispose();
    },
  };
}
