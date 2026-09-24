import { useEffect, useRef, useState } from 'react';
import { gsap, bus, scrollTo, ScrollTrigger, lockScroll } from '../lib/motion';
import { toggleSound, click } from '../lib/sound';
import { chapters, early } from '../data';
import { wipeTo } from '../early/wipe';
import Clock from './Clock';

export default function Nav() {
  const title = useRef(null);
  const num = useRef(null);
  const bar = useRef(null);
  const [soundOn, setSoundOn] = useState(false);
  const [open, setOpen] = useState(false);

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

  const go = (id) => (e) => {
    e.preventDefault();
    click(1200);
    if (open) { setOpen(false); lockScroll(false); }
    scrollTo(`#${id}`);
  };
  const toggle = () => { lockScroll(!open); setOpen(!open); };

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
      <button type="button" className="nav__menu mono" aria-expanded={open} aria-controls="menu" onClick={toggle}>
        {open ? 'Close' : 'Menu'}
      </button>
      <div className="nav__progress" aria-hidden="true"><i ref={bar} /></div>
      <nav id="menu" className={`menu${open ? ' is-open' : ''}`} aria-label="Chapters" aria-hidden={!open}>
        {chapters.slice(1).map((c, k) => (
          <a key={c.id} href={`#${c.id}`} onClick={go(c.id)} style={{ transitionDelay: open ? `${0.12 + k * 0.04}s` : '0s' }} tabIndex={open ? 0 : -1}>
            <span className="mono">{c.n}</span>{c.title}
          </a>
        ))}
        <p className="menu__early mono" style={{ transitionDelay: open ? '0.45s' : '0s' }}>
          {early.map((e) => (
            <a key={e.href} href={e.href} tabIndex={open ? 0 : -1} onClick={(ev) => { ev.preventDefault(); wipeTo(e.href, { color: e.color, ink: e.ink, label: e.wipe }); }}>
              {e.label} →
            </a>
          ))}
        </p>
      </nav>
    </header>
  );
}
