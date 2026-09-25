import { useEffect, useLayoutEffect, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, initScroll, setTheme, bus, lockScroll, scrollTo } from './lib/motion';
import Preloader from './components/Preloader';
import { wipeArrive } from './early/wipe';
import { preloadImages } from './lib/preload';
import { projects } from './data';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import GLStage from './components/GLStage';
import Hero from './sections/Hero';
import Rover from './sections/Rover';
import About from './sections/About';
import Path from './sections/Path';
import Work from './sections/Work';
import Toolkit from './sections/Toolkit';
import Record from './sections/Record';
import Contact from './sections/Contact';

// start fetching and decoding every still while the preloader draws
preloadImages(projects);

export default function App() {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    wipeArrive(); // coming back from an early-access page
    const stop = initScroll();
    lockScroll(true);
    return stop;
  }, []);

  // After the preloader: chapter tracking, theme switching and text reveals.
  useEffect(() => {
    if (!ready) return;
    lockScroll(false);
    bus.emit('ready');
    const ctx = gsap.context(() => {
      document.querySelectorAll('[data-chapter]').forEach((el, i) => {
        // pinned chapters are measured by their spacer, which spans the whole pin
        const spacer = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
        ScrollTrigger.create({
          trigger: spacer,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (!self.isActive) return;
            setTheme(el.dataset.theme);
            bus.emit('chapter', i);
          },
        });
      });

      document.querySelectorAll('[data-reveal="lines"]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.3,
              stagger: 0.08,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
        });
      });

      gsap.utils.toArray('[data-reveal="fade"]').forEach((el) => {
        gsap.from(el, { y: 28, autoAlpha: 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });

      gsap.utils.toArray('[data-reveal="rule"]').forEach((el) => {
        gsap.from(el, { scaleX: 0, transformOrigin: '0 50%', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      });
    });
    ScrollTrigger.refresh();
    // links like ../#work-tux land on their section once everything is measured
    const hash = location.hash;
    if (hash && document.querySelector(hash)) requestAnimationFrame(() => scrollTo(hash, { instant: true })); // under the wipe, no fly-through
    return () => ctx.revert();
  }, [ready]);

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <Cursor />
      <Nav />
      <GLStage />
      <main>
        <Hero ready={ready} />
        <Rover />
        <About />
        <Path />
        <Work />
        <Toolkit />
        <Record />
        <Contact />
      </main>
    </>
  );
}
