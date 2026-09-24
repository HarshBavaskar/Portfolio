import { useEffect, useRef } from 'react';
import { gsap, finePointer } from '../lib/motion';

// A dot that becomes a labelled disc over draggable / viewable things.
export default function Cursor() {
  const dot = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (!finePointer) return;
    document.documentElement.classList.add('has-cursor');
    const el = dot.current;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3' });
    let mode = '';
    gsap.set(el, { autoAlpha: 0 });
    let shown = false;

    const set = (next, text = '') => {
      if (next === mode) return;
      mode = next;
      el.dataset.mode = next;
      label.current.textContent = text;
    };
    const move = (e) => {
      if (!shown) { shown = true; gsap.set(el, { x: e.clientX, y: e.clientY }); gsap.to(el, { autoAlpha: 1, duration: 0.3 }); }
      xTo(e.clientX);
      yTo(e.clientY);
      const t = e.target.closest?.('[data-cursor], a, button');
      if (!t) return set('');
      if (t.dataset.cursor) return set('label', t.dataset.cursor);
      set('link');
    };
    const down = () => gsap.to(el, { scale: 0.8, duration: 0.2 });
    const up = () => gsap.to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const leave = () => gsap.to(el, { autoAlpha: 0, duration: 0.2 });
    const enter = () => gsap.to(el, { autoAlpha: 1, duration: 0.2 });

    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
    };
  }, []);

  if (!finePointer) return null;
  return (
    <div className="cursor" ref={dot} aria-hidden="true">
      <span className="cursor__label mono" ref={label} />
    </div>
  );
}
