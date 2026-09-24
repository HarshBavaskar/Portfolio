import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/motion';
import { projects, alsoBuilt } from '../data';
import Screen from '../components/Screen';
import DeskScreen from '../components/DeskScreen';
import Magnetic from '../components/Magnetic';

function Device({ p, i }) {
  return (
    <div className="device">
      <div className="device__top mono">
        <i className="screw" /><span>{p.name}</span><span className="dim">{String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><i className="led" /><i className="screw" />
      </div>
      <div className={`device__screen${p.id === 'desk' ? ' is-light' : ''}`} data-cursor={p.id === 'desk' ? undefined : 'Play'}>
        {p.id === 'desk' ? <DeskScreen /> : <Screen id={p.id} />}
      </div>
      <div className="device__foot mono">
        <i className="screw" />
        <span className="dim">{p.id === 'desk' ? 'Product screens' : p.hint || 'Live model'}</span>
        <i className="screw" />
      </div>
    </div>
  );
}

export default function Work() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.wk__card');
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', () => {
        // each card settles back and dims as the next one slides over it
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card.querySelector('.wk__inner'), {
            scale: 0.92,
            yPercent: -4,
            ease: 'none',
            scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
          });
          gsap.to(card.querySelector('.wk__shade'), {
            opacity: 0.35,
            ease: 'none',
            scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
          });
        });
      });
      cards.forEach((card) => {
        gsap.from(card.querySelectorAll('.wk__in'), {
          y: 50, autoAlpha: 0, stagger: 0.06, duration: 1.2,
          scrollTrigger: { trigger: card, start: 'top 60%' },
        });
        gsap.from(card.querySelector('.device'), {
          y: 90, rotateX: 12, autoAlpha: 0, duration: 1.6, transformPerspective: 1400,
          scrollTrigger: { trigger: card, start: 'top 65%' },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="work" className="wk" ref={root} data-chapter data-theme="light">
      <div className="wk__head wrap">
        <div className="sec-head mono"><span>04 — Work</span><span className="dim">Selected, 2024 — 2026</span></div>
        <h2 className="wk__title" data-reveal="lines">Things I’ve built that you can actually poke at.</h2>
        <p className="wk__lede dim" data-reveal="fade">Every screen below is a working model of the idea — move, click and hover.</p>
      </div>

      <div className="wk__stack">
        {projects.map((p, i) => (
          <article className="wk__card" key={p.id} id={`work-${p.id}`}>
            <div className="wk__inner">
              <div className="wk__bar wrap mono">
                <span>04.{i + 1}</span>
                <span>{p.kind}</span>
                <span>{p.year}{p.fresh && <b className="tag">New</b>}</span>
                {p.href ? <a href={p.href} target="_blank" rel="noreferrer" className="ulink">Source ↗</a> : <span className="dim">Hardware</span>}
              </div>
              <div className="wk__body wrap grid">
                <div className="wk__info">
                  <h3 className="wk__name wk__in">{p.name}</h3>
                  <p className="wk__line wk__in">{p.line}</p>
                  <p className="wk__text wk__in">{p.text}</p>
                  <div className="wk__metric wk__in">
                    <strong>{p.metric[0]}</strong>
                    <span className="mono">{p.metric[1]}</span>
                  </div>
                  <div className="wk__meta wk__in">
                    <span className="mono dim">Role</span><span>{p.role}</span>
                  </div>
                  <div className="chips wk__in">
                    {p.stack.map((s) => <span className="chip mono" key={s}>{s}</span>)}
                  </div>
                  {p.href && (
                    <Magnetic href={p.href} target="_blank" rel="noreferrer" className="btn wk__in">
                      {p.id === 'desk' ? 'About Desk' : 'View source'} <span aria-hidden="true">↗</span>
                    </Magnetic>
                  )}
                </div>
                <Device p={p} i={i} />
              </div>
            </div>
            <div className="wk__shade" aria-hidden="true" />
          </article>
        ))}
      </div>

      <div className="wk__also wrap">
        {alsoBuilt.map(([n, t]) => (
          <p key={n} data-reveal="fade"><span className="mono dim">Also built</span> <strong>{n}</strong> — {t}</p>
        ))}
      </div>
    </section>
  );
}
