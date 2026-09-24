import { useEffect, useRef, useState } from 'react';
import { gsap, bus, scrollTo, ScrollTrigger } from '../lib/motion';
import { toggleSound, click } from '../lib/sound';
import { chapters } from '../data';
import Clock from './Clock';

export default function Nav() {
  const title = useRef(null);
  const num = useRef(null);
  const bar = useRef(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const off = bus.on('chapter', (i) => {
      const c = chapters[i];
      if (!c) return;
      gsap.to(num.current, { duration: 0.6, scrambleText: { text: c.n, chars: '0123456789', speed: 0.6 } });
      gsap.to(title.current, { duration: 0.8, scrambleText: { text: c.title, chars: 'upperCase', speed: 0.5 } });
    });
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (s) => gsap.set(bar.current, { scaleX: s.progress }),
    });
    return () => { off(); st.kill(); };
  }, []);

  const go = (id) => (e) => { e.preventDefault(); click(1200); scrollTo(`#${id}`); };

  return (
    <header className="nav">
      <a className="nav__brand" href="#top" onClick={go('top')}>
        <i className="nav__mark" aria-hidden="true" />
        Harsh Bavaskar
      </a>
      <div className="nav__chapter mono" aria-live="polite">
        <span ref={num}>00</span>
        <span className="nav__sep">/</span>
        <span ref={title}>Index</span>
      </div>
      <nav className="nav__links mono" aria-label="Sections">
        <a href="#work" onClick={go('work')}>Work</a>
        <a href="#path" onClick={go('path')}>Path</a>
        <a href="#contact" onClick={go('contact')}>Contact</a>
      </nav>
      <div className="nav__right mono">
        <button type="button" className="nav__sound" aria-pressed={soundOn} onClick={() => setSoundOn(toggleSound())}>
          <span className="nav__sound-bars" aria-hidden="true"><i /><i /><i /></span>
          Sound {soundOn ? 'on' : 'off'}
        </button>
        <span className="nav__clock"><Clock /></span>
      </div>
      <div className="nav__progress" aria-hidden="true"><i ref={bar} /></div>
    </header>
  );
}
