import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, GodRays } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion, useInView, useMotionValue, useSpring, useVelocity } from 'framer-motion';
void motion;
import { Github, Linkedin, Mail, ArrowUpRight, Sun, Moon, ChevronDown, Shield, FlaskConical, Wrench } from 'lucide-react';
import * as THREE from 'three';
import './App.css';

/* ═══════════════════════════════════════════════════════════
   EXTREME ARCHITECTURE — Portfolio
   Interactive dot matrix · Magnetic text · Scroll text fill
   Kinetic dividers · Physics cursor · 3D tilt · Parallax
   ═══════════════════════════════════════════════════════════ */

/* ──────────────────── HB MONOGRAM LOGO ──────────────────── */
function HBLogo({ size = 28, className = '' }) {
  const draw = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: 'easeInOut', delay: 0.5 } }
  };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <motion.rect x="4" y="4" width="3.2" height="32" rx="1.6" fill="currentColor" {...draw} />
      <motion.rect x="18.4" y="4" width="3.2" height="32" rx="1.6" fill="currentColor" {...draw} transition={{ delay: 0.7 }} />
      <motion.rect x="4" y="17.4" width="17.6" height="3.2" rx="1.6" fill="currentColor" {...draw} transition={{ delay: 0.9 }} />
      <motion.path d="M20 6 C20 6, 34 6, 34 14.5 C34 23, 20 20.5, 20 20.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none" {...draw} transition={{ delay: 1.1 }} />
      <motion.path d="M20 20.5 C20 20.5, 36.5 18, 36.5 28 C36.5 37, 20 36, 20 36" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none" {...draw} transition={{ delay: 1.3 }} />
    </svg>
  );
}

/* ──────────────────── GLOBAL MOUSE STORE ──────────────────── */
const mouseStore = { x: 0, y: 0, vx: 0, vy: 0, _px: 0, _py: 0 };
if (typeof window !== 'undefined') {
  mouseStore.x = window.innerWidth / 2;
  mouseStore.y = window.innerHeight / 2;
  window.addEventListener('mousemove', (e) => {
    mouseStore._px = mouseStore.x; mouseStore._py = mouseStore.y;
    mouseStore.x = e.clientX; mouseStore.y = e.clientY;
    mouseStore.vx = mouseStore.x - mouseStore._px;
    mouseStore.vy = mouseStore.y - mouseStore._py;
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   INTERACTIVE DOT MATRIX — Content-zone grain refinement
   Dots in the "content zone" (center) become ultra-fine grains
   Dots at edges stay large + interactive with mouse displacement
   ═══════════════════════════════════════════════════════════ */

function DotMatrix({ isDark = false }) {
  const reduceMotion = useReducedMotion();
  const contentRectsRef = useRef([]);
  const sunRef = useRef();

  // Collect content element positions for grain refinement
  useEffect(() => {
    const update = () => {
      const els = document.querySelectorAll('.grain-zone');
      contentRectsRef.current = Array.from(els).map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const interval = setInterval(update, 800);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); clearInterval(interval); };
  }, []);

  if (reduceMotion) return null;

  return (
    <div className="dot-matrix-canvas" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {/* Perspective Camera dramatically increases the 'True 3D' feeling */}
      <Canvas camera={{ position: [0, 0, 600], fov: 45 }} gl={{ alpha: true, antialias: true, stencil: false, depth: true }} shadows>
        <ambientLight intensity={isDark ? 1.6 : 1.1} />
        <directionalLight position={[200, 300, 400]} intensity={isDark ? 4.0 : 2.5} castShadow />
        <pointLight position={[-200, -200, 200]} intensity={isDark ? 3.5 : 1.5} color={isDark ? "#ff4d00" : "#cc4a00"} />
        <MouseLight isDark={isDark} />
        
        {/* Hidden sun source for GodRays */}
        <SunSource ref={sunRef} isDark={isDark} />
        
        <InstancedDotGrid contentRectsRef={contentRectsRef} isDark={isDark} />
        <EffectComposer disableNormalPass multisampling={4}>
          <Bloom
            luminanceThreshold={isDark ? 0.2 : 0.8}
            mipmapBlur
            intensity={isDark ? 1.8 : 0.25}
            radius={0.4}
            blendFunction={BlendFunction.SCREEN}
          />
          {isDark && sunRef.current && (
            <GodRays 
              sun={sunRef.current} 
              exposure={0.25} 
              decay={0.96} 
              blur={0.8} 
              samples={60} 
              density={0.98} 
              weight={0.6} 
              clampMax={1.0} 
            />
          )}
          <Vignette eskil={false} offset={0.1} darkness={isDark ? 0.65 : 0.15} />
          <Noise opacity={isDark ? 0.03 : 0.012} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

const SunSource = React.forwardRef(({ isDark }, ref) => {
  useFrame(() => {
    if (!ref.current) return;
    const x3d = (mouseStore.x / window.innerWidth) * 800 - 400;
    const y3d = -((mouseStore.y / window.innerHeight) * 600 - 300);
    ref.current.position.set(x3d, y3d, 100);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[12, 16, 16]} />
      <meshBasicMaterial color={isDark ? "#ff4d00" : "#000000"} transparent opacity={0} />
    </mesh>
  );
});

function MouseLight({ isDark }) {
  const lightRef = useRef();
  useFrame((state) => {
    if (!lightRef.current) return;
    const x3d = (mouseStore.x / window.innerWidth) * 800 - 400;
    const y3d = -((mouseStore.y / window.innerHeight) * 600 - 300);
    lightRef.current.position.set(x3d, y3d, 120);
  });
  // OG High intensity glint
  return <pointLight ref={lightRef} intensity={isDark ? 18.0 : 5.0} color="#ffffff" distance={200} decay={3.5} />;
}

function InstancedDotGrid({ contentRectsRef, isDark }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const SPACING = 24;
  const INFLUENCE = 180;

  const [grid, setGrid] = useState({ cols: 0, rows: 0, w: 0, h: 0 });

  useEffect(() => {
    const updateGrid = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cols = Math.ceil(w / SPACING) + 4;
      const rows = Math.ceil(h / SPACING) + 4;
      setGrid({ cols, rows, w, h });
    };
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, []);

  const count = grid.cols * grid.rows;

  useFrame((state) => {
    if (!meshRef.current || count === 0) return;

    // We must manually map the perspective bounds to cover the screen
    // At Z=0 and camera Z=600, fov=45, the visible height is:
    const dist = state.camera.position.z;
    const vHeight = 2 * Math.tan((state.camera.fov * Math.PI) / 360) * dist;
    const vWidth = vHeight * state.camera.aspect;

    const mx = mouseStore.x;
    const my = mouseStore.y;
    const rects = contentRectsRef.current;

    // Slowly tilt the entire matrix based on mouse position to give a parallax 3D feel
    meshRef.current.rotation.x = (my - grid.h / 2) * 0.0001;
    meshRef.current.rotation.y = (mx - grid.w / 2) * 0.0001;

    let i = 0;
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const px = (c - 2) * SPACING;
        const py = (r - 2) * SPACING;

        // Content zone check based on pixel coords
        let minDist = Infinity;
        for (let j = 0; j < rects.length; j++) {
          const rect = rects[j];
          const PAD = 40;
          const cx = Math.max(rect.x - PAD, Math.min(px, rect.x + rect.w + PAD));
          const cy = Math.max(rect.y - PAD, Math.min(py, rect.y + rect.h + PAD));
          const distToContent = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
          if (distToContent < minDist) minDist = distToContent;
        }

        const FADE = 80;
        const proximity = minDist < FADE ? minDist / FADE : 1;

        const BASE_R = 1.0;
        const GRAIN_R = 0.25;
        const baseRadius = GRAIN_R + (BASE_R - GRAIN_R) * proximity;

        const dx = px - mx;
        const dy = py - my;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        let z = 0;
        let scaleXY = baseRadius;
        // The default cylinder is 1 unit tall. A minimum scale of 0.5 makes it a tiny flat disk like a dot.
        let scaleH = 0.5;

        // Mouse hover pushes them outwards
        if (distToMouse < INFLUENCE) {
          // Multiply the interaction force by proximity squared.
          // This makes dots near text completely ignore the mouse (remaining fully flat),
          // while dots in empty space extrude perfectly natively.
          const force = (1 - distToMouse / INFLUENCE) * (proximity * proximity);
          z = force * 12; // Very subtle pop towards camera
          scaleXY = baseRadius * (1 + force * 0.8);
          scaleH = 0.5 + force * 16; // Mild tactile extrusion instead of huge spikes
        }

        // Map pixel coordinates to the calculated 3D viewport bounds
        const x3d = (px / grid.w) * vWidth - (vWidth / 2);
        const y3d = -((py / grid.h) * vHeight - (vHeight / 2));

        // Cylinder's local Y is its height/length. We want it pointing at the camera (Z axis).
        // Rotate X by PI/2 makes local Y align with World Z.
        dummy.position.set(x3d, y3d, z / 2); // Anchor back to the background plane
        dummy.scale.set(scaleXY, scaleH, scaleXY); // Scale X/Z the same (width), scale Y (height)
        dummy.rotation.x = Math.PI / 2;

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[1, 1, 1, 12]} />
      {/* High-visibility Glowing Orange for dark mode, Deeper Architectural Orange for bright mode */}
      <meshStandardMaterial
        color={isDark ? "#ff4d00" : "#111111"}
        emissive={isDark ? "#ff4d00" : "#000000"}
        emissiveIntensity={isDark ? 3.5 : 0}
        transparent
        opacity={isDark ? 0.95 : 0.45}
        depthWrite={false}
        roughness={0.15}
        metalness={0.8}
      />
    </instancedMesh>
  );
}

/* ──────────────────── 3D BREATHING SPHERE ──────────────────── */

function BreathingSphere() {
  const meshRef = useRef(null);
  const reduceMotion = useReducedMotion();
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const speed = reduceMotion ? 0.15 : 0.25;
    const breathe = 1 + Math.sin(t * speed) * 0.025;
    meshRef.current.scale.setScalar(breathe * 2.2);
    meshRef.current.rotation.y = t * 0.035;
    meshRef.current.rotation.x = Math.sin(t * 0.018) * 0.08;
    meshRef.current.position.y = Math.sin(t * 0.12) * 0.06;
  });
  return (
    <Float floatIntensity={0.2} speed={0.35} rotationIntensity={0.08}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial color="#b0a898" roughness={0.9} metalness={0.1} wireframe transparent opacity={reduceMotion ? 0.05 : 0.07} />
      </mesh>
      <mesh scale={2.0}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#c8c0b8" roughness={1} metalness={0} transparent opacity={0.015} />
      </mesh>
    </Float>
  );
}

/* ──────────────────── FLOATING MOTES ──────────────────── */

function FloatingMotes() {
  const reduceMotion = useReducedMotion();
  const count = reduceMotion ? 25 : 60;
  const meshRef = useRef();
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      speeds[i] = Math.random() * 0.25 + 0.08;
    }
    return { positions, speeds };
  }, [count]);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const posArr = meshRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const speed = particles.speeds[i];
      posArr[i * 3 + 1] += speed * 0.0015;
      posArr[i * 3] += Math.sin(t * speed + i) * 0.0004;
      if (posArr[i * 3 + 1] > 6) posArr[i * 3 + 1] = -6;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#2a2826" transparent opacity={reduceMotion ? 0.12 : 0.2} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ──────────────────── WEBGL BACKGROUND ──────────────────── */

