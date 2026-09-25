import { useEffect, useRef, useState } from 'react';
import { gsap, bus } from '../lib/motion';
import { click } from '../lib/sound';
import Screen from './Screen';

const url = (p) => `${import.meta.env.BASE_URL}${p}`;

// A device screen with hardware tab keys: live canvas models, stills or video.
// Video loads only once its tab is opened, and plays only while on screen.
export default function TabScreen({ items, auto = 0, tone = 'light', name }) {
  const [i, setI] = useState(0);
  const [inView, setInView] = useState(false);
  const root = useRef(null);
  const paused = useRef(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '400px' });
    io.observe(root.current);
    // once the page is up, buffer the videos in the background so a tab opens instantly
    const off = bus.on('ready', () => root.current?.querySelectorAll('video').forEach((v) => {
      v.preload = 'auto';
      if (!v.getAttribute('src')) v.src = v.dataset.src;
    }));
    return () => { io.disconnect(); off(); };
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const id = setInterval(() => { if (!paused.current) setI((v) => (v + 1) % items.length); }, auto);
    return () => clearInterval(id);
  }, [auto, inView, items.length]);

  useEffect(() => {
    root.current.querySelectorAll('.tabs__pane').forEach((pane, k) => {
      if (k === i) gsap.fromTo(pane, { autoAlpha: 0, scale: 1.035 }, { autoAlpha: 1, scale: 1, duration: 1, ease: 'expo.out' });
      else gsap.to(pane, { autoAlpha: 0, duration: 0.4 });
      const v = pane.querySelector('video');
      if (!v) return;
      if (k === i && inView) {
        if (!v.getAttribute('src')) v.src = v.dataset.src;
        v.play().catch(() => {});
      } else v.pause();
    });
  }, [i, inView]);

  return (
    <div className={`tabs tabs--${tone}`} ref={root} onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; }}>
      <div className="tabs__view">
        {items.map((it, k) => (
          <div className="tabs__pane" key={it.label} style={{ visibility: k === 0 ? 'inherit' : 'hidden' }}>
            {it.type === 'img' && (
              <img className={`tabs__media${it.fit === 'contain' ? ' is-contain' : ''}`} src={url(it.src)} alt={`${name} — ${it.label}`} width="1440" height="900" decoding="async" />
            )}
            {it.type === 'video' && (
              <video
                className={`tabs__media${it.phone ? ' is-phone' : ''}`}
                data-src={url(it.src)}
                poster={url(it.poster)}
                muted
                loop
                playsInline
                preload="none"
                aria-label={`${name} — ${it.label}`}
              />
            )}
            {it.type === 'demo' && k === i && <Screen id={it.id} />}
          </div>
        ))}
      </div>
      <div className="tabs__keys" role="tablist" aria-label={`${name} screens`}>
        {items.map((it, k) => (
          <button key={it.label} type="button" role="tab" aria-selected={k === i} className={`key-btn mono${k === i ? ' is-on' : ''}`} onClick={() => { click(1100 + k * 120); setI(k); }}>
            <i />{it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
