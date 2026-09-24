import { useLayoutEffect, useRef } from 'react';
import { gsap, SplitText, scrollTo, finePointer } from '../lib/motion';
import { links } from '../data';
import Magnetic from '../components/Magnetic';
import Clock from '../components/Clock';

export default function Contact() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // the chapter rises over the last one like a sheet being lifted
      gsap.fromTo('.ct__sheet', { clipPath: 'inset(14% 5% 0% 5% round 28px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top 15%', scrub: true },
      });
      const head = SplitText.create('.ct__head', { type: 'chars,lines', mask: 'lines' });
      gsap.from(head.chars, {
        yPercent: 120, rotate: 6, stagger: 0.018, duration: 1.2,
        scrollTrigger: { trigger: '.ct__head', start: 'top 80%' },
      });
      const mail = SplitText.create('.ct__mail-text', { type: 'chars' });
      if (finePointer) {
        const el = root.current.querySelector('.ct__mail');
        const wave = () => gsap.fromTo(mail.chars, { yPercent: 0 }, { yPercent: -22, duration: 0.25, ease: 'power2.out', stagger: 0.018, yoyo: true, repeat: 1, overwrite: true });
        el.addEventListener('pointerenter', wave);
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" className="ct" ref={root} data-chapter data-theme="dark">
      <div className="ct__sheet">
        <div className="wrap">
          <div className="sec-head mono"><span>07 — Contact</span><span className="dim">Open to internships, research and builds</span></div>
          <h2 className="ct__head">Got something<br />that needs to move?</h2>
          <a className="ct__mail" href={`mailto:${links.email}`} data-cursor="Write">
            <span className="ct__mail-text">{links.email}</span>
            <span className="ct__arrow" aria-hidden="true">↗</span>
          </a>
          <div className="ct__row">
            <Magnetic href={`mailto:${links.email}`} className="btn btn--inv">Email</Magnetic>
            <Magnetic href={links.linkedin} target="_blank" rel="noreferrer" className="btn btn--inv">LinkedIn ↗</Magnetic>
            <Magnetic href={links.github} target="_blank" rel="noreferrer" className="btn btn--inv">GitHub ↗</Magnetic>
          </div>
        </div>
        <footer className="ft wrap mono">
          <span>© 2026 Harsh Bavaskar</span>
          <span className="dim">Mumbai · <Clock /></span>
          <span className="dim ft__hint">Press G for the grid</span>
          <button type="button" className="ulink" onClick={() => scrollTo('#top')}>Back to top ↑</button>
        </footer>
      </div>
    </section>
  );
}
