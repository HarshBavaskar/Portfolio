import React, { useEffect, useRef } from 'react';
import './ThreeDAsciiName.css';

const SHADE = ' .:-=+*#%@';
const GLITCH = '!@#$%^&*_+-=|;:<>?/~░▒▓█▀■●◆※';

export default function ThreeDAsciiName() {
  const preRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    // Performant grid sizing: Cap resolution to keep cell updates lightning fast
    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const COLS = isLowEnd ? 40 : (isMobile ? 55 : 85);
    
    // Character aspect ratio: height to width
    const charAspectRatio = 0.58; 
    
    // Calculate ROWS to match viewport aspect ratio, capped at a sensible height
    const targetRows = Math.ceil((window.innerHeight / window.innerWidth) * COLS / charAspectRatio * 1.25);
    const ROWS = Math.min(isMobile ? 55 : 45, targetRows);
    
    // Compute dynamic font size so characters stretch perfectly to cover the negative inset bleed
    const dynamicFontSize = (window.innerWidth * 1.25) / (COLS * charAspectRatio);
    if (preRef.current) {
      preRef.current.style.fontSize = `${dynamicFontSize}px`;
    }
    
    const baseChars = [];
    
    for (let y = 0; y < ROWS; y++) {
      const cRow = [];
      for (let x = 0; x < COLS; x++) {
        const noise = (Math.sin(x * 0.15) * Math.cos(y * 0.15) + 1) * 0.5; 
        const b = noise * 0.3 + (Math.random() * 0.2); 
        
        if (b < 0.1) {
          cRow.push(' ');
        } else {
          const ci = Math.min(SHADE.length - 1, Math.floor(b * SHADE.length));
          cRow.push(SHADE[ci]);
        }
      }
      baseChars.push(cRow);
    }

    const mouse = { gx: -999, gy: -999 };

    const onMove = (e) => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      mouse.gx = ((e.clientX - rect.left) / rect.width) * COLS;
      mouse.gy = ((e.clientY - rect.top) / rect.height) * ROWS;
    };
    
    const onLeave = () => { mouse.gx = -999; mouse.gy = -999; };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    let active = true;
    const heatMap = new Float32Array(COLS * ROWS);
    let lastMouse = { x: -999, y: -999 };

    // 4D Orbiters (Clifford Torus projection)
    const orbiters = [];
    const orbiterCount = isLowEnd ? 2 : (isMobile ? 3 : 4);
    for (let i = 0; i < orbiterCount; i++) {
      orbiters.push({
        a: Math.random() * Math.PI * 2,
        b: Math.random() * Math.PI * 2,
        speedA: (Math.random() - 0.5) * 0.15,
        speedB: (Math.random() - 0.5) * 0.15,
        lastX: -999,
        lastY: -999
      });
    }
    let time4D = 0;

    let lastTime = 0;
    const tick = (time) => {
      if (!active || !preRef.current) return;
      requestAnimationFrame(tick);
      
      // Throttle rendering: 20 FPS on low-end, 30 FPS on normal devices
      const throttleMs = isLowEnd ? 66 : 50;
      if (time - lastTime < throttleMs) return; 
      lastTime = time;

      // Update 4D rotation time (slower on low-end devices)
      time4D += isLowEnd ? 0.015 : 0.03;
      const R1 = 30; // Radius in X-W plane
      const R2 = 15; // Radius in Y-Z plane
      
      const rotXW = time4D * 0.8;
      const rotYW = time4D * 1.1;

      for (const p of orbiters) {
        p.a += p.speedA;
        p.b += p.speedB;
        
        // 4D Coordinates
        let x4 = R1 * Math.cos(p.a);
        let y4 = R1 * Math.sin(p.a);
        let z4 = R2 * Math.cos(p.b);
        let w4 = R2 * Math.sin(p.b);
        
        // Rotate in XW plane
        let nx = x4 * Math.cos(rotXW) - w4 * Math.sin(rotXW);
        let nw = x4 * Math.sin(rotXW) + w4 * Math.cos(rotXW);
        x4 = nx; w4 = nw;
        
        // Rotate in YW plane
        let ny = y4 * Math.cos(rotYW) - w4 * Math.sin(rotYW);
        nw = y4 * Math.sin(rotYW) + w4 * Math.cos(rotYW);
        y4 = ny; w4 = nw;
        
        // 4D to 3D Projection (stereographic)
        const distance4D = 50; 
        const wProj = 1 / (distance4D - w4);
        let x3 = x4 * wProj * 100;
        let y3 = y4 * wProj * 100;
        let z3 = z4 * wProj * 100;
        
        // 3D to 2D Projection
        const distance3D = 70;
        const zProj = 1 / (distance3D - z3);
        
        // Map to ASCII grid (scale Y slightly for character aspect ratio)
        const screenX = (COLS / 2) + (x3 * zProj * 80);
        const screenY = (ROWS / 2) + (y3 * zProj * 40);
        
        // Trace orbit heat path
        if (p.lastX !== -999) {
          const vx = screenX - p.lastX;
          const vy = screenY - p.lastY;
          const velocity = Math.sqrt(vx * vx + vy * vy);
          
          // Capped Dynamic Orbiter Radius
          const dynamicRadius = Math.min(3, 1 + velocity * 0.1);
          const steps = Math.min(3, Math.max(1, Math.floor(velocity / 3.5)));
          
          for (let s = 1; s <= steps; s++) {
            const lerpX = p.lastX + (vx * (s / steps));
            const lerpY = p.lastY + (vy * (s / steps));
            const r = Math.ceil(dynamicRadius);
            
            for (let ty = Math.floor(lerpY - r); ty <= Math.ceil(lerpY + r); ty++) {
              for (let tx = Math.floor(lerpX - r); tx <= Math.ceil(lerpX + r); tx++) {
                if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
                  const d = Math.sqrt((tx - lerpX)**2 + (ty - lerpY)**2);
                  if (d < dynamicRadius) {
                    const intensity = (1 - (d / dynamicRadius)) * 0.85; 
                    const idx = ty * COLS + tx;
                    heatMap[idx] = Math.max(heatMap[idx], intensity);
                  }
                }
              }
            }
          }
        }
        p.lastX = screenX;
        p.lastY = screenY;
      }

      // Calculate mouse velocity
      const vx = mouse.gx - lastMouse.x;
      const vy = mouse.gy - lastMouse.y;
      const velocity = Math.sqrt(vx * vx + vy * vy);
      
      // Capped brush size for mouse
      const dynamicRadius = Math.min(6, 2 + velocity * 0.15);
      const steps = Math.min(4, Math.max(1, Math.floor(velocity / 3.5)));

      // Interpolate mouse movement
      if (mouse.gx !== -999) {
        for (let s = 1; s <= steps; s++) {
          const lerpX = lastMouse.x + (vx * (s / steps));
          const lerpY = lastMouse.y + (vy * (s / steps));
          const r = Math.ceil(dynamicRadius);
          
          for (let ty = Math.floor(lerpY - r); ty <= Math.ceil(lerpY + r); ty++) {
            for (let tx = Math.floor(lerpX - r); tx <= Math.ceil(lerpX + r); tx++) {
              if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
                const d = Math.sqrt((tx - lerpX)**2 + (ty - lerpY)**2);
                if (d < dynamicRadius) {
                  const intensity = 1 - (d / dynamicRadius);
                  const idx = ty * COLS + tx;
                  heatMap[idx] = Math.max(heatMap[idx], intensity);
                }
              }
            }
          }
        }
      }

      lastMouse.x = mouse.gx;
      lastMouse.y = mouse.gy;

      let out = '';
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const idx = y * COLS + x;
          
          // Cool down the heat
          heatMap[idx] *= 0.88; 
          const heat = heatMap[idx];

          if (heat > 0.6) {
            out += GLITCH[Math.floor(Math.random() * GLITCH.length)];
          } else if (heat > 0.15) {
            if (baseChars[y][x] === ' ') {
              out += (Math.random() < heat * 1.5) ? '.' : ' ';
            } else {
              out += (Math.random() < heat) ? GLITCH[Math.floor(Math.random() * GLITCH.length)] : baseChars[y][x];
            }
          } else {
            if (Math.random() < 0.0005) {
              out += GLITCH[Math.floor(Math.random() * GLITCH.length)];
            } else {
              out += baseChars[y][x];
            }
          }
        }
        out += '\n';
      }

      preRef.current.textContent = out;
    };

    requestAnimationFrame(tick);

    return () => {
      active = false;
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className="ascii-hero-bg" ref={wrapRef}>
      <pre ref={preRef} className="ascii-text-bg" />
    </div>
  );
}
