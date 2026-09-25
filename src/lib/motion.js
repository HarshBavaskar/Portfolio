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

export function scrollTo(target, { instant = false } = {}) {
  const el = document.querySelector(target);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY;
  bus.emit('navigate', y);
  if (lenis) lenis.scrollTo(y, instant ? { immediate: true } : { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: instant || reduced ? 'auto' : 'smooth' });
}

export const lockScroll = (on) => {
  document.documentElement.classList.toggle('is-locked', on);
  if (lenis) (on ? lenis.stop() : lenis.start());
};

/* ── Themes: paper, ink and charcoal; one tweened step carries CSS and
      WebGL from the current colours to the next chapter's ── */
const THEMES = {
  light: { bg: [238, 236, 231], fg: [18, 18, 18], mute: [128, 125, 118], panel: [228, 225, 218] },
  dark: { bg: [16, 16, 15], fg: [236, 234, 228], mute: [122, 120, 114], panel: [30, 30, 28] },
  // a softer dark, between the two
  charcoal: { bg: [46, 46, 45], fg: [236, 234, 228], mute: [150, 148, 140], panel: [58, 58, 56] },
};
const KEYS = Object.keys(THEMES.light);
let from = THEMES.light, to = from, current = 'light', serial = 0;
const tween = { p: 1 };
// theme.t changes on every step, so the rover knows to redraw
export const theme = { t: 0, bg: from.bg.slice(), fg: from.fg.slice() };

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function applyTheme() {
  const s = document.documentElement.style;
  theme.t = serial + tween.p;
  for (const k of KEYS) {
    const c = mix(from[k], to[k], tween.p);
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
export function setTheme(name) {
  if (!THEMES[name] || name === current) return;
  // start from wherever the last change had got to
  from = Object.fromEntries(KEYS.map((k) => [k, mix(from[k], to[k], tween.p)]));
  to = THEMES[name];
  current = name;
  serial += 1;
  tween.p = 0;
  gsap.to(tween, {
    p: 1,
    duration: touch ? 0.24 : 0.9,
    ease: touch ? 'steps(2)' : 'power2.inOut',
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
