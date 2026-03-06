import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, OrbitControls, Sparkles, Float, Sphere, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, ChromaticAberration, Glitch } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Github, Linkedin, Mail, ArrowUpRight, Code2, Database, BrainCircuit, Bot, Cpu, Shapes } from 'lucide-react';
import * as THREE from 'three';
import './App.css';

/* ──────────────────── CUSTOM COMPOSABLE WEBGL BACKGROUND ──────────────────── */

function ComplexGeometry() {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float floatIntensity={2} speed={1.5}>
      <mesh ref={meshRef} position={[0, 0, 0]} scale={1.8}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={1.5}
          anisotropicBlur={0.2}
          ior={1.4}
          chromaticAberration={0.4}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color="#4f009e"
          attenuationDistance={2}
          attenuationColor="#ffffff"
          clearcoat={1}
        />
      </mesh>
      <mesh scale={1.7}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#2d9fd4" wireframe transparent opacity={0.1} />
      </mesh>
    </Float>
  );
}

function WebGLBackground() {
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger subtle glitch on fast scroll
      if (Math.abs(window.scrollY - window.lastScrollY) > 50) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }
      window.lastScrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <color attach="background" args={['#030303']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#8000ff" />

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={10} size={2} speed={0.4} opacity={0.2} color="#2dd4bf" />
        <ComplexGeometry />

        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom
            luminanceThreshold={0.2}
            mipmapBlur
            intensity={1.5}
            blendFunction={BlendFunction.ADD}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.002, 0.002]}
            radialModulation={false}
          />
          <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />
          {glitchActive && (
            <Glitch
              delay={[0.1, 0.2]}
              duration={[0.1, 0.2]}
              strength={[0.02, 0.04]}
              mode={GlitchMode.SPORADIC}
              active
              ratio={1}
            />
          )}
        </EffectComposer>
      </Canvas>
      <div className="noise-overlay" />
    </div>
  );
}


/* ──────────────────── CUSTOM TRAILING CURSOR ──────────────────── */

function CustomCursor() {
  const dotRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let dotPos = { x: mouse.x, y: mouse.y };
    let followerPos = { x: mouse.x, y: mouse.y };

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.closest('a, button, .hover-target')) {
        document.body.classList.add('hover-active');
      }
      if (target.closest('.view-target')) {
        document.body.classList.add('hover-view');
      }
      if (target.closest('.code-target')) {
        document.body.classList.add('hover-code');
      }
    };

    const handleMouseOut = (e) => {
      document.body.classList.remove('hover-active');
      document.body.classList.remove('hover-view');
      document.body.classList.remove('hover-code');
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    let raf;
    const render = () => {
      dotPos.x += (mouse.x - dotPos.x) * 0.3;
      dotPos.y += (mouse.y - dotPos.y) * 0.3;
      followerPos.x += (mouse.x - followerPos.x) * 0.1;
      followerPos.y += (mouse.y - followerPos.y) * 0.1;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;
      }
      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${followerPos.x}px, ${followerPos.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={followerRef} className="cursor-follower" />
    </>
  );
}

/* ──────────────────── MAGNETIC BUTTON HOVER ──────────────────── */

