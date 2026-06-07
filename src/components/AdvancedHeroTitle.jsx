import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import './AdvancedHeroTitle.css';

export default function AdvancedHeroTitle({ text1 = "HARSH", text2 = "BAVASKAR" }) {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const lastSpawnRef = useRef({ x: 0, y: 0, time: 0 });

  // Smooth springs for tracking the mouse over the text
  const mouseX = useSpring(0, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
    setIsHovered(true);

    // ASCII Brush Trails logic
    const now = Date.now();
    const dx = e.clientX - lastSpawnRef.current.x;
    const dy = e.clientY - lastSpawnRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 15 || now - lastSpawnRef.current.time > 80) {
      const newParticle = {
        id: Math.random().toString(36).substring(2, 10),
        x: e.clientX - rect.left + (Math.random() * 20 - 10),
        y: e.clientY - rect.top + (Math.random() * 20 - 10),
        char: ['@', '#', '$', '%', '&', '*', '0', '1', '■', '◆', '※', '░'][Math.floor(Math.random() * 12)]
      };
      
      setParticles(prev => [...prev, newParticle]);
      lastSpawnRef.current = { x: e.clientX, y: e.clientY, time: now };
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // Tactical data shifting slices
  const slice1X = useTransform(mouseX, x => x * -0.06);
  const slice2X = useTransform(mouseX, x => x * 0.08);
  const slice3X = useTransform(mouseX, x => x * -0.03);

  return (
    <div 
      className="tactical-title-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ASCII Brush Particles */}
      {particles.map(p => (
        <div 
          key={p.id}
          className="ascii-brush-particle"
          style={{ left: p.x, top: p.y }}
        >
          {p.char}
        </div>
      ))}

      <div className={`tactical-wrapper ${isHovered ? 'tactical-active' : ''}`}>
        {/* Corner HUD Markers */}
        <div className="hud-corner top-left"></div>
        <div className="hud-corner top-right"></div>
        <div className="hud-corner bottom-left"></div>
        <div className="hud-corner bottom-right"></div>

        {/* Data Readout overlay when hovered */}
        {isHovered && (
          <motion.div 
            className="hud-data-readout"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            SYS.TARGET // {text1}_{text2} // LOCKED
            <br />
            COORD: 19.0760 N 72.8777 E
          </motion.div>
        )}

        <div className="tactical-title-stack">
          {/* Base stroke text */}
          <div className="tactical-text base-text">
            <div>{text1}</div>
            <div>{text2}</div>
          </div>

          {/* Sliced layers that activate on hover */}
          <motion.div 
            className="tactical-text slice-1" 
            style={{ x: slice1X, opacity: isHovered ? 1 : 0 }}
          >
            <div>{text1}</div>
            <div>{text2}</div>
          </motion.div>
          
          <motion.div 
            className="tactical-text slice-2" 
            style={{ x: slice2X, opacity: isHovered ? 1 : 0 }}
          >
            <div>{text1}</div>
            <div>{text2}</div>
          </motion.div>

          <motion.div 
            className="tactical-text slice-3" 
            style={{ x: slice3X, opacity: isHovered ? 1 : 0 }}
          >
            <div>{text1}</div>
            <div>{text2}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
