import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, bus, reduced } from '../lib/motion';

const WORD = 'Harsh Bavaskar';

/*
  HB monogram: the B shares the H's right stem, and the H's crossbar is the
  signal orange. It draws itself in once the page is ready, the name folds
  away into the mark after the hero, and hovering rolls the letters.
*/
export default function Logo() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const strokes = el.querySelectorAll('.logo__ink');
    const bar = el.querySelector('.logo__bar');
    const word = el.querySelector('.logo__word');
    const chars = el.querySelectorAll('.logo__ch > span');
    gsap.set(strokes, { strokeDashoffset: 1 });
    gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' });
    gsap.set(chars, { yPercent: 110 });

    let open = true;
    const fold = (show) => {
      if (show === open) return;
      open = show;
      gsap.to(word, { width: show ? 'auto' : 0, duration: 0.8, ease: 'expo.inOut', overwrite: true });
      gsap.to(chars, { yPercent: show ? 0 : -110, duration: 0.6, stagger: { each: 0.018, from: show ? 'start' : 'end' }, ease: 'expo.out', overwrite: true });
    };

    const intro = () => {
      const tl = gsap.timeline();
      tl.to(strokes, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: 'power3.inOut' })
        .to(bar, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, 0.35)
        .to(chars, { yPercent: 0, duration: 0.9, stagger: 0.022, ease: 'expo.out' }, 0.3);
      if (reduced) tl.progress(1);
    };
    const offReady = bus.on('ready', intro);

    // past the hero the name folds into the mark
    const st = ScrollTrigger.create({
      start: () => innerHeight * 0.5,
      end: 'max',
      onToggle: (self) => fold(!self.isActive),
    });

    // hovering the mark redraws it, and unfolds the name if it was folded
    const enter = () => {
      gsap.fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.06, ease: 'power3.inOut', overwrite: true });
      gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.5, delay: 0.15, ease: 'expo.out', overwrite: true });
      if (st.isActive) fold(true);
    };
    const leave = () => { if (st.isActive) fold(false); };
    const hit = el.closest('a') || el;
    hit.addEventListener('pointerenter', enter);
    hit.addEventListener('pointerleave', leave);
    return () => {
      offReady();
      st.kill();
      hit.removeEventListener('pointerenter', enter);
      hit.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <span className="logo" ref={root}>
      <svg className="logo__mark" viewBox="0 0 28 28" aria-hidden="true">
        <path className="logo__ink" pathLength="1" d="M4 3.5v21" />
        <path className="logo__ink" pathLength="1" d="M13 3.5v21" />
        <path className="logo__ink" pathLength="1" d="M13 3.5h4.5a5 5 0 0 1 0 10.5H13" />
        <path className="logo__ink" pathLength="1" d="M13 14h5.5a5.25 5.25 0 0 1 0 10.5H13" />
        <path className="logo__bar" d="M4 14h9" />
      </svg>
      <span className="logo__word" aria-label={WORD}>
        {WORD.split('').map((c, i) => (
          <span className="logo__ch" key={i} style={{ '--i': i }} aria-hidden="true">
            <span data-ch={c === ' ' ? ' ' : c}>{c === ' ' ? ' ' : c}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
