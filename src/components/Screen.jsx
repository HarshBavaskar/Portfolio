import { useEffect, useRef } from 'react';
import { demos } from '../demos';

// Hosts a canvas demo: sizes it, runs it only while on screen, feeds it the pointer.
export default function Screen({ id }) {
  const canvas = useRef(null);
  const readout = useRef(null);

  useEffect(() => {
    const el = canvas.current;
    const c = el.getContext('2d');
    const demo = demos[id]();
    const ptr = { x: 0, y: 0, inside: false };
    let w = 0, h = 0, raf = 0, running = false, last = 0, t = 0, tick = 0;
    // phones get 30 fps: the models read the same, the battery lasts longer
    const minDt = matchMedia('(pointer: coarse)').matches ? 1 / 32 : 0;

    const size = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      w = r.width; h = r.height;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const loop = (now) => {
      raf = running ? requestAnimationFrame(loop) : 0;
      const raw = (now - last) / 1000 || 0.016;
      if (raw < minDt) return;
      const dt = Math.min(0.05, raw);
      last = now;
      t += dt;
      demo.frame(c, w, h, t, dt, ptr);
      if ((tick += dt) > 0.12) { tick = 0; readout.current.textContent = demo.readout; }
    };
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (running) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }, { rootMargin: '100px' });
    io.observe(el);
    // one static frame so it's never blank
    demo.frame(c, w, h, 0, 0.016, ptr);

    const move = (e) => {
      const r = el.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.inside = true;
    };
    const leave = () => { ptr.inside = false; };
    const down = () => demo.click?.();
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointerdown', down);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointerdown', down);
    };
  }, [id]);

  return (
    <>
      <canvas ref={canvas} className="screen__canvas" />
      <span className="device__readout mono" ref={readout} aria-live="off" />
    </>
  );
}
