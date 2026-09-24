import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, isDesktop, touch, bus } from '../lib/motion';
import { roverState } from '../gl/state';
import { subsystems } from '../data';

export default function Rover() {
  const root = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const labels = gsap.utils.toArray('.callout');
      const paths = gsap.utils.toArray('.leaders path');
      const dots = gsap.utils.toArray('.leaders circle');
      gsap.set([...labels, ...paths, ...dots], { autoAlpha: 0 });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'none' },
        // which subsystem is being described
        onUpdate: () => {
          const t = tl.time();
          roverState.focus = t > 3.4 && t < 7 ? Math.min(5, Math.floor((t - 3.4) / 0.55)) : -1;
        },
      });

      // 0 — the claim
      tl.from('.rv__claim .ln > span', { yPercent: 110, stagger: 0.12, duration: 0.9, ease: 'power3.out' }, 0)
        .from('.rv__facts > div', { y: 40, autoAlpha: 0, stagger: 0.15, duration: 0.7, ease: 'power3.out' }, 0.9)
        .to(roverState, { lockYaw: -0.3, duration: 2.6 }, 0)
        .to('.rv__claim, .rv__facts', { autoAlpha: 0, y: -60, duration: 0.6, ease: 'power2.in' }, 2.4)

      // 1 — exploded view, one subsystem at a time
        .to(roverState, { explode: 1, duration: 1.3, ease: 'power2.inOut' }, 2.7)
        .to(roverState, { cx: 0.5, cy: 0.5, dist: 1, duration: 1.3, ease: 'power2.inOut' }, 2.5)
        .to(roverState, { lockYaw: -1.22, duration: 1.6, ease: 'power2.inOut' }, 2.5)
        .to(roverState, { lockYaw: -1.02, duration: 2.8 }, 4.1)
        .from('.rv__legend', { autoAlpha: 0, y: 20, duration: 0.4 }, 3.1);
      labels.forEach((l, i) => {
        const at = 3.4 + i * 0.55;
        tl.to([l, paths[i], dots[i]], { autoAlpha: 1, duration: 0.25 }, at)
          .fromTo(paths[i], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35 }, at);
      });
      tl.to([...labels, ...paths, ...dots, '.rv__legend'], { autoAlpha: 0, duration: 0.4 }, 6.9)

      // 2 — reassemble, turn side-on, drive out of frame
        .to(roverState, { explode: 0, duration: 1, ease: 'power2.inOut' }, 7)
        .to(roverState, { lockYaw: 0, duration: 1, ease: 'power2.inOut' }, 7.3)
        .to(roverState, { drive: 1, duration: 1.4, ease: 'power2.in' }, 8.4)
        .fromTo(roverState, { opacity: 1 }, { opacity: 0, duration: 0.5, immediateRender: false }, 9.2)
        .from('.rv__rank-num > span', { yPercent: 105, duration: 1, ease: 'power3.out' }, 9.1)
        .from('.rv__rank-copy > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out' }, 9.4)
        .to({}, { duration: 0.6 });

      // labelled stops: the claim, each subsystem, the result
      const STEPS = ['claim', ...subsystems.map((_, i) => `sub${i}`), 'end'];
      tl.addLabel('claim', 2.2);
      subsystems.forEach((_, i) => tl.addLabel(`sub${i}`, 3.8 + i * 0.55));
      tl.addLabel('end', tl.duration());

      let stopSteps = () => {};
      if (!touch) {
        // mouse and trackpad: the whole sequence is scrubbed by scroll
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top top',
          end: () => `+=${innerHeight * 5.5}`,
          pin: true,
          scrub: 0.6,
          animation: tl,
          invalidateOnRefresh: true,
        });
      } else {
        // phones: the chapter holds still and each swipe moves exactly one step,
        // so a fast flick can't skip past the parts
        root.current.classList.add('is-steps');
        const counter = root.current.querySelector('.rv__step');
        let index = -1, animating = false, skipUntil = 0, st;
        const show = (i) => {
          counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}${i === 0 ? ' · Swipe' : ''}`;
        };

        // one gesture moves one step: a touch counts once until the finger lifts,
        // a wheel burst once per pause
        let used = false, lastStep = 0;
        const step = (self, dir) => {
          const now = performance.now();
          if (animating || now - lastStep < 300) return;
          if (self.event?.type === 'wheel' ? now - lastStep < 900 : used) return;
          used = true;
          lastStep = now;
          go(index + dir, dir > 0);
        };
        const intent = ScrollTrigger.observe({
          type: 'touch,wheel',
          wheelSpeed: -1,
          tolerance: 12,
          preventDefault: true,
          onPress: () => { used = false; },
          onUp: (self) => step(self, 1),
          onDown: (self) => step(self, -1),
        });
        const hold = ScrollTrigger.observe({
          type: 'wheel,scroll',
          preventDefault: true,
          allowClicks: true,
          onEnable: (self) => { self.savedScroll = self.scrollY(); },
          onChangeY: (self) => self.scrollY(self.savedScroll),
        });
        intent.disable();
        hold.disable();

        const release = (down) => {
          intent.disable();
          hold.disable();
          animating = false;
          hold.scrollY(down ? st.end + 1 : st.start - 1);
        };
        function go(i, down) {
          if (i >= STEPS.length || i < 0) return release(down);
          animating = true;
          index = i;
          show(i);
          const d = gsap.utils.clamp(0.7, 2.2, Math.abs(tl.labels[STEPS[i]] - tl.time()) * 0.5);
          tl.tweenTo(STEPS[i], { duration: d, ease: 'power2.inOut', onComplete: () => { animating = false; } });
        }
        const engage = (self, i, down) => {
          if (hold.isEnabled || performance.now() < skipUntil) return;
          self.scroll(self.start);
          hold.enable();
          intent.enable();
          go(i, down);
        };
        st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top top',
          end: '+=240',
          pin: true,
          anticipatePin: 1,
          onEnter: (self) => engage(self, index + 1, true),
          onEnterBack: (self) => engage(self, index - 1, false),
        });

        // menu jumps pass straight through, leaving the sequence where it belongs
        const off = bus.on('navigate', (y) => {
          skipUntil = performance.now() + 2000;
          intent.disable();
          hold.disable();
          animating = false;
          tl.pause();
          if (y > st.start) { tl.progress(1); index = STEPS.length - 1; } else { tl.progress(0); index = -1; }
        });
        show(0);
        stopSteps = () => { off(); intent.kill(); hold.kill(); };
      }

      // callout geometry follows the projected anchors — only when they move
      const svg = root.current.querySelector('.leaders');
      const last = new Float32Array(15);
      const place = () => {
        if (roverState.opacity < 0.01 || (roverState.focus === -1 && roverState.explode < 0.05)) return;
        const desk = isDesktop();
        const W = innerWidth, H = innerHeight;
        const A = roverState.anchors;
        let moved = false;
        const sig = [W, H, roverState.focus];
        A.forEach((a) => sig.push(a.x, a.y));
        sig.forEach((v, k) => { if (Math.abs(v - last[k]) > 0.25) { moved = true; last[k] = v; } });
        if (!moved) return;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const m = Math.min(36, Math.max(16, W * 0.024)); // mirrors --m
        // three slots per side; anchors sorted left→right, then top→bottom within a side
        const order = [0, 1, 2, 3, 4, 5].sort((a, b) => A[a].x - A[b].x);
        const sides = [order.slice(0, 3), order.slice(3)].map((g) => g.sort((a, b) => A[a].y - A[b].y));
        sides.forEach((group, side) => {
          const mean = group.reduce((acc, i) => acc + A[i].y, 0) / 3;
          group.forEach((i, k) => {
            const a = A[i], l = labels[i];
            let d;
            if (desk) {
              const gap = H * 0.21, first = Math.min(H * 0.8 - gap * 2, Math.max(H * 0.24, mean - gap));
              const sy = first + k * gap;
              const edge = side ? W - m - 210 : m + 210;
              const elbow = side ? edge - 40 : edge + 40;
              d = `M${a.x},${a.y} L${elbow},${sy} L${edge},${sy}`;
              l.style.transform = `translate(${side ? edge : m}px, ${sy}px)`;
            } else {
              const ly = H - 190;
              d = `M${a.x},${a.y} L${a.x},${ly - 6}`;
              l.style.transform = `translate(16px, ${ly}px)`;
            }
            paths[i].setAttribute('d', d);
            dots[i].setAttribute('cx', a.x);
            dots[i].setAttribute('cy', a.y);
            const f = roverState.focus === i;
            l.classList.toggle('is-focus', f);
            paths[i].parentNode.classList.toggle('is-focus', f);
          });
        });
      };
      gsap.ticker.add(place);
      return () => { gsap.ticker.remove(place); stopSteps(); };
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="rover" className="rv" ref={root} data-chapter data-theme="dark">
      <div className="rv__head wrap mono">
        <span>01 — The Rover</span>
        <span className="dim">NASA Human Exploration Rover Challenge · RC Division · 2025</span>
        <span className="rv__step" aria-hidden="true" />
      </div>

      <div className="rv__claim wrap">
        <p className="ln"><span>India’s first and only entry</span></p>
        <p className="ln"><span>in NASA’s HERC RC division.</span></p>
        <p className="ln"><span className="dim">I led the build.</span></p>
      </div>

      <div className="rv__facts wrap">
        <div><strong>18</strong><span className="mono">People on the build team</span></div>
        <div><strong>12</strong><span className="mono">Months, CAD to competition</span></div>
        <div><strong>6</strong><span className="mono">Subsystems, one machine</span></div>
      </div>

      <svg className="leaders" aria-hidden="true">
        {subsystems.map((s) => (
          <g key={s.n}>
            <path pathLength="1" strokeDasharray="1" />
            <circle r="4" />
          </g>
        ))}
      </svg>
      {subsystems.map((s) => (
        <div className="callout" key={s.n}>
          <span className="mono callout__n">{s.n}</span>
          <strong>{s.name}</strong>
          <p>{s.text}</p>
        </div>
      ))}
      <p className="rv__legend wrap mono">
        <span>Exploded view</span>
        <span className="dim">Illustrative figure — not to scale</span>
      </p>

      <div className="rv__rank wrap">
        <div className="rv__rank-num" aria-label="5th"><span>5<sup>th</sup></span></div>
        <div className="rv__rank-copy">
          <p className="mono">Final standing</p>
          <p>In the world, against 100+ international teams. The rover cleared every mission task — the mobility course, sample collection and LiDAR navigation.</p>
        </div>
      </div>
    </section>
  );
}
