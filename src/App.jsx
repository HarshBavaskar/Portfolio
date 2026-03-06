import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Stars, TorusKnot, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Phone, MapPin, ChevronDown, ExternalLink } from 'lucide-react';
import './App.css'; // Just let it import the default if it helps, but index.css is loaded via main.jsx

// --- 3D Scene Components ---

const BackgroundShape = () => {
  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
      <TorusKnot args={[1, 0.3, 128, 16]} position={[0, 0, -3]}>
        <MeshDistortMaterial
          color="#6d28d9"
          attach="material"
          distort={0.4}
          speed={2}
          wireframe={true}
          opacity={0.3}
          transparent={true}
        />
      </TorusKnot>
    </Float>
  );
};

// --- Framer Motion Helper ---

const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

function App() {
  const skills = [
    { category: 'Frontend', items: ['Flutter', 'React (components, hooks, state)', 'Vite', 'Tailwind CSS', 'HTML5', 'CSS3', 'Thymeleaf', 'UI/UX Design'] },
    { category: 'Backend', items: ['Java (Spring Boot, REST APIs, MVC)', 'JavaScript', 'Flask', 'Django', 'MongoDB', 'Redis', 'H2/PostgreSQL', 'API Integration'] },
    { category: 'Programming', items: ['Python (Automation, ML pipelines)', 'Java', 'C/C++', 'Embedded C/C++', 'Arduino IDE', 'Espressif (ESP32)'] },
    { category: 'AI and ML', items: ['Python', 'OpenCV', 'YOLO (v5–v8)', 'DeepSORT', 'CNN/LSTM integration', 'Computer Vision pipelines'] },
    { category: 'Robotics & Hardware', items: ['Arduino', 'ESP32', 'Raspberry Pi', 'Motor drivers', 'Sensors (Ultrasonic, IR, LiDAR)', 'Embedded prototyping'] },
    { category: '3D Design & Prototyping', items: ['Fusion 360', 'RhinoCAD', 'SolidWorks', 'Mechanical CAD design', 'FDM Printing', 'SLA Printing'] }
  ];

  const projects = [
    {
      title: '30th NASA Human Exploration Rover Challenge',
      role: 'Rover Construction Lead, Team Mushak',
      year: '2024 – 2025',
      desc: [
        'Led mechanical and systems integration of a competition-grade RC rover.',
        'Managed fabrication and assembly of 6+ major subsystems (chassis, drivetrain, suspension, wheels, electronics, controls).',
        'Enabled successful completion of mobility, sample collection, vacuum, and LiDAR navigation tasks.'
      ]
    },
    {
      title: 'Polaris - AI Early Warning System',
      role: 'Lead Developer, Group Project',
      year: 'Jan 2026 – Present',
      desc: [
        'Built layered AI early-warning system using CNN (MobileNetV2) for sky vision and LSTM for temporal risk learning.',
        'Implemented 10+ production APIs for dashboards, maps, alerts, ML pipelines, and authority overrides.',
        'Deployed an active-learning ML pipeline with one-click retraining (CNN + LSTM) and hotreload.'
      ]
    },
    {
      title: 'Block Ballot - Blockchain Voting System',
      role: 'Personal Project',
      year: 'Feb 2026 – Present',
      desc: [
        'Developed a blockchain-secured digital voting platform using Java, Spring Boot, and cryptographic hashing.',
        'Implemented a multi-layer vote anonymization pipeline (SHA-256, SHA3-256, PBKDF2).',
        'Built a proof-of-work blockchain engine with Merkle tree verification.'
      ]
    },
    {
      title: 'PRISMRx - AI Polypharmacy Safety',
      role: 'Lead Developer, Group Project',
      year: '2025 – 2026',
      desc: [
        'Built a full-stack AI system analyzing multiple medications to predict drug–drug interactions.',
        'Processed 1,000+ drug–drug combinations with real-time inference under 2 seconds/query.',
        'Achieved ~90% accuracy on test interaction datasets.'
      ]
    },
    {
      title: 'ALRA – AI Assistant Device',
      role: 'Personal Project',
      year: '2024 – Present',
      desc: [
        'Built a custom AI assistant using Raspberry Pi with voice interaction and AI/LLM APIs.',
        'Implemented real-time vision features using OpenCV.'
      ]
    },
    {
      title: 'AI-Based Footfall Counter',
      role: 'Personal Project',
      year: '2025',
      desc: [
        'Developed system using YOLOv8 and DeepSORT with ~95% detection accuracy.',
        'Tracked up to 20+ simultaneous individuals with ROI-based entry/exit logic.'
      ]
    },
    {
      title: 'AIRO Bot – Autonomous Robot',
      role: 'Lead Developer, Group Project',
      year: '2024',
      desc: [
        'Built robot with face recognition, voice control, obstacle avoidance, and line following integrating Arduino Nano and ESP32.'
      ]
    }
  ];

  const orgs = [
    {
      title: 'SPARC Society - Atlas Skilltech University',
      role: 'Head of Department - Robotics',
      year: '2025 – Present | Mumbai, India',
      desc: 'Lead and manage the Robotics Department, organize events, mentor students, and drive initiatives in robotics learning.'
    },
    {
      title: 'Team MUSHAK - NASA HERC 2025',
      role: 'Rover Construction Lead',
      year: '2024 – 2025 | Mumbai, India',
      desc: 'Led an 18-member team, managed fabrication/assembly, ensured quality standards, and supervised systems integration.'
    }
  ];

  return (
    <>
      <div id="canvas-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#8b5cf6" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <BackgroundShape />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      <div className="content-wrapper">
        <div className="container">
          
          {/* Hero Section */}
          <section className="hero-section">
            <FadeIn>
              <h1 className="hero-name">Harsh Bavaskar</h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="hero-subtitle">BTech in Computer Science - AI & ML</h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="hero-contact">
                <a href="mailto:hbavaskar6@gmail.com" className="contact-item"><Mail size={20}/> hbavaskar6@gmail.com</a>
                <span className="contact-item"><Phone size={20}/> +919284625970</span>
                <span className="contact-item"><MapPin size={20}/> Mumbai, India</span>
                <a href="https://github.com/HarshBavaskar" target="_blank" rel="noreferrer" className="contact-item"><Github size={20}/> GitHub</a>
                <a href="https://linkedin.com/in/harsh-bavaskar" target="_blank" rel="noreferrer" className="contact-item"><Linkedin size={20}/> LinkedIn</a>
              </div>
            </FadeIn>
            <div className="scroll-indicator">
              <ChevronDown size={32} />
            </div>
          </section>

          {/* About/Education */}
          <section>
            <FadeIn>
              <h2 className="section-title">Education</h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="glass-card">
                <h3 className="project-title">Atlas Skilltech University</h3>
                <p className="project-role">BTech in Computer Science - Artificial Intelligence & Machine Learning</p>
                <p className="project-desc">2024 – 2028 | Mumbai, India</p>
              </div>
            </FadeIn>
          </section>

          {/* Skills */}
          <section>
            <FadeIn>
              <h2 className="section-title">Skills</h2>
            </FadeIn>
            <div className="skills-grid">
              {skills.map((skillGroup, idx) => (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <div className="glass-card h-full">
                    <h3 className="skill-category-title">{skillGroup.category}</h3>
                    <div className="skill-tags">
                      {skillGroup.items.map((item, i) => (
                        <span key={i} className="skill-tag">{item}</span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section>
            <FadeIn>
              <h2 className="section-title">Projects</h2>
            </FadeIn>
            <div className="projects-grid">
              {projects.map((project, idx) => (
                <FadeIn key={idx} delay={0.1}>
                  <div className="glass-card">
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-role">{project.role} | {project.year}</p>
                    <ul className="project-desc">
                      {project.desc.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* Organizations */}
          <section>
            <FadeIn>
              <h2 className="section-title">Organizations</h2>
            </FadeIn>
            <div className="timeline">
              {orgs.map((org, idx) => (
                <FadeIn key={idx} delay={0.1} className="timeline-item shadow">
                  <h3 className="timeline-title">{org.title}</h3>
                  <p className="timeline-subtitle">{org.role} | {org.year}</p>
                  <p className="project-desc">{org.desc}</p>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* Awards */}
          <section>
            <FadeIn>
              <h2 className="section-title">Awards</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem'}}>
              <FadeIn delay={0.1}>
                <div className="glass-card flex items-center gap-4">
                  <div>
                    <h3 className="project-title text-xl mb-1">5th Global Rank</h3>
                    <p className="text-gray-400">RC Division at NASA HERC | 2025</p>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="glass-card flex items-center gap-4">
                  <div>
                    <h3 className="project-title text-xl mb-1">Social Media Award</h3>
                    <p className="text-gray-400">University Division at NASA HERC | 2025</p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

export default App;