function MagneticWrapper({ children, className = '' }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPos({ x: x * 0.5, y: y * 0.5 });
  };

  const handleMouseLeave = () => {
    setPos({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────── TYPOGRAPHY REVEAL ──────────────────── */

const splitText = (text) => {
  return text.split('').map((char, i) => (
    <motion.span
      key={i}
      style={{ display: 'inline-block' }}
      variants={{
        hidden: { y: '100%', opacity: 0 },
        visible: { y: '0%', opacity: 1 }
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  ));
};

/* ──────────────────── HORIZONTAL SCROLL ──────────────────── */

function HorizontalProjects() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-65%']); // Adjust based on # of items

  const PROJECTS = [
    { title: 'NASA HERC Rover Challenge 2025', description: "Organized by NASA", role: 'Rover Construction Lead', delay: '01', tech: ['Mechanical', 'Controls', 'Sensors'] },
    { title: 'Polaris', description: "AI Early Warning and Alert System", role: 'Lead AI Engineer', delay: '02', tech: ['CNN', 'LSTM', 'Python', 'React'], github: 'https://github.com/HarshBavaskar/Polaris' },
    { title: 'Block Ballot', description: "Blockchain-secured Voting System", role: 'Full Stack Blockchain', delay: '03', tech: ['Spring Boot', 'Cryptography', 'Merkle Tree'], github: 'https://github.com/HarshBavaskar/BlockBallot' },
    { title: 'PRISMRx', description: "Polypharmacy AI Analyzer", role: 'Lead Developer', delay: '04', tech: ['Machine Learning', 'Data Pipelines', 'React'], github: 'https://github.com/HarshBavaskar/PrismRX-AI' },
    { title: 'AIROBOT', description: "AI Powered Autonomous Home Robot", role: 'Hardware Integration', delay: '05', tech: ['Arduino', 'ESP32', 'OpenCV'] }
  ];

  return (
    <div ref={targetRef} className="horizontal-scroll-container">
      <div className="horizontal-scroll-sticky">
        <motion.div style={{ x }} className="horizontal-scroll-wrap">
          <div style={{ paddingRight: '8vw' }} /> {/* Offset start */}
          {PROJECTS.map((proj, i) => (
            proj.github ? (
              <a
                key={i}
                href={proj.github}
                target="_blank"
                rel="noreferrer"
                className="project-card project-card-link view-target"
              >
                <span className="project-bg-text">0{i + 1}</span>
                <div className="project-content">
                  <div className="project-top">
                    <span className="project-index">0{i + 1}</span>
                    <span className="project-year">2024—25</span>
                  </div>
                  <div className="project-bottom">
                    <div className="project-role">{proj.role}</div>
                    <div className="project-link-hint">Check on GitHub</div>
                    <h6>{proj.description}</h6>
                    <h3>{proj.title}</h3>
                    <div className="project-tech">
                      {proj.tech.map((t, idx) => (
                        <span key={idx} className="tech-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <div key={i} className="project-card view-target">
                <span className="project-bg-text">0{i + 1}</span>
                <div className="project-content">
                  <div className="project-top">
                    <span className="project-index">0{i + 1}</span>
                    <span className="project-year">2024—25</span>
                  </div>
                  <div className="project-bottom">
                    <div className="project-role">{proj.role}</div>
                    <h6>{proj.description}</h6>
                    <h3>{proj.title}</h3>
                    <div className="project-tech">
                      {proj.tech.map((t, idx) => (
                        <span key={idx} className="tech-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}
          <div style={{ paddingRight: '10vw' }} /> {/* End buffer */}
          
        </motion.div>
      </div>
    </div>
  );
}

/* ──────────────────── ACCORDION / TIMELINE TIMELINE ──────────────────── */

function AccordionItem({ year, title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  return (
    <div className="timeline-item hover-target">
      <div className="timeline-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tl-year">{year}</div>
        <div className="tl-title text-stroke">{title}</div>
        <div className="tl-arrow">
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.4 }}>
            <ChevronDown />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="timeline-content-wrap"
          >
            <div className="timeline-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ──────────────────── MAIN APP ──────────────────── */

export default function App() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const yHero = useTransform(heroProgress, [0, 1], [0, 200]);
  const opacityHero = useTransform(heroProgress, [0, 1], [1, 0]);

  // Loading sequence state
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    // Fake loading sequence
    setTimeout(() => setHasLoaded(true), 100);
  }, []);

  return (
    <>
      <CustomCursor />
      <WebGLBackground />

      <main>
        {/* ── HERO ── */}
        <section className="hero" ref={heroRef}>
          <header className="hero-header">
            <MagneticWrapper className="logo hover-target">
              <span/> @Portfolio
            </MagneticWrapper>
            <MagneticWrapper className="hover-target">
              <a href="mailto:hbavaskar6@gmail.com" className="availability">
                <span/> AVAILABLE FOR COLLABORATION
              </a>
            </MagneticWrapper>
          </header>

          <motion.div className="container hero-main" style={{ y: yHero, opacity: opacityHero }}>
            <div className="hero-titles">
              <motion.h1
                className="title-massive"
                initial="hidden"
                animate={hasLoaded ? "visible" : "hidden"}
              >
                <div className="hero-line">{splitText('HARSH')}</div>
                <div className="hero-line">{splitText('BAVASKAR.')}</div>
              </motion.h1>
            </div>

            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, x: -20 }}
              animate={hasLoaded ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1, duration: 0.8 }}
            >
              AI/ML student and robotics builder focused on turning ideas into real, working systems. I build intelligent software, computer vision pipelines, and embedded robotics, combining AI models, scalable backends, and hardware integration to solve real-world problems.
            </motion.p>
          </motion.div>

          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={hasLoaded ? { opacity: 1 } : {}}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <div className="scroll-line">
              <div className="scroll-progress-line" />
            </div>
          </motion.div>
        </section>

        {/* ── BENTO SKILLS GRID ── */}
        <section className="section container">
          <div className="section-header-wrap">
            <span className="mono-small">// CORE COMPETENCIES</span>
            <h2 className="title-medium">Architecture <br /> <span className="text-stroke">& Toolkit</span></h2>
          </div>

          <div className="bento-grid">
            {/* AI/ML Large Card */}
            <div className="bento-item bento-tall code-target">
              <div className="bento-icon-badge"><BrainCircuit size={24} color="var(--primary)" /></div>
              <h3 className="bento-title">Artificial Intelligence & ML</h3>
              <p className="bento-desc" style={{ marginBottom: '1.5rem' }}>
                Developing localized, high-performance models for computer vision, anomaly detection, and natural language processing.
              </p>
              <div className="project-tech">
                <span className="tech-tag">PyTorch</span>
                <span className="tech-tag">TensorFlow</span>
                <span className="tech-tag">YOLOv8</span>
                <span className="tech-tag">DeepSORT</span>
                <span className="tech-tag">OpenCV</span>
                <span className="tech-tag">LSTM</span>
                <span className="tech-tag">CNN</span>
                <span className="tech-tag">Transformers</span>
                <span className="tech-tag">RAG</span>
              </div>
            </div>


            {/* Frontend Standard */}
            <div className="bento-item hover-target">
              <div className="bento-icon-badge"><Cpu size={24} color="#da72f4" /></div>
              <h3 className="bento-title">Frontend </h3>
              <p className="bento-desc">WebGL, Framer Motion, GSAP, Flutter, React (components, hooks, state), Vite, Tailwind CSS, HTML5, CSS3, Thymeleaf, Responsive UI, UI/UX Design</p>
            </div>

            {/* Hardware Standard */}
            <div className="bento-item bento-wide hover-target">
              <div className="bento-icon-badge"><Bot size={24} color="#60a5fa" /></div>
              <h3 className="bento-title">Hardware</h3>
              <p className="bento-desc">Arduino, ESP32, Raspberry Pi, Motor drivers, Sensor integration (Ultrasonic, IR, LiDAR), Embedded system prototyping.</p>
            </div>

            {/* Backend Tall Card */}
            <div className="bento-item bento-wide hover-target">
              <div className="bento-icon-badge"><Database size={24} color="var(--secondary)" /></div>
              <h3 className="bento-title">Backend Architecture</h3>
              <p className="bento-desc">
                Building resilient API layers, secure authentication, and robust data pipelines managing thousands of concurrent requests.
              </p>
              <div className="project-tech" style={{ marginTop: 'auto' }}>
                <span className="tech-tag">Spring Boot</span>
                <span className="tech-tag">Flask / Django</span>
                <span className="tech-tag">MongoDB</span>
                <span className="tech-tag">PostgreSQL</span>
                <span className="tech-tag">Redis</span>
                <span className="tech-tag">Docker</span>
                <span className="tech-tag">Microsoft Azure</span>
                <span className="tech-tag">HDFS</span>
              </div>
            </div>

            {/* 3D Wide Card */}
            <div className="bento-item bento-small hover-target">
              <div className="bento-icon-badge"><Shapes size={24} color="#fbbf24" /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="bento-title">Prototyping & CAD Design</h3>
                  <p className="bento-desc">Fusion 360, RhinoCAD, SolidWorks, FDM & SLA 3D Printing execution.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HORIZONTAL PROJECTS ── */}
        <section className="section" style={{ padding: 0 }}>
          <div className="container section-header-wrap featured-heading" style={{ borderBottom: 'none', marginBottom: 0 }}>
            <span className="mono-small">// SELECTED ARCHIVES</span>
            <h2 className="title-medium">Featured <br /> <span className="text-stroke">Engineering</span></h2>
          </div>
          <HorizontalProjects />
        </section>

        {/* ── TIMELINE ── */}
        <section className="section container">
          <div className="section-header-wrap">
            <span className="mono-small">// CHRONOLOGY</span>
            <h2 className="title-medium">Leadership</h2>
          </div>

          <div className="timeline-container">
            <AccordionItem year="2025—CUR" title="Head of Robotics Dept">
              <div style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>SPARC Society — Atlas Skilltech University</div>
              Leading and managing the entire Robotics Department. Organizing top-tier events, workshops, and inter-university competitions. Mentoring students technically and driving forward hands-on AI & Hardware innovations.
            </AccordionItem>
            <AccordionItem year="2024—25" title="Rover Construction Lead">
              <div style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Team MUSHAK — NASA HERC</div>
              Led a team of 18 members focusing on mechanical and electrical systems integration. Orchestrated the successful deployment of a rugged, complex rover capable of traversing aggressive extra-terrestrial mock terrains.
            </AccordionItem>
            <AccordionItem year="2024—28" title="Computer Science Student">
              <div style={{ color: '#f4be72', marginBottom: '0.5rem', fontWeight: 600 }}>Atlas Skilltech University</div>
              BTech Specialization in Artificial Intelligence & Machine Learning. Building comprehensive foundational knowledge in deep-learning mathematics, data structures, and systemic architecture.
            </AccordionItem>
            <AccordionItem year="AWARDS" title="NASA HERC Recognitions">
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#fb4f24', fontSize: '1.5rem', fontWeight: 700 }}>5th Global Rank</div>
                  <div style={{ fontSize: '0.9rem' }}>RC Division at NASA HERC (2025)</div>
                </div>
                <div>
                  <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 700 }}>Social Media Award</div>
                  <div style={{ fontSize: '0.9rem' }}>University Division at NASA HERC (2025)</div>
                </div>
              </div>
            </AccordionItem>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer container">
          <div className="footer-big-text">HARSH.</div>
          <div className="footer-bottom">
            <div className="footer-links">
              <MagneticWrapper className="hover-target">
                <a href="mailto:hbavaskar6@gmail.com" className="footer-link"><Mail size={16} /> hbavaskar6@gmail.com</a>
              </MagneticWrapper>
              <MagneticWrapper className="hover-target">
                <a href="https://github.com/HarshBavaskar" target="_blank" rel="noreferrer" className="footer-link"><Github size={16} /> Github</a>
              </MagneticWrapper>
              <MagneticWrapper className="hover-target">
                <a href="https://linkedin.com/in/harsh-bavaskar" target="_blank" rel="noreferrer" className="footer-link"><Linkedin size={16} /> LinkedIn</a>
              </MagneticWrapper>
            </div>
            <div className="mono-small" style={{ color: 'var(--text-muted)' }}>
              © 2026 / MUMBAI, INDIA
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}






