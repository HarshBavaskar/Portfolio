import { useLayoutEffect, useRef } from 'react';
import { gsap, reduced } from '../lib/motion';

const CELLS = 24;

export default function Preloader({ onDone }) {
  const root = useRef(null);
  const count = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const n = { v: 0 };
      const cells = gsap.utils.toArray('.pre__cell');
      const tl = gsap.timeline({ paused: true });
      tl.to(n, {
        v: 100,
        duration: reduced ? 0.4 : 1.9,
        ease: 'power3.inOut',
        onUpdate: () => {
          const v = Math.round(n.v);
          count.current.textContent = String(v).padStart(3, '0');
          const lit = Math.round((v / 100) * CELLS);
          cells.forEach((c, i) => c.classList.toggle('is-on', i < lit));
        },
      })
        .to('.pre__row > *', { yPercent: -120, duration: 0.7, ease: 'power3.in', stagger: 0.03 }, '+=0.15')
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
        .add(onDone, '-=0.75')
        .set(root.current, { display: 'none' });

      // wait for type so nothing reflows after the reveal
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(() => tl.play());
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pre" ref={root} aria-hidden="true">
      <div className="pre__row pre__top mono">
        <span>Harsh Bavaskar</span>
        <span>Portfolio — Edition 2026</span>
        <span>Mumbai, IN</span>
      </div>
      <div className="pre__row pre__bottom">
        <span className="pre__count" ref={count}>000</span>
        <div className="pre__meter">
          <div className="pre__cells">
            {Array.from({ length: CELLS }, (_, i) => <i key={i} className="pre__cell" />)}
          </div>
          <span className="mono">Assembling six subsystems</span>
        </div>
      </div>
    </div>
  );
}