function WebGLBackground({ isDark = false }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 6], fov: 48 }} gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}>
        <color attach="background" args={[isDark ? '#000000' : '#f5f3ef']} />
        <ambientLight intensity={isDark ? 0.3 : 0.5} color={isDark ? '#202020' : '#f5f3ef'} />
        <directionalLight position={[5, 8, 5]} intensity={isDark ? 0.2 : 0.35} color={isDark ? '#404040' : '#f2efeb'} />
        <pointLight position={[-6, -4, -8]} intensity={0.08} color="#1a5c38" />
        <pointLight position={[6, 4, -6]} intensity={0.06} color="#7b6cb5" />
        <BreathingSphere />
        <FloatingMotes />
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom luminanceThreshold={0.35} mipmapBlur intensity={0.3} blendFunction={BlendFunction.ADD} />
          <Noise opacity={reduceMotion ? 0.01 : 0.015} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      </Canvas>
      <div className="noise-overlay" />
    </div>
  );
}

function parseRgbChannels(color) {
  const match = color && color.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.some((part, index) => index < 3 && Number.isNaN(part))) return null;
  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
    a: Number.isNaN(parts[3]) ? 1 : parts[3],
  };
}

function isDarkSurface(element) {
  let node = element instanceof Element ? element : null;
  while (node && node !== document.body) {
    if (node.classList.contains('cursor-invert-surface')) return true;
    const styles = window.getComputedStyle(node);
    const bg = parseRgbChannels(styles.backgroundColor);
    if (bg && bg.a > 0.12) {
      const luminance = (bg.r * 0.2126 + bg.g * 0.7152 + bg.b * 0.0722) / 255;
      return luminance < 0.18;
    }
    node = node.parentElement;
  }
  return false;
}

function isDarkSurfaceAtPoint(x, y) {
  const stack = document.elementsFromPoint(x, y);
  return stack.some((element) => isDarkSurface(element));
}

/* ═══════════════════════════════════════════════════════════
   EXTREME CURSOR — Physics trail + velocity morphing
   ═══════════════════════════════════════════════════════════ */

function PhysicsCursor({ isDark = false }) {
  const followerRef = useRef(null);
  const dotRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches
  );
  const [cursorType, setCursorType] = useState('default'); // 'default', 'active', 'view', 'text'
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isOverDarkSurface, setIsOverDarkSurface] = useState(false);
  const lastDarkSurfaceRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)');
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let followerPos = { ...mouse };
    let dotPos = { ...mouse };
    let velocity = { x: 0, y: 0 };
    let rotation = 0;

    const onMove = (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
      const nextIsOverDarkSurface = !isDark && isDarkSurfaceAtPoint(e.clientX, e.clientY);
      if (nextIsOverDarkSurface !== lastDarkSurfaceRef.current) {
        lastDarkSurfaceRef.current = nextIsOverDarkSurface;
        setIsOverDarkSurface(nextIsOverDarkSurface);
      }
    };

    const onOver = (e) => {
      const t = e.target;
      if (t.closest('a, button, .hover-target')) setCursorType('active');
      else if (t.closest('.project-card, .arch-card, .bento-item')) setCursorType('view');
      else if (t.closest('p, h1, h2, h3, .tl-title')) setCursorType('text');
      else setCursorType('default');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);

    let raf;
    const render = () => {
      // Different spring speeds for dot vs follower for 'parallax' depth
      dotPos.x += (mouse.x - dotPos.x) * 0.35;
      dotPos.y += (mouse.y - dotPos.y) * 0.35;
      followerPos.x += (mouse.x - followerPos.x) * 0.12;
      followerPos.y += (mouse.y - followerPos.y) * 0.12;

      velocity.x = mouse.x - followerPos.x;
      velocity.y = mouse.y - followerPos.y;
      rotation = (velocity.x * 0.15); // Tilt on move

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.x}px,${dotPos.y}px,0) translate(-50%,-50%)`;
      }
      if (followerRef.current) {
        const scale = 1 + Math.abs(velocity.x + velocity.y) * 0.002;
        followerRef.current.style.transform = `translate3d(${followerPos.x}px,${followerPos.y}px,0) translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`;
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
    };
  }, [isDark, isMobile]);

  if (isMobile) return null;

  return (
    <div className={`mechanical-cursor-wrap ${cursorType} ${isOverDarkSurface ? 'contrast-orange' : ''}`}>
      {/* Light Core Dot */}
      <div ref={dotRef} className="cursor-dot-core" />
      
      {/* Intricate HUD Follower (Scaled Down) */}
      <div ref={followerRef} className="cursor-mechanical-hud">
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
          {/* Outer Brackets (lock-on animation) */}
          <g className="hud-brackets">
            <path d="M 35 15 L 15 15 L 15 35" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 65 15 L 85 15 L 85 35" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 35 85 L 15 85 L 15 65" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 65 85 L 85 85 L 85 65" stroke="currentColor" strokeWidth="1.5" />
          </g>

          {/* Orbiting Ring */}
          <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 8" className="hud-orbit" />
          
          {/* Inner Target Crosshair */}
          <line x1="45" y1="50" x2="55" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="45" x2="50" y2="55" stroke="currentColor" strokeWidth="1" opacity="0.5" />

          {/* Adaptive Labels */}
          <text x="50" y="54" className="hud-label label-view" textAnchor="middle">VIEW</text>
          <text x="50" y="54" className="hud-label label-click" textAnchor="middle">LINK</text>
          <text x="50" y="54" className="hud-label label-scan" textAnchor="middle">SCAN</text>
        </svg>

        {/* Real-time Data Readout */}
        <div className="cursor-data">
          <span className="cursor-coord">X:{coords.x}</span>
          <span className="cursor-coord">Y:{coords.y}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VERTICAL TICKER — 3D rotating cylinder of skills
   Replaces horizontal marquee with an infinitely rotating column
   ═══════════════════════════════════════════════════════════ */

function VerticalTicker({ items, speed = 18 }) {
  const reduceMotion = useReducedMotion();
  const doubled = [...items, ...items];
  return (
    <div className="vticker">
      <div className="vticker-track" style={{ '--vticker-speed': `${reduceMotion ? 9999 : speed}s` }}>
        {doubled.map((item, i) => (
          <div key={i} className="vticker-item">
            <span className="vticker-label">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCROLL-LINKED TEXT FILL — Words fill with color on scroll
   Each word transitions from muted to full color as you scroll
   ═══════════════════════════════════════════════════════════ */

function ScrollFillText({ text, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.35'] });
  const words = text.split(' ');
  return (
    <span ref={ref} className={`scroll-fill-text ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return <ScrollFillWord key={i} word={word} progress={scrollYProgress} range={[start, end]} />;
      })}
    </span>
  );
}

