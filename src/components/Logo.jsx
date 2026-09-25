import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, bus, reduced, finePointer } from '../lib/motion';
import Mark from './Mark';

const WORD = 'Harsh Bavaskar';

/*
  The nav logo. The monogram arrives from the preloader's drawing board;
  after that it is alive: it leans with scroll speed, tilts toward the
  pointer, re-sweeps its crossbar on every new chapter, and the name
  retracts into it past the hero.
*/
export default function Logo() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const mark = el.querySelector('.mark');
    const ink = el.querySelectorAll('.mark__ink');
    const bar = el.querySelector('.mark__bar');
    const word = el.querySelector('.logo__word');
    const chars = el.querySelectorAll('.logo__ch > span');
    gsap.set(mark, { autoAlpha: 0, transformPerspective: 160 });
    gsap.set(bar, { transformOrigin: '0% 50%' });
    gsap.set(chars, { yPercent: 110 });

    let landed = false, open = true;
    const land = () => {
      if (landed) return;
      landed = true;
      gsap.set(mark, { autoAlpha: 1 });
      gsap.to(chars, { yPercent: 0, x: 0, duration: 0.9, stagger: 0.022, ease: 'expo.out', delay: 0.05 });
    };
    const offLanded = bus.on('logo:landed', land);
    // if the preloader never hands over (reduced motion, errors), show it anyway
    const offReady = bus.on('ready', () => setTimeout(land, 1800));

    // the name retracts into the mark past the hero, and slides back out
    const fold = (show) => {
      if (show === open) return;
      open = show;
      gsap.to(word, { width: show ? 'auto' : 0, duration: 0.8, ease: 'expo.inOut', overwrite: true });
      gsap.to(chars, {
        yPercent: show ? 0 : -110,
        x: show ? 0 : -14,
        duration: 0.6,
        stagger: { each: 0.018, from: show ? 'start' : 'end' },
        ease: 'expo.out',
        overwrite: true,
      });
    };
    const st = ScrollTrigger.create({
      start: () => innerHeight * 0.5,
      end: 'max',
      onToggle: (self) => fold(!self.isActive),
    });

    // lean with scroll speed, then spring back upright
    const lean = { v: 0 };
    const clamp = gsap.utils.clamp(-9, 9);
    const setSkew = gsap.quickSetter(mark, 'skewX', 'deg');
    const speed = reduced ? null : ScrollTrigger.create({
      onUpdate: (self) => {
        const v = clamp(self.getVelocity() / -320);
        if (Math.abs(v) > Math.abs(lean.v)) {
          lean.v = v;
          gsap.to(lean, { v: 0, duration: 0.9, ease: 'power3', overwrite: true, onUpdate: () => setSkew(lean.v) });
        }
      },
    });

    // a fresh stroke of orange for every chapter
    const offChapter = bus.on('chapter', () => {
      if (landed && !reduced) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'expo.out', overwrite: true });
    });

    // hover: tilt toward the pointer, redraw, unfold if folded
    const hit = el.closest('a') || el;
    const rx = gsap.quickTo(mark, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(mark, 'rotationY', { duration: 0.5, ease: 'power3' });
    const enter = () => {
      gsap.fromTo(ink, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.06, ease: 'power3.inOut', overwrite: true });
      gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.5, delay: 0.15, ease: 'expo.out', overwrite: true });
      if (st.isActive) fold(true);
    };
    const move = (e) => {
      const r = mark.getBoundingClientRect();
      ry(gsap.utils.clamp(-35, 35, ((e.clientX - (r.left + r.width / 2)) / r.width) * 40));
      rx(gsap.utils.clamp(-35, 35, (-(e.clientY - (r.top + r.height / 2)) / r.height) * 40));
    };
    const leave = () => {
      gsap.to(mark, { rotationX: 0, rotationY: 0, duration: 1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
      if (st.isActive) fold(false);
    };
    if (finePointer) {
      hit.addEventListener('pointerenter', enter);
      hit.addEventListener('pointermove', move);
      hit.addEventListener('pointerleave', leave);
    }
    return () => {
      offLanded();
      offReady();
      offChapter();
      st.kill();
      speed?.kill();
      hit.removeEventListener('pointerenter', enter);
      hit.removeEventListener('pointermove', move);
      hit.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <span className="logo" ref={root}>
      <Mark className="logo__mark" />
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
