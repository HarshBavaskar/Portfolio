import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion, useInView, useMotionValue, useSpring, useVelocity } from 'framer-motion';
void motion;
import { Github, Linkedin, Mail, BrainCircuit, Bot, Cpu, Shapes, Database, ArrowUpRight } from 'lucide-react';
import * as THREE from 'three';
import './App.css';

/* ═══════════════════════════════════════════════════════════
   EXTREME ARCHITECTURE — Portfolio
   Interactive dot matrix · Magnetic text · Scroll text fill
   Kinetic dividers · Physics cursor · 3D tilt · Parallax
   ═══════════════════════════════════════════════════════════ */

/* ──────────────────── HB MONOGRAM LOGO ──────────────────── */
function HBLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* H left vertical */}
      <rect x="4" y="4" width="3.2" height="32" rx="1.6" fill="currentColor" />
      {/* H-B shared center vertical */}
      <rect x="18.4" y="4" width="3.2" height="32" rx="1.6" fill="currentColor" />
      {/* H crossbar */}
      <rect x="4" y="17.4" width="17.6" height="3.2" rx="1.6" fill="currentColor" />
      {/* B top arc */}
      <path d="M20 6 C20 6, 34 6, 34 14.5 C34 23, 20 20.5, 20 20.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      {/* B bottom arc */}
      <path d="M20 20.5 C20 20.5, 36.5 18, 36.5 28 C36.5 37, 20 36, 20 36" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none" />
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

function DotMatrix() {
  const canvasRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const contentRectsRef = useRef([]);

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

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SPACING = 24;
    const INFLUENCE = 130;
    const MAX_DISPLACE = 16;
    let cols, rows, dots, w, h, raf;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.ceil(w / SPACING) + 1;
      rows = Math.ceil(h / SPACING) + 1;
      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({ ox: c * SPACING, oy: r * SPACING, x: 0, y: 0, scale: 1 });
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Check if a point falls inside any content rect
    const getContentProximity = (px, py) => {
      const rects = contentRectsRef.current;
      let minDist = Infinity;
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        const PAD = 40; // expand hit zone
        const cx = Math.max(r.x - PAD, Math.min(px, r.x + r.w + PAD));
        const cy = Math.max(r.y - PAD, Math.min(py, r.y + r.h + PAD));
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
        if (dist < minDist) minDist = dist;
      }
      // 0 = inside content, 1 = far from content
      const FADE = 80;
      return minDist < FADE ? minDist / FADE : 1;
    };

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouseStore.x, my = mouseStore.y;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = d.ox - mx, dy = d.oy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < INFLUENCE) {
          const force = (1 - dist / INFLUENCE);
          const angle = Math.atan2(dy, dx);
          d.x += (Math.cos(angle) * force * MAX_DISPLACE - d.x) * 0.12;
          d.y += (Math.sin(angle) * force * MAX_DISPLACE - d.y) * 0.12;
          d.scale += ((1 + force * 2.5) - d.scale) * 0.12;
        } else {
          d.x *= 0.92;
          d.y *= 0.92;
          d.scale += (1 - d.scale) * 0.08;
        }
        const px = d.ox + d.x;
        const py = d.oy + d.y;

        // Content zone: dots become ultra-fine grains
        const proximity = getContentProximity(px, py);
        const BASE_R = 1.2;
        const GRAIN_R = 0.35;
        const baseRadius = GRAIN_R + (BASE_R - GRAIN_R) * proximity;
        const r = baseRadius * d.scale;

        const baseOpacity = 0.025 + (0.07 - 0.025) * proximity;
        const opacity = baseOpacity + (d.scale - 1) * 0.12;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20,18,16,${Math.min(opacity, 0.35)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;
  return <canvas ref={canvasRef} className="dot-matrix-canvas" />;
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

function WebGLBackground() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 6], fov: 48 }} gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}>
        <color attach="background" args={['#f5f3ef']} />
        <ambientLight intensity={0.5} color="#f5f3ef" />
        <directionalLight position={[5, 8, 5]} intensity={0.35} color="#f2efeb" />
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

/* ═══════════════════════════════════════════════════════════
   EXTREME CURSOR — Physics trail + velocity morphing
   ═══════════════════════════════════════════════════════════ */

