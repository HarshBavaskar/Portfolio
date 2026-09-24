import { useEffect, useRef } from 'react';
import { gsap, finePointer } from '../lib/motion';
import { click } from '../lib/sound';

// Pulls towards the pointer, springs back on leave.
export default function Magnetic({ as = 'a', strength = 0.35, className = '', children, ...props }) {
  const ref = useRef(null);
  const Tag = as;
  useEffect(() => {
    const el = ref.current;
    if (!finePointer) return;
    const inner = el.querySelector('.mag__inner');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      gsap.to(inner, { x: dx * strength * 0.35, y: dy * strength * 0.35, duration: 0.6, ease: 'power3' });
    };
    const leave = () => {
      gsap.to([el, inner], { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
    };
    const enter = () => click(1600, 0.02, 0.04);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointerenter', enter);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointerenter', enter);
    };
  }, [strength]);
  return (
    <Tag ref={ref} className={`mag ${className}`} {...props}>
      <span className="mag__inner">{children}</span>
    </Tag>
  );
}
