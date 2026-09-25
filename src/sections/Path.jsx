import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/motion';
import { path } from '../data';

export default function Path() {
  const root = useRef(null);
  const readout = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', () => {
        const track = root.current.querySelector('.pa__track');
        const panels = gsap.utils.toArray('.pa__panel');
        const dist = () => track.scrollWidth - innerWidth;
        let current = -1;

        const move = gsap.to(track, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: () => {
              // playhead readout: whichever entry sits under the centre line
              const mid = innerWidth / 2;
              let idx = 0;
              panels.forEach((p, i) => { if (p.getBoundingClientRect().left < mid) idx = i; });
              if (idx !== current) {
                current = idx;
                gsap.to(readout.current, { duration: 0.6, scrambleText: { text: path[idx].period, chars: '0123456789', speed: 0.6 } });
              }
            },
          },
        });

        panels.forEach((p) => {
          gsap.from(p.querySelectorAll('.pa__reveal'), {
            y: 40,
            autoAlpha: 0,
            stagger: 0.07,
            duration: 1,
            scrollTrigger: { trigger: p, containerAnimation: move, start: 'left 78%' },
          });
        });
      });
      mm.add('(max-width: 899px)', () => {
        gsap.utils.toArray('.pa__panel').forEach((p) => {
          gsap.from(p.querySelectorAll('.pa__reveal'), { y: 30, autoAlpha: 0, stagger: 0.06, scrollTrigger: { trigger: p, start: 'top 80%' } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="path" className="pa" ref={root} data-chapter data-theme="light">
      <div className="pa__track">
        <div className="pa__intro">
          <div className="sec-head mono"><span>03 / Path</span></div>
          <h2 className="pa__title" data-reveal="lines">From first semester to the C-suite.</h2>
          <p className="pa__lede dim">Four rooms, two years. Each one handed me something bigger to carry.</p>
        </div>
        {path.map((p, i) => (
          <article className="pa__panel" key={p.org}>
            <div className="pa__top mono pa__reveal">
              <span>03.{i + 1}</span>
              <span>{p.period}</span>
            </div>
            <p className="pa__year pa__reveal" aria-hidden="true"><span>’</span>{p.period.match(/\d{4}/)[0].slice(2)}</p>
            <h3 className="pa__org pa__reveal">{p.org}</h3>
            <p className="pa__role pa__reveal">{p.role} <span className="dim">· {p.place}</span></p>
            <ul className="pa__points">
              {p.points.map((t) => <li className="pa__reveal" key={t}>{t}</li>)}
            </ul>
            <div className="chips pa__reveal">
              {p.tags.map((t) => <span className="chip mono" key={t}>{t}</span>)}
            </div>
          </article>
        ))}
        <div className="pa__ticks" aria-hidden="true" />
        <div className="pa__next">
          <span className="mono dim">Next</span>
          <p>Whatever needs to move.</p>
        </div>
      </div>
      <div className="pa__tape" aria-hidden="true">
        <div className="pa__playhead"><span className="mono" ref={readout}>{path[0].period}</span></div>
      </div>
    </section>
  );
}
