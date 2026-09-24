import gsap from 'gsap';
import './wipe.css';

/*
  A full-screen panel that carries you between the portfolio and the
  early-access pages: it rises over the page you leave and lifts off the
  page you land on, so the jump reads as one motion.
*/
const KEY = 'hb-wipe';

function panel({ color, ink, label }) {
  const el = document.createElement('div');
  el.className = 'wipe';
  el.style.setProperty('--wipe-bg', color);
  el.style.setProperty('--wipe-ink', ink);
  el.innerHTML = `<span class="wipe__label"></span>`;
  el.firstChild.textContent = label;
  document.body.appendChild(el);
  return el;
}

export function wipeTo(url, opts) {
  try { sessionStorage.setItem(KEY, JSON.stringify(opts)); } catch { /* storage blocked */ }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { location.href = url; return; }
  const el = panel(opts);
  gsap.timeline({ onComplete: () => { location.href = url; } })
    .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut' })
    .fromTo(el.firstChild, { yPercent: 120 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0.35);
}

// Returns true when this page was reached through a wipe (and plays it out).
export function wipeArrive() {
  let opts = null;
  try { opts = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); } catch { /* none */ }
  if (!opts) return false;
  const el = panel(opts);
  gsap.timeline({ delay: 0.15, onComplete: () => el.remove() })
    .to(el.firstChild, { yPercent: -120, duration: 0.6, ease: 'expo.in' })
    .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0.3);
  return true;
}

// Back/forward cache can restore a page mid-wipe; clear it.
if (typeof window !== 'undefined') {
  addEventListener('pageshow', (e) => { if (e.persisted) document.querySelectorAll('.wipe').forEach((w) => w.remove()); });
}