function ScrollFillWord({ word, progress, range }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [4, 0]);
  return (
    <motion.span className="scroll-fill-word" style={{ opacity, y }}>
      {word}{'\u00A0'}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════════
   KINETIC DIVIDER — Rotating text along a line
   ═══════════════════════════════════════════════════════════ */

function KineticDivider({ text = '◆', count = 30 }) {
  // Render enough items to overflow the screen twice, then CSS animates translation by exactly half.
  const items = Array.from({ length: count });
  return (
    <div className="kinetic-divider grain-zone cursor-invert-surface" aria-hidden="true">
      <div className="kinetic-track">
        {[...items, ...items].map((_, i) => (
          <span key={i} className="kinetic-glyph">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER — Numbers that count up on scroll
   ═══════════════════════════════════════════════════════════ */

function AnimatedCounter({ value, suffix = '', label = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = parseInt(value, 10);
    const duration = 1800;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease out quart
      setDisplay(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value]);

  return (
    <div ref={ref} className="counter-item">
      <div className="counter-value">{display}{suffix}</div>
      <div className="counter-label">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEXT SCRAMBLE — Characters randomize then resolve
   ═══════════════════════════════════════════════════════════ */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';

/* ──────────────────── GLINT TEXT ──────────────────── */
function GlintText({ text = '', className = '', as: Tag = 'span' }) {
  return (
    <Tag className={`glint-text ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span key={i} className="glint-char"
          variants={{
            initial: { y: 0, filter: 'blur(0px)', color: 'inherit' },
            hover: { y: -2, filter: 'blur(0.4px)', color: 'var(--orange)', transition: { duration: 0.3, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] } }
          }}
          initial="initial" whileHover="hover"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════════════
   3D PERSPECTIVE TILT CARD
   ═══════════════════════════════════════════════════════════ */

function TiltCard({ children, className = '', intensity = 12, glareIntensity = 0.08, delay = 0 }) {
  const ref = useRef(null);
  const glareRef = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-6%' });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width, y = (e.clientY - top) / height;
    setTilt({ rx: (y - 0.5) * -intensity, ry: (x - 0.5) * intensity });
    if (glareRef.current) glareRef.current.style.background = `radial-gradient(300px at ${x * 100}% ${y * 100}%, rgba(255,255,255,${glareIntensity}), transparent 60%)`;
  }, [intensity, glareIntensity]);
  const handleLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
    if (glareRef.current) glareRef.current.style.background = 'transparent';
  }, []);
  return (
    <motion.div ref={ref} className={`tilt-card ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 25, rotateX: 4 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }}
      style={{ transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transition: 'transform 0.12s ease-out', transformStyle: 'preserve-3d' }}
    >
      {children}
      <div ref={glareRef} className="tilt-glare" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CUSTOM ANIMATED ICONS — Hand-crafted SVG icons for each domain
   Each icon has micro-animations: pulse, orbit, wave, etc.
   ═══════════════════════════════════════════════════════════ */

function NeuralNetworkIcon({ color = 'var(--green)', size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="domain-icon">
      {/* Neural connections */}
      <g className="icon-connections" opacity="0.3">
        <line x1="12" y1="14" x2="24" y2="24" stroke={color} strokeWidth="0.8" />
        <line x1="12" y1="34" x2="24" y2="24" stroke={color} strokeWidth="0.8" />
        <line x1="24" y1="24" x2="36" y2="14" stroke={color} strokeWidth="0.8" />
        <line x1="24" y1="24" x2="36" y2="34" stroke={color} strokeWidth="0.8" />
        <line x1="12" y1="14" x2="24" y2="8" stroke={color} strokeWidth="0.5" />
        <line x1="12" y1="34" x2="24" y2="40" stroke={color} strokeWidth="0.5" />
        <line x1="24" y1="8" x2="36" y2="14" stroke={color} strokeWidth="0.5" />
        <line x1="24" y1="40" x2="36" y2="34" stroke={color} strokeWidth="0.5" />
      </g>
      {/* Input layer */}
      <circle cx="12" cy="14" r="3" fill={color} className="icon-node icon-node-1" />
      <circle cx="12" cy="24" r="2" fill={color} opacity="0.4" className="icon-node icon-node-2" />
      <circle cx="12" cy="34" r="3" fill={color} className="icon-node icon-node-3" />
      {/* Hidden layer */}
      <circle cx="24" cy="8" r="2.5" fill={color} opacity="0.6" className="icon-node icon-node-4" />
      <circle cx="24" cy="24" r="4" fill={color} className="icon-node-center" />
      <circle cx="24" cy="24" r="6" fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" className="icon-pulse-ring" />
      <circle cx="24" cy="40" r="2.5" fill={color} opacity="0.6" className="icon-node icon-node-5" />
      {/* Output layer */}
      <circle cx="36" cy="14" r="3" fill={color} className="icon-node icon-node-6" />
      <circle cx="36" cy="24" r="2" fill={color} opacity="0.4" className="icon-node icon-node-7" />
      <circle cx="36" cy="34" r="3" fill={color} className="icon-node icon-node-8" />
      {/* Signal pulse traveling along a connection */}
      <circle cx="0" cy="0" r="1.5" fill={color} opacity="0.8" className="icon-signal">
        <animateMotion dur="2.5s" repeatCount="indefinite" path="M12,14 L24,24 L36,14" />
      </circle>
      <circle cx="0" cy="0" r="1.5" fill={color} opacity="0.6" className="icon-signal">
        <animateMotion dur="3s" repeatCount="indefinite" path="M12,34 L24,24 L36,34" begin="0.8s" />
      </circle>
    </svg>
  );
}

function CircuitBoardIcon({ color = 'var(--lavender)', size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="domain-icon">
      {/* Circuit traces */}
      <g opacity="0.35">
        <path d="M8 24h8l4-8h8l4 8h8" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <path d="M8 32h6l3-4h14l3 4h6" stroke={color} strokeWidth="0.7" strokeLinecap="round" />
        <path d="M8 16h6l3 4h14l3-4h6" stroke={color} strokeWidth="0.7" strokeLinecap="round" />
      </g>
      {/* Nodes / components */}
      <rect x="18" y="14" width="12" height="12" rx="2" stroke={color} strokeWidth="1.2" fill="none" className="icon-chip" />
      <rect x="20" y="16" width="8" height="8" rx="1" fill={color} opacity="0.15" />
      {/* Pins */}
      <line x1="20" y1="14" x2="20" y2="11" stroke={color} strokeWidth="0.8" />
      <line x1="24" y1="14" x2="24" y2="10" stroke={color} strokeWidth="0.8" />
      <line x1="28" y1="14" x2="28" y2="11" stroke={color} strokeWidth="0.8" />
      <line x1="20" y1="26" x2="20" y2="29" stroke={color} strokeWidth="0.8" />
      <line x1="24" y1="26" x2="24" y2="30" stroke={color} strokeWidth="0.8" />
      <line x1="28" y1="26" x2="28" y2="29" stroke={color} strokeWidth="0.8" />
      {/* Small junction dots */}
      <circle cx="8" cy="24" r="1.5" fill={color} />
      <circle cx="40" cy="24" r="1.5" fill={color} />
      <circle cx="8" cy="16" r="1" fill={color} opacity="0.5" />
      <circle cx="40" cy="16" r="1" fill={color} opacity="0.5" />
      <circle cx="8" cy="32" r="1" fill={color} opacity="0.5" />
      <circle cx="40" cy="32" r="1" fill={color} opacity="0.5" />
      {/* Data flow pulse */}
      <circle r="1.2" fill={color} opacity="0.9" className="icon-data-pulse">
        <animateMotion dur="2s" repeatCount="indefinite" path="M8,24 L16,24 L20,16 L28,16 L32,24 L40,24" />
      </circle>
      {/* Center glow */}
      <circle cx="24" cy="20" r="2" fill={color} opacity="0.3" className="icon-glow" />
    </svg>
  );
}

function RobotArmIcon({ color = 'var(--orange)', size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="domain-icon">
      {/* Base platform */}
      <rect x="10" y="38" width="28" height="4" rx="2" fill={color} opacity="0.2" />
      <rect x="14" y="36" width="20" height="3" rx="1.5" fill={color} opacity="0.35" />
      {/* Arm segments */}
      <g className="icon-arm">
        <line x1="24" y1="36" x2="24" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="28" x2="18" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" className="icon-arm-seg1" />
        <line x1="18" y1="20" x2="26" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="icon-arm-seg2" />
      </g>
      {/* Joint dots */}
      <circle cx="24" cy="28" r="2.5" fill={color} className="icon-joint" />
      <circle cx="18" cy="20" r="2" fill={color} className="icon-joint" />
      {/* Gripper */}
      <g className="icon-gripper">
        <line x1="26" y1="14" x2="30" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="26" y1="14" x2="28" y2="8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="30" cy="10" r="1" fill={color} />
        <circle cx="28" cy="8" r="1" fill={color} />
      </g>
      {/* Motion arcs */}
      <path d="M14 20 A8 8 0 0 1 22 14" stroke={color} strokeWidth="0.5" fill="none" opacity="0.2" strokeDasharray="2 2" className="icon-motion-arc" />
      {/* Sensor beams from gripper */}
      <line x1="29" y1="9" x2="34" y2="6" stroke={color} strokeWidth="0.4" opacity="0.3" strokeDasharray="1 2">
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1.5s" repeatCount="indefinite" />
      </line>
      <line x1="29" y1="9" x2="35" y2="9" stroke={color} strokeWidth="0.4" opacity="0.3" strokeDasharray="1 2">
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
      </line>
    </svg>
  );
}

function ServerStackIcon({ color = 'var(--sage)', size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="domain-icon">
      {/* Server boxes stacked */}
      <rect x="10" y="8" width="28" height="8" rx="2" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.06" />
      <rect x="10" y="19" width="28" height="8" rx="2" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1" />
      <rect x="10" y="30" width="28" height="8" rx="2" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.14" />
      {/* Status LEDs */}
      <circle cx="15" cy="12" r="1.2" fill={color}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="19" cy="12" r="1.2" fill={color} opacity="0.4" />
      <circle cx="15" cy="23" r="1.2" fill={color}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
      </circle>
      <circle cx="19" cy="23" r="1.2" fill={color}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="15" cy="34" r="1.2" fill={color}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
      </circle>
      <circle cx="19" cy="34" r="1.2" fill={color} opacity="0.6" />
      {/* Drive activity bars */}
      <rect x="30" y="11" width="5" height="2" rx="1" fill={color} opacity="0.3" />
      <rect x="30" y="22" width="5" height="2" rx="1" fill={color} opacity="0.5" />
      <rect x="30" y="33" width="5" height="2" rx="1" fill={color} opacity="0.4" />
      {/* Network lines flowing down */}
      <path d="M24 38v4" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <circle cx="24" cy="44" r="1.5" fill={color} opacity="0.2" />
      {/* Data flow dots */}
      <circle r="0.8" fill={color}>
        <animateMotion dur="1.2s" repeatCount="indefinite" path="M24,8 L24,38" />
        <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function BlueprintIcon({ color = 'var(--charcoal)', size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="domain-icon">
      {/* Blueprint paper */}
      <rect x="8" y="8" width="32" height="32" rx="2" fill={color} fillOpacity="0.04" stroke={color} strokeWidth="0.8" />
      {/* Grid lines */}
      <g opacity="0.12">
        <line x1="8" y1="16" x2="40" y2="16" stroke={color} strokeWidth="0.3" />
        <line x1="8" y1="24" x2="40" y2="24" stroke={color} strokeWidth="0.3" />
        <line x1="8" y1="32" x2="40" y2="32" stroke={color} strokeWidth="0.3" />
        <line x1="16" y1="8" x2="16" y2="40" stroke={color} strokeWidth="0.3" />
        <line x1="24" y1="8" x2="24" y2="40" stroke={color} strokeWidth="0.3" />
        <line x1="32" y1="8" x2="32" y2="40" stroke={color} strokeWidth="0.3" />
      </g>
      {/* 3D wireframe object */}
      <g className="icon-blueprint-obj">
        <polygon points="20,18 30,14 36,20 26,24" fill="none" stroke={color} strokeWidth="0.8" />
        <polygon points="20,18 20,28 26,34 26,24" fill="none" stroke={color} strokeWidth="0.8" />
        <polygon points="26,24 36,20 36,30 26,34" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="0.8" />
      </g>
      {/* Dimension lines */}
      <g opacity="0.3">
        <line x1="20" y1="36" x2="26" y2="36" stroke={color} strokeWidth="0.5" />
        <line x1="20" y1="35" x2="20" y2="37" stroke={color} strokeWidth="0.5" />
        <line x1="26" y1="35" x2="26" y2="37" stroke={color} strokeWidth="0.5" />
      </g>
      {/* Cursor/pen */}
      <circle cx="33" cy="27" r="1" fill={color} opacity="0.6" className="icon-pen-cursor">
        <animate attributeName="cx" values="33;35;33" dur="3s" repeatCount="indefinite" />
        <animate attributeName="cy" values="27;25;27" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function TranspilerIcon({ color = 'var(--orange)', size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="domain-icon">
      {/* Central Engine Core */}
      <rect x="18" y="18" width="12" height="12" rx="2" stroke={color} strokeWidth="1.2" fill="none" className="icon-chip" />
      <circle cx="24" cy="24" r="3" fill={color} className="icon-pulse-center">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
      
      {/* Input Side (Abstracted logic dots) */}
      <g opacity="0.4">
        <circle cx="8" cy="16" r="1.5" fill={color} />
        <circle cx="12" cy="24" r="1.5" fill={color} />
        <circle cx="8" cy="32" r="1.5" fill={color} />
        <path d="M8 16 L18 24 M12 24 L18 24 M8 32 L18 24" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" />
      </g>
      
      {/* Output Side (Structured code blocks) */}
      <g opacity="0.6">
        <rect x="34" y="12" width="8" height="2" rx="1" fill={color} />
        <rect x="34" y="18" width="10" height="2" rx="1" fill={color} />
        <rect x="34" y="24" width="6" height="2" rx="1" fill={color} />
        <rect x="34" y="30" width="9" height="2" rx="1" fill={color} />
        <path d="M30 24 L34 13 M30 24 L34 19 M30 24 L34 25 M30 24 L34 31" stroke={color} strokeWidth="0.5" />
      </g>
      
      {/* Processing Pulse */}
      <circle r="1.2" fill={color} opacity="0.9">
        <animateMotion dur="2s" repeatCount="indefinite" path="M12,24 Q18,24 24,24 T36,24" />
      </circle>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SKILL ORBIT — Floating skill tags that orbit a card
   ═══════════════════════════════════════════════════════════ */

function SkillOrbit({ skills, color, radius = 100 }) {
  return (
    <div className="skill-orbit-container">
      {skills.map((skill, i) => {
        const angle = (i / skills.length) * 360;
        const animDelay = i * 0.15;
        return (
          <motion.span
            key={skill}
            className="skill-orbit-tag"
            style={{
              '--orbit-angle': `${angle}deg`,
              '--orbit-radius': `${radius}px`,
              '--orbit-delay': `${-i * (20 / skills.length)}s`,
              color: color,
              borderColor: color,
            }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + animDelay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {skill}
          </motion.span>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ARCHITECTURE CARD — Premium glassmorphic card with
   animated borders, noise texture, and interactive depth
   ═══════════════════════════════════════════════════════════ */

function ArchCard({ children, className = '', delay = 0, accentColor = 'var(--green)', index = 0 }) {
  const ref = useRef(null);
  const glareRef = useRef(null);
  const borderRef = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-8%' });
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Focus effect: peaks at the center (0.5 progress)
  const scrollScale = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [1, 1.04, 1]);
  const scrollOpacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0.8, 1, 0.8]);
  const scrollGlow = useTransform(scrollYProgress, [0.4, 0.5, 0.6], 
    ["0px 0px 0px rgba(0,0,0,0)", "0px 20px 40px rgba(0,0,0,0.12)", "0px 0px 0px rgba(0,0,0,0)"]
  );

  const handleMove = useCallback((e) => {
    if (!ref.current || isMobile) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setMousePos({ x, y });
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(400px at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.08), transparent 60%)`;
    }
    if (borderRef.current) {
      borderRef.current.style.background = `radial-gradient(300px at ${x * 100}% ${y * 100}%, ${accentColor}, transparent 60%)`;
    }
  }, [accentColor, isMobile]);

  const handleLeave = useCallback(() => {
    setMousePos({ x: 0.5, y: 0.5 });
    if (glareRef.current) glareRef.current.style.background = 'transparent';
    if (borderRef.current) borderRef.current.style.background = 'transparent';
  }, []);

  const tiltX = isMobile ? 0 : (mousePos.y - 0.5) * -8;
  const tiltY = isMobile ? 0 : (mousePos.x - 0.5) * 8;

  return (
    <motion.div
      ref={ref}
      className={`arch-card ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 40, rotateX: 6 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
      style={{
        transform: isMobile ? undefined : `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        scale: isMobile ? scrollScale : 1,
        boxShadow: isMobile ? scrollGlow : undefined,
        opacity: isMobile ? scrollOpacity : 1,
        '--accent': accentColor,
        zIndex: isMobile ? 1 : undefined
      }}
    >
      {/* Animated gradient border */}
      <div ref={borderRef} className="arch-card-border-glow" />
      {/* Inner content */}
      <div className="arch-card-inner">
        {children}
      </div>
      {/* Glare overlay */}
      <div ref={glareRef} className="arch-card-glare" />
      {/* Noise texture */}
      <div className="arch-card-noise" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LIVE METRIC — Animated typing metric with blinking cursor
   ═══════════════════════════════════════════════════════════ */

function LiveMetric({ value, label, color }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!isInView) return;
    let idx = 0;
    const str = value;
    const interval = setInterval(() => {
      setDisplay(str.slice(0, idx + 1));
      idx++;
      if (idx >= str.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [isInView, value]);

  return (
    <div ref={ref} className="live-metric">
      <span className="live-metric-value" style={{ color }}>{display}<span className="live-metric-cursor">|</span></span>
      <span className="live-metric-label">{label}</span>
    </div>
  );
}

/* ──── PARALLAX INNER ──── */
function ParallaxInner({ children, className = '', factor = 0.04 }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - left - width / 2) * factor, y: (e.clientY - top - height / 2) * factor });
  }, [factor]);
  return (
    <div ref={ref} className={className} onMouseMove={handleMove} onMouseLeave={() => setOffset({ x: 0, y: 0 })} style={{ overflow: 'hidden' }}>
      <div className="parallax-inner" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`, transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {children}
      </div>
    </div>
  );
}

/* ──── ELASTIC BUTTON ──── */
function ElasticButton({ children, className = '', href, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 350, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 350, damping: 15, mass: 0.1 });
  const handleMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - left - width / 2) * 0.4); y.set((e.clientY - top - height / 2) * 0.4);
  };
  const Tag = href ? motion.a : motion.div;
  return <Tag ref={ref} className={`elastic-btn hover-target ${className}`} onMouseMove={handleMove} onMouseLeave={() => { x.set(0); y.set(0); }} style={{ x: springX, y: springY }} href={href} {...props}>{children}</Tag>;
}

/* ──── SCROLL VELOCITY TEXT ──── */
function VelocityText({ children, className = '' }) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 60, stiffness: 300 });
  const skewX = useTransform(smoothVelocity, [-3000, 0, 3000], [-3, 0, 3]);
  const scaleX = useTransform(smoothVelocity, [-3000, 0, 3000], [1.015, 1, 1.015]);
  return <motion.div className={className} style={{ skewX, scaleX, transformOrigin: 'center center' }}>{children}</motion.div>;
}

/* ──── REVEAL TEXT (Enhanced with rotateX + scale) ──── */
const RevealText = ({ text, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-8%' });
  return (
    <span ref={ref} className={className} style={{ display: 'flex', overflow: 'hidden' }}>
      {text.split('').map((char, i) => (
        <motion.span key={i} style={{ display: 'inline-block' }}
          initial={{ y: '120%', opacity: 0, rotateX: -80, scale: 0.8 }}
          animate={isInView ? { y: '0%', opacity: 1, rotateX: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.04, rotateX: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.04 } }}
        >{char === ' ' ? '\u00A0' : char}</motion.span>
      ))}
    </span>
  );
};

/* ──── FADE UP (with blur) ──── */
const FadeUp = ({ children, className = '', delay = 0, y = 35 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-6%' });
  return <motion.div ref={ref} className={className} initial={{ opacity: 0, y, filter: 'blur(4px)' }} animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}>{children}</motion.div>;
};

/* ═══════════════════════════════════════════════════════════
   HORIZONTAL PROJECTS (with 3D tilt + parallax + scramble)
   ═══════════════════════════════════════════════════════════ */

function HorizontalProjects() {
  const targetRef = useRef(null);
  const checkMobile = () => typeof window !== 'undefined' && (window.innerWidth <= 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  const [isMobile, setIsMobile] = useState(checkMobile);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-82%']);
  // Scroll-linked 3D rotation per card
  const rotateY1 = useTransform(scrollYProgress, [0, 0.2, 0.4], [8, 0, -3]);
  const rotateY2 = useTransform(scrollYProgress, [0.1, 0.35, 0.55], [8, 0, -3]);
  const rotateY3 = useTransform(scrollYProgress, [0.2, 0.5, 0.7], [8, 0, -3]);
  const rotateY4 = useTransform(scrollYProgress, [0.3, 0.6, 0.8], [8, 0, -3]);
  const rotateY5 = useTransform(scrollYProgress, [0.4, 0.7, 0.9], [8, 0, -3]);
  const rotateY6 = useTransform(scrollYProgress, [0.5, 0.8, 1.0], [8, 0, -3]);
  const rotations = [rotateY1, rotateY2, rotateY3, rotateY4, rotateY5, rotateY6];

  useEffect(() => {
    const update = () => setIsMobile(checkMobile());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleScroll = (e) => {
    if (!hasScrolled && e.target.scrollLeft > 100) {
      setHasScrolled(true);
    }
  };

  const PROJECTS = [
    { title: 'NASA HERC Rover', year: '2024—25', description: "Organized by NASA", role: 'Construction Lead', summary: 'Engineered a human-powered lunar vehicle for NASA, optimizing for chassis resilience and mechanical drivetrain efficiency.', tech: ['SolidWorks', 'Mechanical Design', 'Control Systems', 'PID Control', 'Sensors', 'Telemetry', 'C++', 'Arduino', 'Power Distribution', 'Chassis Design'], accent: 'var(--orange)', icon: RobotArmIcon },
    { title: 'NatLang', year: '2026—CURR', description: "AI Transpilation Engine", role: 'Systems Architect', summary: 'An AI-powered VS Code extension that enables real-time natural language transpilation via local LLM orchestration.', tech: ['TypeScript', 'Java', 'VS Code API', 'Ollama', 'LLMs', 'AST Parsing', 'Transpilation', 'Node.js', 'Real-time Streaming', 'Distributed Architecture'], github: 'https://github.com/HarshBavaskar/Natlang-Extension', accent: 'var(--orange)', icon: TranspilerIcon },
    { title: 'Polaris', year: '2026—CURR', description: "AI Early Warning System", role: 'Lead AI Engineer', summary: 'A sophisticated environmental anomaly detection system leveraging custom CNN-LSTM architectures for predictive intelligence.', tech: ['PyTorch', 'TensorFlow', 'Python', 'CNN', 'LSTM', 'React', 'Time-series', 'FastAPI', 'Docker', 'Scikit-learn'], github: 'https://github.com/HarshBavaskar/Polaris', accent: 'var(--orange)', icon: NeuralNetworkIcon },
    { title: 'Block Ballot', year: '2026—CURR', description: "Blockchain Voting System", role: 'Full Stack Blockchain', summary: 'A decentralized, tamper-proof voting platform utilizing Merkle Trees and cryptographic hashing for secure electoral management.', tech: ['Spring Boot', 'Cryptography', 'Merkle Tree', 'Blockchain', 'Solidity', 'Smart Contracts', 'Java', 'PostgreSQL', 'JWT Authentication', 'Web3.js'], github: 'https://github.com/HarshBavaskar/BlockBallot', accent: 'var(--orange)', icon: Shield },
    { title: 'PRISMRx', year: '2025', description: "Polypharmacy AI Analyzer", role: 'Lead Developer', summary: 'A data-driven polypharmacy analyzer using machine learning to detect and mitigate adverse drug-drug interactions.', tech: ['Machine Learning', 'Data Pipelines', 'React', 'Flask', 'Pandas', 'NumPy', 'Scikit-learn', 'Healthcare AI', 'REST API', 'Azure ML'], github: 'https://github.com/HarshBavaskar/PrismRX-AI', accent: 'var(--orange)', icon: FlaskConical },
    { title: 'AIROBOT', year: '2024—25', description: "Autonomous Home Robot", role: 'Hardware Integration', summary: 'An autonomous indoor surveillance robot featuring real-time LiDAR mapping, obstacle avoidance, and human detection pipelines.', tech: ['Arduino', 'ESP32', 'OpenCV', 'Computer Vision', 'LiDAR', 'SLAM', 'Embedded C++', 'FreeRTOS', 'Sensor Fusion', 'Raspberry Pi'], accent: 'var(--orange)', icon: CircuitBoardIcon },
  ];

  const ProjectCard = ({ proj, i, isMobile, rotations }) => {
    const ref = useRef(null);
    const { scrollXProgress } = useScroll({
      target: ref,
      offset: ["start end", "end start"]
    });

    // Horizontal focus effect
    const scale = useTransform(scrollXProgress, [0.4, 0.5, 0.6], [1, 1.05, 1]);
    const glow = useTransform(scrollXProgress, [0.45, 0.5, 0.55], 
      ["0px 0px 0px rgba(255, 92, 0, 0)", "0px 15px 45px rgba(255, 92, 0, 0.25)", "0px 0px 0px rgba(255, 92, 0, 0)"]
    );
    const opacity = useTransform(scrollXProgress, [0.2, 0.5, 0.8], [0.85, 1, 0.85]);

    const Icon = proj.icon;
    const inner = (
      <ParallaxInner factor={0.025}>
        <div className="card-dot-layer" />
        <div className="arch-bg-illustration arch-bg-pos-br" style={{ opacity: 0.15 }}>
          <Icon color={proj.accent} size={220} />
        </div>
        <span className="project-bg-text">0{i + 1}</span>
        <div className="project-content">
          <div className="project-top">
            <span className="project-index">0{i + 1}</span>
            <span className="project-year">{proj.year}</span>
          </div>
          <div className="project-bottom">
            <div className="project-role" style={{ color: proj.accent }}>{proj.role}</div>
            {proj.github && <div className="project-link-hint">GitHub <ArrowUpRight size={11} /></div>}
            <h6>{proj.description}</h6>
            <GlintText text={proj.title} as="h3" />
            <p className="project-summary">{proj.summary}</p>
            <div className="project-tech">{proj.tech.map((t, idx) => <span key={idx} className="tech-tag">{t}</span>)}</div>
          </div>
        </div>
      </ParallaxInner>
    );

    const cardEl = (
      <motion.div 
        ref={ref}
        className="project-card view-target" 
        style={{ 
          rotateY: isMobile ? 0 : rotations[i], 
          perspective: 1000,
          scale: isMobile ? scale : 1,
          boxShadow: isMobile ? glow : undefined,
          opacity: isMobile ? opacity : 1,
          zIndex: isMobile ? 10 : 1
        }}
      >
        <TiltCard intensity={isMobile ? 0 : 8} glareIntensity={isMobile ? 0 : 0.06}>{inner}</TiltCard>
      </motion.div>
    );

    return proj.github ? (
      <a href={proj.github} target="_blank" rel="noreferrer" className="project-card-wrapper project-card-link">
        {cardEl}
      </a>
    ) : (
      <div className="project-card-wrapper">
        {cardEl}
      </div>
    );
  };

  return (
    <div ref={targetRef} className="horizontal-scroll-container">
      <div className="horizontal-scroll-sticky">
        {isMobile && (
          /* ... indicator code ... */
          <AnimatePresence>
            {!hasScrolled && (
              <div className="mobile-swipe-indicator-wrapper">
                <motion.div 
                  className="mobile-swipe-indicator"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="mono-small" style={{ color: 'var(--orange)' }}>SWIPE TO VIEW</span>
                  <svg width="60" height="12" viewBox="0 0 60 12" fill="none">
                    <path d="M 0 6 L 55 6" stroke="currentColor" opacity="0.1" strokeWidth="1" strokeLinecap="round" />
                    <motion.path
                      d="M 0 6 L 55 6"
                      stroke="var(--orange)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "15 60", strokeDashoffset: 15 }}
                      animate={{ strokeDashoffset: -60 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ filter: "drop-shadow(0 0 4px rgba(255, 92, 0, 0.6))" }}
                    />
                    <motion.path
                      d="M 51 2 L 56 6 L 51 10"
                      stroke="var(--orange)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ filter: "drop-shadow(0 0 4px rgba(255, 92, 0, 0.5))" }}
                    />
                  </svg>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        )}
        <motion.div style={isMobile ? undefined : { x }} className="horizontal-scroll-wrap" onScroll={isMobile ? handleScroll : undefined} onTouchMove={isMobile ? handleScroll : undefined}>
          {!isMobile && <div style={{ paddingRight: '8vw' }} />}
          {PROJECTS.map((proj, i) => (
            <ProjectCard key={i} proj={proj} i={i} isMobile={isMobile} rotations={rotations} />
          ))}
          {!isMobile && <div style={{ paddingRight: '10vw' }} />}
        </motion.div>
      </div>
    </div>
  );
}

/* ──── ACCORDION (enhanced) ──── */
function AccordionItem({ year, title, children, accent = 'var(--text-muted)' }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <FadeUp className="timeline-item hover-target" y={20}>
      <div className="timeline-visual-wrap">
        <div className="timeline-track" />
        <div className="timeline-node" style={{ '--node-color': accent }} />
      </div>
      <div className="timeline-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tl-year">{year}</div>
        <GlintText text={title} as="div" className="tl-title" />
        <div className="tl-arrow">
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6" /></svg>
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0, filter: 'blur(6px)' }} animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }} exit={{ height: 0, opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="timeline-content-wrap">
            <div className="timeline-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </FadeUp>
  );
}

/* ──── BENTO CARD (3D tilt) ──── — kept for backward compat */
function BentoCard({ children, className = '', delay = 0 }) {
  return <TiltCard className={`bento-item ${className}`} intensity={10} glareIntensity={0.05} delay={delay}>{children}</TiltCard>;
}

/* ═══════════════════════════════════════════════════════════
   MAGNETIC HERO TITLE — Letters react to mouse proximity
   ═══════════════════════════════════════════════════════════ */

function MagneticLetter({ char, index, totalLen }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.2 });

  useEffect(() => {
    const handle = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 250;
      if (dist < maxDist) {
        const force = (1 - dist / maxDist) * 18;
        x.set(dx * force / maxDist);
        y.set(dy * force / maxDist);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, [x, y]);

  return (
    <motion.span
      ref={ref}
      style={{ display: 'inline-block', x: springX, y: springY, willChange: 'transform' }}
      initial={{ y: '120%', opacity: 0, rotateX: -80, scale: 0.8 }}
      animate={{ y: '0%', opacity: 1, rotateX: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 + index * 0.04 }}
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
}

function MagneticTitle({ text, className = '' }) {
  return (
    <span className={className} style={{ display: 'flex', overflow: 'hidden' }}>
      {text.split('').map((char, i) => (
        <MagneticLetter key={i} char={char} index={i} totalLen={text.length} />
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLE CYCLER — Cycles through roles with clip animation
   ═══════════════════════════════════════════════════════════ */

const ROLES = ['AI/ML Engineer', 'Robotics Lead', 'Full Stack Developer', 'Computer Vision Engineer', 'Embedded Systems'];

function RoleCycler() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % ROLES.length), 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="role-cycler">
      <span className="role-label">Currently →</span>
      <div className="role-slot">
        <AnimatePresence mode="wait">
          <motion.span
            key={ROLES[index]}
            className="role-text"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {ROLES[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}/* ──────────────────── HERO PERSPECTIVE ──────────────────── */
function HeroPerspective({ children }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-300, 300], [4, -4]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-500, 500], [-6, 6]), { stiffness: 100, damping: 30 });

  const handleMove = (e) => {
    x.set(e.clientX - window.innerWidth / 2);
    y.set(e.clientY - window.innerHeight / 2);
  };

  return (
    <motion.div onMouseMove={handleMove} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, perspective: '1200px', transformStyle: 'preserve-3d', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────── HUD DECALS ──────────────────── */
function HUDDecals({ progress }) {
  const y1 = useTransform(progress, [0, 1], [0, -150]);
  const y2 = useTransform(progress, [0, 1], [0, -220]);
  const rotate = useTransform(progress, [0, 1], [0, 45]);

  return (
    <div className="hero-hud-layer">
      <motion.div className="hero-decal decal-1" style={{ y: y1, rotate }}>
        <span className="mono-small">SYSTEM_STABLE // 0xCC4A00</span>
        <div className="decal-line" />
      </motion.div>
      <motion.div className="hero-decal decal-2" style={{ y: y2 }}>
        <div className="decal-cross" />
        <span className="mono-small">LAT: 19.07 | LNG: 72.87</span>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════ */

const SKILLS_LIST = ['PYTORCH', 'TENSORFLOW', 'YOLOv8', 'OPENCV', 'DOCKER', 'REACT', 'THREE.JS', 'FLASK', 'SPRING BOOT', 'REDIS', 'ARDUINO', 'ESP32', 'MONGODB', 'POSTGRESQL'];

export default function App() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const yHero = useTransform(heroProgress, [0, 1], [0, 120]);
  const opacityHero = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const scaleHero = useTransform(heroProgress, [0, 1], [1, 0.95]);
  // Hero Title parallax (different speeds per line)
  const yLine1 = useTransform(heroProgress, [0, 1], [0, 50]);
  const yLine2 = useTransform(heroProgress, [0, 1], [0, 90]);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => { const t = setTimeout(() => setHasLoaded(true), 200); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (isDark) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [isDark]);

  return (
    <>
      <PhysicsCursor isDark={isDark} />
      <WebGLBackground isDark={isDark} />
      <DotMatrix isDark={isDark} />

      <main>
        {/* ── HERO ── */}
        <section className="hero" ref={heroRef}>
          <header className={`hero-header grain-zone ${hasLoaded ? 'header-ready' : ''}`}>
            <motion.div initial={{ opacity: 0, x: -25 }} animate={hasLoaded ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}>
              <ElasticButton className="logo hover-target"><HBLogo size={30} /></ElasticButton>
            </motion.div>
            <div className="hero-right">
              <motion.div initial={{ opacity: 0, y: -15 }} animate={hasLoaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}>
                <ElasticButton href="mailto:hbavaskar6@gmail.com" className="availability" target="_blank">
                  <span /> OPEN TO COLLABORATE
                </ElasticButton>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 25 }} animate={hasLoaded ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}>
                <button className="theme-toggle hover-target" onClick={() => setIsDark(!isDark)}>
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </motion.div>
            </div>
          </header>

          {/* Floating corner coordinates */}
          <motion.div className="hero-coord hero-coord-tl" initial={{ opacity: 0 }} animate={hasLoaded ? { opacity: 1 } : {}} transition={{ delay: 1.5, duration: 0.8 }}>
            <span className="mono-small">19.0760° N</span>
          </motion.div>
          <motion.div className="hero-coord hero-coord-br" initial={{ opacity: 0 }} animate={hasLoaded ? { opacity: 1 } : {}} transition={{ delay: 1.7, duration: 0.8 }}>
            <span className="mono-small">72.8777° E</span>
          </motion.div>

          <HeroPerspective>
            <motion.div className="container hero-main grain-zone cursor-invert-surface" style={{ y: yHero, opacity: opacityHero, scale: scaleHero }}>
              <VelocityText className="hero-titles">
                <h1 className="title-massive">
                  <motion.div style={{ y: yLine1, rotateX: useTransform(heroProgress, [0, 1], [0, 15]) }}>
                    <MagneticTitle text="HARSH" className="hero-line" />
                  </motion.div>
                  <motion.div style={{ y: yLine2, rotateX: useTransform(heroProgress, [0, 1], [0, -10]) }}>
                    <MagneticTitle text="BAVASKAR." className="hero-line" />
                  </motion.div>
                </h1>
              </VelocityText>

              {/* Floating HUD Decals — Depth Layering */}
              <HUDDecals progress={heroProgress} />

              <div className="hero-bottom-row">
                <RoleCycler />
                <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={hasLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}} transition={{ delay: 1.3, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
                  <ScrollFillText text="Building intelligent software, computer vision pipelines, and embedded robotics — combining AI models, scalable backends, and hardware to solve real-world problems." />
                </motion.p>
              </div>

              {/* Interactive hero tags */}
              <motion.div className="hero-tags" initial={{ opacity: 0, y: 14 }} animate={hasLoaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                {['AI/ML', 'ROBOTICS', 'COMPUTER VISION', 'EMBEDDED', 'FULL STACK'].map((tag, i) => (
                  <motion.span key={tag} className="hero-tag hover-target" whileHover={{ scale: 1.12, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                    <GlintText text={tag} />
                  </motion.span>
                ))}
              </motion.div>

              {/* View Work CTA */}
              <motion.div className="hero-cta-wrap" initial={{ opacity: 0 }} animate={hasLoaded ? { opacity: 1 } : {}} transition={{ delay: 1.9, duration: 1 }}>
                <a href="#work" className="hero-cta hover-target">
                  View Work
                  <ChevronDown className="hero-cta-arrow" size={18} />
                </a>
              </motion.div>
            </motion.div>
          </HeroPerspective>

          <motion.div className="scroll-indicator" initial={{ opacity: 0 }} animate={hasLoaded ? { opacity: 1 } : {}} transition={{ delay: 1.8, duration: 1 }}>
            <div className="scroll-line"><div className="scroll-progress-line" /></div>
          </motion.div>
        </section>

        {/* ── KINETIC DIVIDER ── */}
        <KineticDivider text="◆" count={40} />

        {/* ── STATS ROW ── */}
        <section className="section container">
          <div className="stats-row grain-zone">
            <AnimatedCounter value="5" suffix="+" label="Projects Built" />
            <AnimatedCounter value="18" suffix="" label="Team Members Led" />
            <AnimatedCounter value="3" suffix="" label="Awards Won" />
            <AnimatedCounter value="2" suffix="+" label="Years Experience" />
          </div>
        </section>

        {/* ── ARCHITECTURE & TOOLKIT ── */}
        <section className="section container arch-section">
          <FadeUp className="section-header-wrap arch-header grain-zone">
            <span className="mono-small">Core Competencies</span>
            <h2 className="title-medium">Architecture <br /> & <span className="serif-accent">Toolkit</span></h2>
            <p className="arch-section-subtitle">Five interconnected disciplines, one unified engineering philosophy — from silicon to screen.</p>
          </FadeUp>

          <div className="arch-grid grain-zone">
            {/* ─── AI & Machine Learning — Hero card ─── */}
            <ArchCard className="arch-hero-card code-target" delay={0} accentColor="var(--green)" index={0}>
              {/* Background illustration — large neural net watermark */}
              <div className="arch-bg-illustration arch-bg-pos-tr">
                <NeuralNetworkIcon color="var(--green)" size={220} />
              </div>
              <div className="arch-card-header">
                <div className="arch-card-meta">
                  <span className="arch-card-number">01</span>
                  <LiveMetric value="9 frameworks" label="in active use" color="var(--green)" />
                </div>
              </div>
              <div className="arch-card-body">
                <h3 className="arch-card-title">Artificial Intelligence<br />& <span className="serif-accent">Machine Learning</span></h3>
                <p className="arch-card-desc">Architecting neural networks for real-time computer vision, predictive anomaly detection, and natural language understanding — from training pipelines to production inference.</p>
              </div>
              <div className="arch-card-footer">
                <div className="arch-tech-cloud">
                  {['PyTorch', 'TensorFlow', 'YOLOv8', 'OpenCV', 'Transformers', 'RAG', 'LangChain', 'HuggingFace', 'MLOps', 'DeepSORT', 'Computer Vision', 'Neural Networks', 'CUDA', 'Autoencoders'].map((t, i) => (
                    <motion.span
                      key={t}
                      className="arch-tech-pill"
                      style={{ '--pill-accent': 'var(--green)' }}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </div>
            </ArchCard>

            {/* ─── Frontend & Interfaces — Side card ─── */}
            <ArchCard className="arch-side-card" delay={0.08} accentColor="var(--lavender)" index={1}>
              {/* Background illustration — circuit board watermark */}
              <div className="arch-bg-illustration arch-bg-pos-br">
                <CircuitBoardIcon color="var(--lavender)" size={200} />
              </div>
              <div className="arch-card-header">
                <span className="arch-card-number">02</span>
              </div>
              <div className="arch-card-body">
                <h3 className="arch-card-title">Frontend &<br /><span className="serif-accent">Interfaces</span></h3>
                <p className="arch-card-desc">Crafting immersive, performant interfaces with WebGL shaders, physics-based animations, and modern component architectures.</p>
              </div>
              <div className="arch-card-footer">
                <div className="arch-tech-cloud">
                  {['React', 'Three.js', 'Framer Motion', 'GSAP', 'WebGL', 'TailwindCSS', 'TypeScript', 'Next.js', 'Flutter', 'Redux', 'Vite', 'Canvas API', 'SVG Animation', 'Shader Material'].map((t, i) => (
                    <motion.span key={t} className="arch-tech-pill" style={{ '--pill-accent': 'var(--lavender)' }}
                      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.04 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                    >{t}</motion.span>
                  ))}
                </div>
              </div>
            </ArchCard>

            {/* ─── Hardware & Robotics — Wide landscape card ─── */}
            <ArchCard className="arch-landscape-card" delay={0.14} accentColor="var(--orange)" index={2}>
              {/* Background illustration — robot arm spanning the left side */}
              <div className="arch-bg-illustration arch-bg-pos-cl">
                <RobotArmIcon color="var(--orange)" size={260} />
              </div>
              <div className="arch-landscape-layout">
                <div className="arch-landscape-left">
                  <div className="arch-tech-cloud">
                    {['Arduino', 'ESP32', 'Raspberry Pi', 'ROS 2', 'LiDAR', 'OpenCV', 'Embedded C++', 'PCB Design', 'Sensor Fusion', 'FreeRTOS', 'Inverse Kinematics', 'PID Tuning', 'SLAM', 'NVIDIA Jetson'].map((t, i) => (
                      <motion.span key={t} className="arch-tech-pill" style={{ '--pill-accent': 'var(--orange)' }}
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.04 }}
                        whileHover={{ scale: 1.08, y: -2 }}
                      >{t}</motion.span>
                    ))}
                  </div>
                </div>
                <div className="arch-landscape-right">
                  <div className="arch-card-meta">
                    <span className="arch-card-number">03</span>
                    <LiveMetric value="12+ robotic systems" label="deployed & tested" color="var(--orange)" />
                  </div>
                  <h3 className="arch-card-title">Hardware &<br /><span className="serif-accent">Robotics</span></h3>
                  <p className="arch-card-desc">From embedded firmware to sensor fusion — designing autonomous systems that bridge the digital‑physical divide.</p>
                </div>
              </div>
            </ArchCard>

            {/* ─── Backend Architecture — Wide card ─── */}
            <ArchCard className="arch-wide-card" delay={0.20} accentColor="var(--sage)" index={3}>
              {/* Background illustration — server stack watermark */}
              <div className="arch-bg-illustration arch-bg-pos-r">
                <ServerStackIcon color="var(--sage)" size={200} />
              </div>
              <div className="arch-card-header">
                <div className="arch-card-meta">
                  <span className="arch-card-number">04</span>
                  <LiveMetric value="8 systems" label="battle‑tested" color="var(--sage)" />
                </div>
              </div>
              <div className="arch-card-body">
                <h3 className="arch-card-title">Backend <span className="serif-accent">Architecture</span></h3>
                <p className="arch-card-desc">Engineering resilient API layers, distributed data pipelines, and secure authentication flows — built to sustain thousands of concurrent connections without breaking a sweat.</p>
              </div>
              <div className="arch-card-footer">
                <div className="arch-tech-cloud">
                  {['Spring Boot', 'Flask', 'Node.js', 'Docker', 'Kubernetes', 'Microservices', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'GraphQL', 'Azure', 'JWT Auth', 'Elasticsearch'].map((t, i) => (
                    <motion.span key={t} className="arch-tech-pill" style={{ '--pill-accent': 'var(--sage)' }}
                      initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.04 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                    >{t}</motion.span>
                  ))}
                </div>
              </div>
            </ArchCard>

            {/* ─── Prototyping & CAD — Compact accent card ─── */}
            <ArchCard className="arch-compact-card" delay={0.26} accentColor="var(--charcoal)" index={4}>
              {/* Background illustration — blueprint watermark */}
              <div className="arch-bg-illustration arch-bg-pos-tl">
                <BlueprintIcon color="var(--charcoal)" size={190} />
              </div>
              <div className="arch-card-header">
                <span className="arch-card-number">05</span>
              </div>
              <div className="arch-card-body">
                <h3 className="arch-card-title">Prototyping &<br /><span className="serif-accent">CAD</span></h3>
                <p className="arch-card-desc">Precision‑modeling in Fusion 360, SolidWorks & RhinoCAD, then materializing designs via FDM and SLA additive manufacturing.</p>
              </div>
              <div className="arch-card-footer">
                <div className="arch-tech-cloud">
                  {['Fusion 360', 'SolidWorks', 'RhinoCAD', '3D Printing', 'AutoCAD', 'Generative Design', 'FEA', 'DFM', 'Keyshot', 'Mesh Processing', 'Additive Manufacturing', 'Laser Cutting'].map((t, i) => (
                    <motion.span key={t} className="arch-tech-pill" style={{ '--pill-accent': 'var(--charcoal)' }}
                      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                    >{t}</motion.span>
                  ))}
                </div>
              </div>
            </ArchCard>
          </div>
        </section>

        {/* ── KINETIC DIVIDER ── */}
        <KineticDivider text="→" count={35} />

        {/* ── PROJECTS ── */}
        <section id="work" className="section" style={{ padding: '8rem 0 0 0' }}>
          <FadeUp className="container section-header-wrap featured-heading grain-zone" style={{ borderBottom: 'none', marginBottom: 0 }}>
            <span className="mono-small">Selected Work</span>
            <h2 className="title-medium">Featured <br /><span className="serif-accent">Engineering</span></h2>
          </FadeUp>
          <HorizontalProjects />
        </section>

        {/* ── KINETIC DIVIDER ── */}
        <KineticDivider text="●" count={45} />

        {/* ── TIMELINE ── */}
        <section className="section container">
          <FadeUp className="section-header-wrap grain-zone">
            <span className="mono-small">Chronology</span>
            <h2 className="title-medium" style={{ whiteSpace: 'nowrap', fontSize: 'clamp(1.5rem, 8vw, 4rem)' }}>Journey & <span className="serif-accent">Leadership</span></h2>
          </FadeUp>
          <div className="timeline-container grain-zone">
            <AccordionItem year="2025—CUR" title="Head of Robotics" accent="var(--orange)">
              <div className="organization-name" style={{ color: 'var(--green)', marginBottom: '0.5rem', fontWeight: 600 }}>SPARC Society — Atlas Skilltech University</div>
              Leading the entire Robotics Department. Organizing events, workshops, and inter-university competitions.
            </AccordionItem>
            <AccordionItem year="2024—25" title="Rover Construction Lead" accent="var(--orange)">
              <div className="organization-name" style={{ color: 'var(--orange)', marginBottom: '0.5rem', fontWeight: 600 }}>Team MUSHAK — NASA HERC</div>
              Led a team of 18 members focusing on mechanical and electrical systems integration for a rugged rover.
            </AccordionItem>
            <AccordionItem year="2024—28" title="Computer Science Student" accent="var(--orange)">
              <div className="organization-name" style={{ color: 'var(--lavender)', marginBottom: '0.5rem', fontWeight: 600 }}>Atlas Skilltech University</div>
              BTech specialization in AI & Machine Learning. Deep-learning mathematics, data structures, architecture.
            </AccordionItem>
            <AccordionItem year="Awards" title="NASA HERC Recognitions" accent="var(--orange)">
              <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                <div><div style={{ color: 'var(--orange)', fontSize: '1.3rem', fontWeight: 700 }}>5th Global</div><div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>RC Division — NASA HERC 2025</div></div>
                <div><div style={{ color: 'var(--green)', fontSize: '1.3rem', fontWeight: 700 }}>Social Media Award</div><div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>University Division — NASA HERC 2025</div></div>
              </div>
            </AccordionItem>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer container grain-zone">
          <FadeUp>
            <a href="mailto:hbavaskar6@gmail.com" className="footer-cta hover-target">
              Let's build <span>Something →</span>
            </a>
          </FadeUp>
          <div className="footer-bottom">
            <div className="footer-links">
              <ElasticButton href="mailto:hbavaskar6@gmail.com" className="footer-link" target="_blank"><Mail size={13} /> Email <ArrowUpRight size={11} /></ElasticButton>
              <ElasticButton href="https://github.com/HarshBavaskar" className="footer-link" target="_blank" rel="noreferrer"><Github size={13} /> Github <ArrowUpRight size={11} /></ElasticButton>
              <ElasticButton href="https://linkedin.com/in/harsh-bavaskar" className="footer-link" target="_blank" rel="noreferrer"><Linkedin size={13} /> LinkedIn <ArrowUpRight size={11} /></ElasticButton>
            </div>
            <div className="footer-brand">
              <HBLogo size={22} className="footer-logo" />
              <span className="mono-small" style={{ color: 'var(--text-muted)' }}>© 2026 / MUMBAI, INDIA</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
