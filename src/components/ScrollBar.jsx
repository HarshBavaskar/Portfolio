import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, bus, lenis, scrollTo, touch, reduced } from '../lib/motion';
import { chapters } from '../data';

/*
  A scroll bar of our own. A thin rail with a tick for every chapter (the
  live one in orange), and a thumb that stretches with scroll speed and
  springs back when you stop. Drag the thumb, click the rail, or pick a
  chapter from its tick. At rest it dims; on phones it only shows while
  you scroll.
*/
export default function ScrollBar() {
  const root = useRef(null);
  const thumb = useRef(null);
  const [marks, setMarks] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current, th = thumb.current;
    let H = 1, TH = 40, p = 0, drag = null, rest;
    const max = () => ScrollTrigger.maxScroll(window) || 1;
    const place = () => gsap.set(th, { y: (H - TH) * p });
    const measure = () => {
      H = el.clientHeight;
      TH = Math.max(36, (innerHeight / document.documentElement.scrollHeight) * H);
      th.style.height = `${TH}px`;
      // chapter ticks: pinned chapters are measured by their spacers
      const m = max();
      setMarks([...document.querySelectorAll('[data-chapter]')].map((s, i) => {
        const sp = s.parentElement.classList.contains('pin-spacer') ? s.parentElement : s;
        return { ...chapters[i], at: Math.min(1, (sp.getBoundingClientRect().top + scrollY) / m) };
      }).filter((c) => c.id));
      place();
    };
    const stretch = gsap.quickTo(th, 'scaleY', { duration: 0.35, ease: 'power3' });
    const wake = () => {
      el.classList.add('is-live');
      clearTimeout(rest);
      rest = setTimeout(() => {
        el.classList.remove('is-live');
        stretch(1);
      }, touch ? 900 : 1400);
    };
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        p = self.progress;
        place();
        if (!reduced) stretch(1 + Math.min(0.9, Math.abs(self.getVelocity()) / 5000));
        wake();
      },
      onRefresh: measure,
    });
    const offChapter = bus.on('chapter', setActive);
    const offReady = bus.on('ready', () => { el.classList.add('is-ready'); measure(); });

    // drag the thumb: its position maps straight to the page
    const jump = (y) => {
      const t = gsap.utils.clamp(0, 1, (y - el.getBoundingClientRect().top - drag) / (H - TH)) * max();
      if (lenis) lenis.scrollTo(t, { immediate: true });
      else window.scrollTo(0, t);
    };
    const down = (e) => {
      e.preventDefault();
      drag = e.clientY - th.getBoundingClientRect().top;
      th.setPointerCapture(e.pointerId);
      el.classList.add('is-drag');
      bus.emit('navigate');
    };
    const move = (e) => { if (drag !== null) jump(e.clientY); };
    const up = () => { drag = null; el.classList.remove('is-drag'); };
    th.addEventListener('pointerdown', down);
    th.addEventListener('pointermove', move);
    th.addEventListener('pointerup', up);
    th.addEventListener('pointercancel', up);

    // click the rail: glide there
    const rail = (e) => {
      if (e.target !== el) return;
      const t = gsap.utils.clamp(0, 1, (e.clientY - el.getBoundingClientRect().top - TH / 2) / (H - TH)) * max();
      bus.emit('navigate', t);
      if (lenis) lenis.scrollTo(t, { duration: 1.2, easing: (k) => 1 - Math.pow(1 - k, 4) });
      else window.scrollTo({ top: t, behavior: 'smooth' });
    };
    el.addEventListener('click', rail);
    addEventListener('resize', measure);
    measure();
    return () => {
      st.kill();
      offChapter();
      offReady();
      clearTimeout(rest);
      th.removeEventListener('pointerdown', down);
      th.removeEventListener('pointermove', move);
      th.removeEventListener('pointerup', up);
      th.removeEventListener('pointercancel', up);
      el.removeEventListener('click', rail);
      removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div className="sb" ref={root} aria-hidden="true">
      <i className="sb__track" />
      {marks.map((m, i) => (
        <button
          type="button"
          tabIndex={-1}
          key={m.id}
          className={`sb__mark${i === active ? ' is-on' : ''}`}
          style={{ top: `${m.at * 100}%` }}
          onClick={() => scrollTo(`#${m.id}`)}
        >
          <span className="mono">{m.n} {m.title}</span>
        </button>
      ))}
      <i className="sb__thumb" ref={thumb} data-cursor="Drag" />
    </div>
  );
}
