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

/* ── Themes: each chapter has its own colour, and one tweened step
      carries CSS and WebGL from one to the next ── */
// palette: Parchment, Deep Charcoal, Azure Mist, Ash Gray, Powder, Tangelo, and a lime
export const THEMES = {
  parchment: { bg: [235, 235, 223], fg: [34, 34, 32], mute: [124, 122, 110], panel: [224, 224, 208], signal: [235, 70, 0] },
  azure: { bg: [169, 194, 224], fg: [24, 30, 42], mute: [58, 76, 102], panel: [155, 182, 215], signal: [235, 70, 0] },
  tangelo: { bg: [235, 70, 0], fg: [255, 255, 235], mute: [255, 208, 170], panel: [222, 60, 0], signal: [34, 34, 32] },
  powder: { bg: [255, 255, 235], fg: [34, 34, 32], mute: [128, 126, 108], panel: [246, 245, 222], signal: [235, 70, 0] },
  ash: { bg: [162, 194, 190], fg: [22, 34, 32], mute: [56, 84, 80], panel: [150, 183, 179], signal: [235, 70, 0] },
  lime: { bg: [216, 232, 98], fg: [30, 32, 20], mute: [86, 96, 40], panel: [204, 222, 84], signal: [34, 34, 32] },
  charcoal: { bg: [50, 50, 50], fg: [235, 235, 223], mute: [150, 150, 140], panel: [62, 62, 61], signal: [233, 99, 26] },
};
const KEYS = Object.keys(THEMES.parchment);
let from = THEMES.parchment, to = THEMES.parchment, current = 'parchment', serial = 0;
const tween = { p: 1 };
// theme.t changes on every step, so the rover knows to redraw
export const theme = { t: 0, name: current, bg: from.bg.slice(), fg: from.fg.slice() };

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function applyTheme() {
  const s = document.documentElement.style;
  theme.t = serial + tween.p;
  for (const key of KEYS) {
    const c = mix(from[key], to[key], tween.p);
    s.setProperty(`--${key}`, `rgb(${c})`);
    if (key === 'bg') theme.bg = c;
    if (key === 'fg') {
      theme.fg = c;
      s.setProperty('--line', `rgba(${c},0.16)`);
      s.setProperty('--line-strong', `rgba(${c},0.36)`);
    }
  }
}
// Every step restyles the whole page, so phones take a few quick steps
// instead of a long per-frame fade.
export function setTheme(name) {
  if (!THEMES[name] || name === current) return;
  // start from wherever the last change had got to
  from = Object.fromEntries(KEYS.map((key) => [key, mix(from[key], to[key], tween.p)]));
  to = THEMES[name];
  current = theme.name = name;
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