function ExtremeCursor() {
  const dotRef = useRef(null);
  const followerRef = useRef(null);
  const trailCanvasRef = useRef(null);
  const spotlightRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)');
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let dotPos = { ...mouse }, followerPos = { ...mouse };
    let velocity = { x: 0, y: 0 };
    let prevMouse = { ...mouse };

    class TrailParticle {
      constructor(x, y, vx, vy) {
        this.x = x; this.y = y;
        this.vx = vx * 0.15 + (Math.random() - 0.5) * 1.2;
        this.vy = vy * 0.15 + (Math.random() - 0.5) * 1.2;
        this.life = 1;
        this.decay = 0.015 + Math.random() * 0.012;
        this.size = (2 + Math.random() * 2.5) * Math.min(1, Math.sqrt(vx * vx + vy * vy) / 12);
      }
      update() {
        this.life -= this.decay;
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.96; this.vy *= 0.96;
        this.vy += 0.02;
        this.size *= 0.985;
      }
    }

    let particles = [];
    let trail = [];
    const MAX_TRAIL = 16;
    let frameCount = 0;
    const canvas = trailCanvasRef.current;
    if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    const ctx = canvas?.getContext('2d');

    const onResize = () => { if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }};
    window.addEventListener('resize', onResize);

    const onMove = (e) => {
      prevMouse.x = mouse.x; prevMouse.y = mouse.y;
      mouse.x = e.clientX; mouse.y = e.clientY;
      velocity.x = mouse.x - prevMouse.x; velocity.y = mouse.y - prevMouse.y;
    };
    const onOver = (e) => {
      const t = e.target;
      if (t.closest('a, button, .hover-target')) document.body.classList.add('hover-active');
      if (t.closest('.view-target')) document.body.classList.add('hover-view');
      if (t.closest('.code-target')) document.body.classList.add('hover-code');
    };
    const onOut = () => { document.body.classList.remove('hover-active', 'hover-view', 'hover-code'); };
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    let raf;
    const render = () => {
      frameCount++;
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      dotPos.x += (mouse.x - dotPos.x) * 0.28;
      dotPos.y += (mouse.y - dotPos.y) * 0.28;
      followerPos.x += (mouse.x - followerPos.x) * 0.08;
      followerPos.y += (mouse.y - followerPos.y) * 0.08;

      const angle = Math.atan2(velocity.y, velocity.x);
      const stretch = Math.min(speed / 8, 2.2);
      const scaleX = 1 + stretch * 0.35;
      const scaleY = 1 / (1 + stretch * 0.18);

      if (dotRef.current) dotRef.current.style.transform = `translate3d(${dotPos.x}px,${dotPos.y}px,0) translate(-50%,-50%) rotate(${angle}rad) scale(${scaleX},${scaleY})`;
      if (followerRef.current) {
        const fStretch = Math.min(speed / 14, 1.5);
        followerRef.current.style.transform = `translate3d(${followerPos.x}px,${followerPos.y}px,0) translate(-50%,-50%) rotate(${angle * 0.4}rad) scale(${1 + fStretch * 0.2},${1 / (1 + fStretch * 0.1)})`;
      }
      if (spotlightRef.current) spotlightRef.current.style.background = `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(255,92,0,0.02), transparent 60%)`;

      if (speed > 3 && frameCount % 2 === 0) {
        const count = Math.min(Math.floor(speed / 6), 4);
        for (let i = 0; i < count; i++) particles.push(new TrailParticle(mouse.x, mouse.y, velocity.x, velocity.y));
      }

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.update();
          if (p.life <= 0) { particles.splice(i, 1); continue; }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(20,18,16,${p.life * 0.2})`; ctx.fill();
        }
        if (particles.length > 200) particles.splice(0, particles.length - 200);
        trail.push({ x: mouse.x, y: mouse.y }); if (trail.length > MAX_TRAIL) trail.shift();
        if (trail.length > 2) {
          ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length; i++) { const t0 = trail[i - 1], t1 = trail[i]; ctx.quadraticCurveTo(t0.x, t0.y, (t0.x + t1.x) / 2, (t0.y + t1.y) / 2); }
          ctx.strokeStyle = `rgba(20,18,16,${Math.min(speed / 20, 0.12)})`; ctx.lineWidth = Math.max(1, speed * 0.06); ctx.stroke();
        }
      }
      velocity.x *= 0.85; velocity.y *= 0.85;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', onResize);
      document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  if (isMobile) return null;
  return (
    <>
      <div ref={spotlightRef} className="cursor-spotlight" />
      <canvas ref={trailCanvasRef} className="cursor-trail-canvas" />
      <div ref={dotRef} className="cursor-dot" />
      <div ref={followerRef} className="cursor-follower" />
    </>
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
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-50%']);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  return (
    <div ref={ref} className="kinetic-divider" aria-hidden="true">
      <motion.div className="kinetic-track" style={{ x }}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.span key={i} className="kinetic-glyph" style={{ rotate }}>
            {text}
          </motion.span>
        ))}
      </motion.div>
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

function TextScramble({ text, className = '', as = 'span' }) {
  const [display, setDisplay] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef(null);
  const scramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);
    let iteration = 0;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplay(text.split('').map((char, i) => {
        if (char === ' ') return ' ';
        if (i < iteration) return text[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join(''));
      iteration += 0.5;
      if (iteration >= text.length) { clearInterval(intervalRef.current); setDisplay(text); setIsScrambling(false); }
    }, 28);
  }, [text, isScrambling]);
  useEffect(() => () => clearInterval(intervalRef.current), []);
  const Tag = as;
  return <Tag className={`${className} scramble-text`} onMouseEnter={scramble} data-scrambling={isScrambling ? 'true' : 'false'}>{display}</Tag>;
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
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-65%']);
  // Scroll-linked 3D rotation per card
  const rotateY1 = useTransform(scrollYProgress, [0, 0.2, 0.4], [8, 0, -3]);
  const rotateY2 = useTransform(scrollYProgress, [0.1, 0.35, 0.55], [8, 0, -3]);
  const rotateY3 = useTransform(scrollYProgress, [0.2, 0.5, 0.7], [8, 0, -3]);
  const rotateY4 = useTransform(scrollYProgress, [0.3, 0.6, 0.8], [8, 0, -3]);
  const rotateY5 = useTransform(scrollYProgress, [0.4, 0.7, 0.9], [8, 0, -3]);
  const rotations = [rotateY1, rotateY2, rotateY3, rotateY4, rotateY5];

  useEffect(() => { const mq = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)'); const update = () => setIsMobile(mq.matches); mq.addEventListener('change', update); return () => mq.removeEventListener('change', update); }, []);

  const PROJECTS = [
    { title: 'NASA HERC Rover', year: '2024—25', description: "Organized by NASA", role: 'Construction Lead', tech: ['Mechanical', 'Controls', 'Sensors'], accent: 'var(--green)' },
    { title: 'Polaris', year: '2026—CURR', description: "AI Early Warning System", role: 'Lead AI Engineer', tech: ['CNN', 'LSTM', 'Python', 'React'], github: 'https://github.com/HarshBavaskar/Polaris', accent: 'var(--orange)' },
    { title: 'Block Ballot', year: '2026—CURR', description: "Blockchain Voting System", role: 'Full Stack Blockchain', tech: ['Spring Boot', 'Cryptography', 'Merkle Tree'], github: 'https://github.com/HarshBavaskar/BlockBallot', accent: 'var(--lavender)' },
    { title: 'PRISMRx', year: '2025', description: "Polypharmacy AI Analyzer", role: 'Lead Developer', tech: ['ML', 'Data Pipelines', 'React'], github: 'https://github.com/HarshBavaskar/PrismRX-AI', accent: 'var(--sage)' },
    { title: 'AIROBOT', year: '2024—25', description: "Autonomous Home Robot", role: 'Hardware Integration', tech: ['Arduino', 'ESP32', 'OpenCV'], accent: 'var(--charcoal)' },
  ];

  const Card = ({ proj, i }) => {
    const inner = (
      <ParallaxInner factor={0.025}>
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
            <TextScramble text={proj.title} as="h3" />
            <div className="project-tech">{proj.tech.map((t, idx) => <span key={idx} className="tech-tag">{t}</span>)}</div>
          </div>
        </div>
      </ParallaxInner>
    );
    const cardEl = (
      <motion.div className="project-card view-target" style={isMobile ? {} : { rotateY: rotations[i], perspective: 1000 }}>
        <TiltCard intensity={8} glareIntensity={0.06}>{inner}</TiltCard>
      </motion.div>
    );
    return proj.github ? <a key={i} href={proj.github} target="_blank" rel="noreferrer" className="project-card-link">{cardEl}</a> : <div key={i}>{cardEl}</div>;
  };

  return (
    <div ref={targetRef} className="horizontal-scroll-container">
      <div className="horizontal-scroll-sticky">
        <motion.div style={isMobile ? undefined : { x }} className="horizontal-scroll-wrap">
          {!isMobile && <div style={{ paddingRight: '8vw' }} />}
          {PROJECTS.map((proj, i) => <Card key={i} proj={proj} i={i} />)}
          {!isMobile && <div style={{ paddingRight: '10vw' }} />}
        </motion.div>
      </div>
    </div>
  );
}

/* ──── ACCORDION (enhanced) ──── */
function AccordionItem({ year, title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <FadeUp className="timeline-item hover-target" y={20}>
      <div className="timeline-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tl-year">{year}</div>
        <TextScramble text={title} as="div" className="tl-title" />
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

/* ──── BENTO CARD (3D tilt) ──── */
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
  useEffect(() => { const t = setTimeout(() => setHasLoaded(true), 200); return () => clearTimeout(t); }, []);

  return (
    <>
      <ExtremeCursor />
      <WebGLBackground />
      <DotMatrix />

      <main>
        {/* ── HERO ── */}
        <section className="hero" ref={heroRef}>
          <header className="hero-header">
            <ElasticButton className="logo hover-target"><HBLogo size={30} /></ElasticButton>
            <div className="hero-right">
              <ElasticButton href="mailto:hbavaskar6@gmail.com" className="availability" target="_blank">
                <span /> OPEN TO COLLABORATE
              </ElasticButton>
            </div>
          </header>

          {/* Floating corner coordinates */}
          <motion.div className="hero-coord hero-coord-tl" initial={{ opacity: 0 }} animate={hasLoaded ? { opacity: 1 } : {}} transition={{ delay: 1.5, duration: 0.8 }}>
            <span className="mono-small">19.0760° N</span>
          </motion.div>
          <motion.div className="hero-coord hero-coord-br" initial={{ opacity: 0 }} animate={hasLoaded ? { opacity: 1 } : {}} transition={{ delay: 1.7, duration: 0.8 }}>
            <span className="mono-small">72.8777° E</span>
          </motion.div>

          <motion.div className="container hero-main grain-zone" style={{ y: yHero, opacity: opacityHero, scale: scaleHero }}>
            <VelocityText className="hero-titles">
              <h1 className="title-massive">
                <motion.div style={{ y: yLine1 }}><MagneticTitle text="HARSH" className="hero-line" /></motion.div>
                <motion.div style={{ y: yLine2 }}><MagneticTitle text="BAVASKAR." className="hero-line" /></motion.div>
              </h1>
            </VelocityText>

            <div className="hero-bottom-row">
              <RoleCycler />
              <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={hasLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}} transition={{ delay: 1.3, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
                <ScrollFillText text="Building intelligent software, computer vision pipelines, and embedded robotics — combining AI models, scalable backends, and hardware to solve real-world problems." />
              </motion.p>
            </div>

            {/* Interactive hero tags */}
            <motion.div className="hero-tags" initial={{ opacity: 0, y: 14 }} animate={hasLoaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              {['AI/ML', 'ROBOTICS', 'COMPUTER VISION', 'EMBEDDED', 'FULL STACK'].map((tag, i) => (
                <motion.span key={tag} className="hero-tag hover-target" whileHover={{ scale: 1.08, y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                  <TextScramble text={tag} />
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

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

        {/* ── SKILLS ── */}
        <section className="section container">
          <FadeUp className="section-header-wrap grain-zone">
            <span className="mono-small">Core Competencies</span>
            <h2 className="title-medium">Architecture <br /> & <span className="serif-accent">Toolkit</span></h2>
          </FadeUp>

          <div className="bento-grid grain-zone">
            <BentoCard className="bento-tall code-target" delay={0}>
              <div className="bento-icon-badge"><BrainCircuit size={20} color="var(--green)" /></div>
              <h3 className="bento-title">AI & Machine <span className="serif-accent">Learning</span></h3>
              <p className="bento-desc" style={{ marginBottom: '1rem' }}>Developing high-performance models for computer vision, anomaly detection, and NLP.</p>
              <div className="project-tech">
                {['PyTorch','TensorFlow','YOLOv8','DeepSORT','OpenCV','LSTM','CNN','Transformers','RAG'].map(t => <span key={t} className="tech-tag">{t}</span>)}
              </div>
            </BentoCard>
            <BentoCard delay={0.06}>
              <div className="bento-icon-badge"><Cpu size={20} color="var(--lavender)" /></div>
              <TextScramble text="Frontend" as="h3" className="bento-title" />
              <p className="bento-desc">WebGL, Framer Motion, GSAP, Flutter, React, Vite, HTML5, CSS3, UI/UX Design</p>
            </BentoCard>
            <BentoCard className="bento-wide" delay={0.12}>
              <div className="bento-icon-badge"><Bot size={20} color="var(--orange)" /></div>
              <h3 className="bento-title">Hardware & <span className="serif-accent">Robotics</span></h3>
              <p className="bento-desc">Arduino, ESP32, Raspberry Pi, Motor drivers, Sensor integration, Embedded prototyping.</p>
            </BentoCard>
            <BentoCard className="bento-wide" delay={0.18}>
              <div className="bento-icon-badge"><Database size={20} color="var(--sage)" /></div>
              <h3 className="bento-title">Backend <span className="serif-accent">Architecture</span></h3>
              <p className="bento-desc">Resilient API layers, secure auth, and data pipelines managing thousands of concurrent requests.</p>
              <div className="project-tech" style={{ marginTop: 'auto' }}>
                {['Spring Boot','Flask','MongoDB','PostgreSQL','Redis','Docker','Azure','HDFS'].map(t => <span key={t} className="tech-tag">{t}</span>)}
              </div>
            </BentoCard>
            <BentoCard className="bento-small" delay={0.24}>
              <div className="bento-icon-badge"><Shapes size={20} color="var(--charcoal)" /></div>
              <h3 className="bento-title">Prototyping & <span className="serif-accent">CAD</span></h3>
              <p className="bento-desc">Fusion 360, RhinoCAD, SolidWorks, FDM & SLA 3D Printing.</p>
            </BentoCard>
          </div>
        </section>

        {/* ── KINETIC DIVIDER ── */}
        <KineticDivider text="→" count={35} />

        {/* ── PROJECTS ── */}
        <section className="section" style={{ padding: 0 }}>
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
            <h2 className="title-medium">Journey & <span className="serif-accent">Leadership</span></h2>
          </FadeUp>
          <div className="timeline-container grain-zone">
            <AccordionItem year="2025—CUR" title="Head of Robotics">
              <div style={{ color: 'var(--green)', marginBottom: '0.5rem', fontWeight: 600 }}>SPARC Society — Atlas Skilltech University</div>
              Leading the entire Robotics Department. Organizing events, workshops, and inter-university competitions.
            </AccordionItem>
            <AccordionItem year="2024—25" title="Rover Construction Lead">
              <div style={{ color: 'var(--orange)', marginBottom: '0.5rem', fontWeight: 600 }}>Team MUSHAK — NASA HERC</div>
              Led a team of 18 members focusing on mechanical and electrical systems integration for a rugged rover.
            </AccordionItem>
            <AccordionItem year="2024—28" title="Computer Science Student">
              <div style={{ color: 'var(--lavender)', marginBottom: '0.5rem', fontWeight: 600 }}>Atlas Skilltech University</div>
              BTech specialization in AI & Machine Learning. Deep-learning mathematics, data structures, architecture.
            </AccordionItem>
            <AccordionItem year="Awards" title="NASA HERC Recognitions">
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
            <VelocityText><div className="footer-big-text">HARSH.</div></VelocityText>
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
