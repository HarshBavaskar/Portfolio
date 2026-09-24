import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, SplitText, isDesktop, reduced } from '../lib/motion';
import { roverState, roverApi } from '../gl/rover';

const HERO_DIST = 1.55;

export default function Hero({ ready }) {
  const root = useRef(null);
  const split = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      split.current = SplitText.create('.hero__name .line', { type: 'chars', mask: 'chars' });
      gsap.set(split.current.chars, { yPercent: 110 });
      gsap.set('.hero [data-in]', { autoAlpha: 0, y: 16 });
      Object.assign(roverState, { intro: 0, dist: 1.9, cx: isDesktop() ? 0.72 : 0.5, cy: isDesktop() ? 0.43 : 0.35 });

      // scroll-out: the name lifts away, the rover glides to centre stage
      const mm = gsap.matchMedia();
      mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)' }, (c) => {
        const desk = c.conditions.desk;
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        tl.fromTo(roverState, { dist: HERO_DIST, cx: desk ? 0.72 : 0.5, cy: desk ? 0.43 : 0.35, auto: 1, lock: 0 }, { dist: 1.12, cx: desk ? 0.68 : 0.5, cy: desk ? 0.56 : 0.6, auto: 0, lock: 1 }, 0)
          .to('.hero__name .line:first-child', { xPercent: -8 }, 0)
          .to('.hero__name .line:last-child', { xPercent: 8 }, 0)
          .to('.hero__name', { yPercent: -18, autoAlpha: 0.1 }, 0)
          .to('.hero__meta, .hero__intro, .hero__fig-ui, .hero__foot', { autoAlpha: 0, y: -40 }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const tl = gsap.timeline();
    tl.to(split.current.chars, { yPercent: 0, duration: 1.5, stagger: 0.035, ease: 'expo.out' })
      .fromTo(roverState, { dist: 1.9 }, { intro: 1, dist: HERO_DIST, duration: 2.2, ease: 'expo.out' }, 0.1)
      .to('.hero [data-in]', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.06 }, 0.45);
    if (reduced) tl.progress(1);
    return () => tl.kill();
  }, [ready]);

  // drag to rotate the figure
  useEffect(() => {
    const el = root.current.querySelector('.hero__fig');
    let down = false, lx = 0;
    const d = (e) => { down = true; lx = e.clientX; el.setPointerCapture?.(e.pointerId); };
    const m = (e) => { if (!down) return; roverApi.current?.drag(e.clientX - lx); lx = e.clientX; };
    const u = () => { down = false; };
    el.addEventListener('pointerdown', d);
    el.addEventListener('pointermove', m);
    el.addEventListener('pointerup', u);
    el.addEventListener('pointercancel', u);
    return () => {
      el.removeEventListener('pointerdown', d);
      el.removeEventListener('pointermove', m);
      el.removeEventListener('pointerup', u);
      el.removeEventListener('pointercancel', u);
    };
  }, []);

  return (
    <section id="top" className="hero" ref={root} data-chapter data-theme="light">
      <div className="hero__meta wrap grid mono">
        <p data-in className="c1"><span className="dim">(Portfolio)</span><br />Edition 2026</p>
        <p data-in className="c2"><span className="dim">Practice</span><br />Robotics, embedded<br />systems, computer vision</p>
        <p data-in className="c3"><span className="dim">Currently</span><br />AI Intern,<br />House of Hiranandani</p>
        <p data-in className="c4"><span className="dim">Based in</span><br />Mumbai, India<br />19.07° N 72.87° E</p>
      </div>

      <div className="hero__fig" data-cursor="Drag">
        <div className="hero__fig-ui" aria-hidden="true">
          <i className="crop tl" /><i className="crop tr" /><i className="crop bl" /><i className="crop br" />
          <span className="hero__caption mono" data-in>Fig. 01 — Rover, six subsystems <span className="dim">· drag to rotate</span></span>
        </div>
      </div>

      <p className="hero__intro wrap" data-in>
        I carry machines from <em>CAD to competition</em> — the mechanics, the electronics and the code that makes them move.
      </p>

      <h1 className="hero__name wrap" aria-label="Harsh Bavaskar">
        <span className="line" aria-hidden="true">Harsh</span>
        <span className="line" aria-hidden="true">Bavaskar</span>
      </h1>

      <div className="hero__foot wrap mono" data-in>
        <span>Third-year BTech, Computer Science — AI &amp; ML</span>
        <span className="hero__scroll">Scroll <i aria-hidden="true" /></span>
        <span>Next: 01 — The Rover</span>
      </div>
    </section>
  );
}
