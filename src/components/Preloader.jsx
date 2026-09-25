import { useLayoutEffect, useRef } from 'react';
import { gsap, reduced, bus } from '../lib/motion';
import Mark from './Mark';
import { loader } from '../lib/preload';

const CELLS = 24;

export default function Preloader({ onDone }) {
  const root = useRef(null);
  const count = useRef(null);
  const big = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const n = { v: 0 };
      // a second visit in the same session doesn't need the full count
      let seen = false;
      try { seen = sessionStorage.getItem('hb-seen') === '1'; sessionStorage.setItem('hb-seen', '1'); } catch { /* storage blocked */ }
      const cells = gsap.utils.toArray('.pre__cell');
      const guides = big.current.querySelectorAll('.mark__guide');
      const notes = big.current.querySelectorAll('.mark__note');
      const ink = big.current.querySelectorAll('.mark__ink');
      const bar = big.current.querySelector('.mark__bar');
      const count_ = reduced ? 0.4 : seen ? 0.8 : 1.9;

      gsap.set([...guides, ...ink], { strokeDashoffset: 1 });
      gsap.set(notes, { autoAlpha: 0 });
      gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' });

      // the monogram flies from the drawing board into the nav
      const fly = () => {
        const layer = big.current;
        const from = layer.querySelector('.mark__frame').getBoundingClientRect();
        const to = document.querySelector('.nav .mark__frame')?.getBoundingClientRect();
        const land = () => { bus.emit('logo:landed'); gsap.set(layer, { display: 'none' }); };
        if (!to || reduced) return land();
        const box = layer.getBoundingClientRect();
        gsap.to(layer, {
          x: to.left + to.width / 2 - (from.left + from.width / 2),
          y: to.top + to.height / 2 - (from.top + from.height / 2),
          scale: to.width / from.width,
          transformOrigin: `${from.left + from.width / 2 - box.left}px ${from.top + from.height / 2 - box.top}px`,
          duration: 1.05,
          ease: 'expo.inOut',
          onComplete: land,
        });
      };

      // the counter never runs ahead of what has actually loaded
      const shown = { v: 0 };
      let painted = -1;
      const paint = () => {
        const target = Math.min(n.v, 100 * loader.progress);
        shown.v += (target - shown.v) * 0.2;
        if (Math.abs(target - shown.v) < 0.4) shown.v = target;
        const v = Math.round(shown.v);
        if (v === painted) return;
        painted = v;
        count.current.textContent = String(v).padStart(3, '0');
        const lit = Math.round((v / 100) * CELLS);
        cells.forEach((c, i) => c.classList.toggle('is-on', i < lit));
      };
      gsap.ticker.add(paint);

      const tl = gsap.timeline({ paused: true });
      tl.to(n, { v: 100, duration: count_, ease: 'power3.inOut' })
        // drafting: construction lines first, then the strokes trace over them
        .to(guides, { strokeDashoffset: 0, duration: count_ * 0.45, stagger: count_ * 0.03, ease: 'power2.inOut' }, 0)
        .to(notes, { autoAlpha: 1, duration: 0.3, stagger: 0.1 }, count_ * 0.3)
        .to(ink, { strokeDashoffset: 0, duration: count_ * 0.45, stagger: count_ * 0.1, ease: 'power3.inOut' }, count_ * 0.25)
        .to(bar, { scaleX: 1, duration: 0.5, ease: 'expo.out' }, count_ * 0.9)
        // hold here until everything is in, then let the counter land on 100
        .addPause('+=0', () => loader.ready().then(() => {
          gsap.delayedCall(0.4, () => { gsap.ticker.remove(paint); count.current.textContent = '100'; cells.forEach((c) => c.classList.add('is-on')); tl.play(); });
        }))
        .to([...guides, ...notes], { autoAlpha: 0, duration: 0.35 }, '+=0.12')
        .to('.pre__row > *', { yPercent: -120, duration: 0.7, ease: 'power3.in', stagger: 0.03 }, '<')
        .add(fly, '-=0.35')
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '<')
        .add(onDone, '-=0.75')
        .set(root.current, { display: 'none' });

      // wait for type so nothing reflows after the reveal
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(() => tl.play());
      return () => gsap.ticker.remove(paint);
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
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
            <span className="mono">Drafting HB — 26</span>
          </div>
        </div>
      </div>
      <div className="pre-mark" ref={big} aria-hidden="true">
        <Mark guides />
      </div>
    </>
  );
}
