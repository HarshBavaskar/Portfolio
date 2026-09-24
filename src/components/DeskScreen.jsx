import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/motion';
import { click } from '../lib/sound';

const shots = [
  ['home', 'Home'],
  ['assignments', 'Tasks'],
  ['study-note', 'Notes'],
  ['exams', 'Exams'],
  ['faculty', 'Faculty'],
];
const src = (s) => `${import.meta.env.BASE_URL}work/desk/${s}.webp`;

export default function DeskScreen() {
  const [i, setI] = useState(0);
  const root = useRef(null);
  const paused = useRef(false);
  const visible = useRef(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    io.observe(root.current);
    const id = setInterval(() => {
      if (visible.current && !paused.current) setI((v) => (v + 1) % shots.length);
    }, 3400);
    return () => { clearInterval(id); io.disconnect(); };
  }, []);

  useEffect(() => {
    const imgs = root.current.querySelectorAll('.desk__img');
    imgs.forEach((img, k) => {
      if (k === i) gsap.fromTo(img, { autoAlpha: 0, scale: 1.04, yPercent: 2 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 1.1, ease: 'expo.out' });
      else gsap.to(img, { autoAlpha: 0, duration: 0.5 });
    });
  }, [i]);

  return (
    <div className="desk" ref={root} onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; }}>
      <div className="desk__view">
        {shots.map(([s, label], k) => (
          <img key={s} className="desk__img" src={src(s)} alt={`Desk — ${label} screen`} loading="lazy" decoding="async" style={{ visibility: k === 0 ? 'inherit' : 'hidden' }} />
        ))}
      </div>
      <div className="desk__keys" role="tablist" aria-label="Desk screens">
        {shots.map(([s, label], k) => (
          <button key={s} role="tab" aria-selected={k === i} className={`key-btn mono${k === i ? ' is-on' : ''}`} onClick={() => { click(1100 + k * 120); setI(k); }}>
            <i />{label}
          </button>
        ))}
      </div>
    </div>
  );
}
