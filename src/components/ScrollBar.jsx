import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, bus, lenis, touch, reduced } from '../lib/motion';

/*
  A plain scroll bar: one slim thumb at the window's edge. It stretches a
  little with scroll speed, fades when you stop, and can be dragged. It
  takes no room and catches no clicks except on the thumb itself.
*/
export default function ScrollBar() {
  const root = useRef(null);
  const thumb = useRef(null);

  useEffect(() => {
    const el = root.current, th = thumb.current;
    let H = 1, TH = 40, p = 0, drag = null, rest;
    const max = () => ScrollTrigger.maxScroll(window) || 1;
    const place = () => gsap.set(th, { y: (H - TH) * p });
    const measure = () => {
      H = el.clientHeight;
      TH = Math.max(40, (innerHeight / document.documentElement.scrollHeight) * H);
      th.style.height = `${TH}px`;
      place();
    };
    const stretch = gsap.quickTo(th, 'scaleY', { duration: 0.35, ease: 'power3' });
    const wake = () => {
      el.classList.add('is-live');
      clearTimeout(rest);
      rest = setTimeout(() => { el.classList.remove('is-live'); stretch(1); }, touch ? 900 : 1200);
    };
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        p = self.progress;
        place();
        if (!reduced) stretch(1 + Math.min(0.5, Math.abs(self.getVelocity()) / 8000));
        wake();
      },
      onRefresh: measure,
    });
    const offReady = bus.on('ready', () => { el.classList.add('is-ready'); measure(); });

    // drag the thumb: its position maps straight to the page
    const down = (e) => {
      e.preventDefault();
      drag = e.clientY - th.getBoundingClientRect().top;
      th.setPointerCapture(e.pointerId);
      el.classList.add('is-drag');
      bus.emit('navigate');
    };
    const move = (e) => {
      if (drag === null) return;
      const t = gsap.utils.clamp(0, 1, (e.clientY - el.getBoundingClientRect().top - drag) / (H - TH)) * max();
      if (lenis) lenis.scrollTo(t, { immediate: true });
      else window.scrollTo(0, t);
    };
    const up = () => { drag = null; el.classList.remove('is-drag'); };
    th.addEventListener('pointerdown', down);
    th.addEventListener('pointermove', move);
    th.addEventListener('pointerup', up);
    th.addEventListener('pointercancel', up);
    addEventListener('resize', measure);
    measure();
    return () => {
      st.kill();
      offReady();
      clearTimeout(rest);
      th.removeEventListener('pointerdown', down);
      th.removeEventListener('pointermove', move);
      th.removeEventListener('pointerup', up);
      th.removeEventListener('pointercancel', up);
      removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div className="sb" ref={root} aria-hidden="true">
      <i className="sb__thumb" ref={thumb} />
    </div>
  );
}
