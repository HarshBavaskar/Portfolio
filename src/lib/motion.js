import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
ScrollTrigger.config({ ignoreMobileResize: true });
gsap.defaults({ ease: 'expo.out', duration: 1.1 });

export { gsap, ScrollTrigger, SplitText };

export const reduced =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer =
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;
export const touch =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/* ── Smooth scroll ─────────────────────────────────────── */
export let lenis = null;

export function initScroll() {
  // Lenis only smooths wheels; phones keep their own native scrolling
  if (reduced || touch) return () => {};
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  };
}

export function scrollTo(target) {
  const el = document.querySelector(target);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY;
  bus.emit('navigate', y);
  if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}

export const lockScroll = (on) => {
  document.documentElement.classList.toggle('is-locked', on);
  if (lenis) (on ? lenis.stop() : lenis.start());
};

/* ── Theme: paper ↔ ink, one tweened scalar drives CSS and WebGL ── */
const LIGHT = { bg: [238, 236, 231], fg: [18, 18, 18], mute: [128, 125, 118], panel: [228, 225, 218] };
const DARK = { bg: [16, 16, 15], fg: [236, 234, 228], mute: [122, 120, 114], panel: [30, 30, 28] };
export const theme = { t: 0, bg: LIGHT.bg.slice(), fg: LIGHT.fg.slice() };

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function applyTheme() {
  const s = document.documentElement.style;
  for (const k of Object.keys(LIGHT)) {
    const c = mix(LIGHT[k], DARK[k], theme.t);
    s.setProperty(`--${k}`, `rgb(${c})`);
    if (k === 'bg') theme.bg = c;
    if (k === 'fg') {
      theme.fg = c;
      s.setProperty('--line', `rgba(${c},0.14)`);
      s.setProperty('--line-strong', `rgba(${c},0.32)`);
    }
  }
}
// Every step restyles the whole page, so phones take a few quick steps
// instead of a long per-frame fade.
export function setTheme(dark) {
  gsap.to(theme, {
    t: dark ? 1 : 0,
    duration: touch ? 0.4 : 0.9,
    ease: touch ? 'steps(4)' : 'power2.inOut',
    overwrite: true,
    onUpdate: applyTheme,
  });
}

/* ── Tiny event bus (chapter changes etc.) ─────────────── */
const listeners = {};
export const bus = {
  on(e, fn) { (listeners[e] ||= new Set()).add(fn); return () => listeners[e].delete(fn); },
  emit(e, d) { listeners[e]?.forEach((fn) => fn(d)); },
};
