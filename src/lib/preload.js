/*
  Everything the page needs before the curtain lifts: type, every image,
  and both WebGL scenes built, compiled and uploaded. The preloader's
  counter shows this real progress and only exits once it is complete,
  so nothing is fetched, decoded or compiled mid-scroll.
*/
const jobs = new Map(); // name → { weight, done }
const listeners = new Set();
let resolveAll;
const all = new Promise((r) => { resolveAll = r; });

function settle() {
  listeners.forEach((fn) => fn());
  if ([...jobs.values()].every((j) => j.done)) resolveAll();
}

export const loader = {
  // declare work up front, so progress can't reach 100% before it registers
  expect(name, weight = 1) {
    if (!jobs.has(name)) jobs.set(name, { weight, done: false });
  },
  done(name) {
    const j = jobs.get(name);
    if (!j || j.done) return;
    j.done = true;
    settle();
  },
  track(name, promise, weight = 1) {
    loader.expect(name, weight);
    Promise.resolve(promise).catch(() => {}).then(() => loader.done(name));
  },
  get progress() {
    let total = 0, got = 0;
    jobs.forEach((j) => { total += j.weight; if (j.done) got += j.weight; });
    return total ? got / total : 1;
  },
  // resolves when every job is in, or after `cap` ms on a slow connection
  ready(cap = 12000) {
    return Promise.race([all, new Promise((r) => setTimeout(r, cap))]);
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

const base = import.meta.env.BASE_URL;
function image(src) {
  const img = new Image();
  img.decoding = 'async';
  img.src = `${base}${src}`;
  // decode now, so the first paint of each image is free
  return img.decode ? img.decode() : new Promise((r) => { img.onload = img.onerror = r; });
}

// every still on the page, collected from the project data
export function preloadImages(projects) {
  const srcs = new Set();
  projects.forEach((p) => (p.screens || []).forEach((s) => {
    if (s.type === 'img') srcs.add(s.src);
    if (s.poster) srcs.add(s.poster);
  }));
  srcs.forEach((src) => loader.track(`img:${src}`, image(src), 0.5));
}

// fixed jobs, declared before anything mounts
loader.expect('rover', 3);
loader.expect('card', 4);
loader.track('fonts', document.fonts?.ready, 1);
