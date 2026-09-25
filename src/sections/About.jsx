import { useLayoutEffect, useRef } from 'react';
import { gsap, SplitText } from '../lib/motion';
import { stats } from '../data';
import Roll from '../components/Roll';

export default function About() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // statement fills in word by word as you read it
      SplitText.create('.ab__statement', {
        type: 'words',
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(self.words, { opacity: 0.14 }, {
            opacity: 1,
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: { trigger: '.ab__statement', start: 'top 80%', end: 'bottom 45%', scrub: true },
          }),
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" className="ab" ref={root} data-chapter data-theme="tangelo">
      <div className="wrap">
        <div className="sec-head mono">
          <span>02 / About</span>
          <span className="dim">Mechanical · Electrical · Software</span>
        </div>
        <p className="ab__statement">
          I lead robotics builds and carry machines from CAD to competition. I’m strongest where the mechanical meets
          the electrical (embedded control and real-time computer vision), and I write the software that ties them
          together, from firmware to the systems a whole school runs on.
        </p>

        <div className="ab__stats">
          {stats.map((s) => (
            <div className="ab__stat" key={s.label}>
              <i className="rule" data-reveal="rule" />
              <div className="ab__num"><Roll value={s.value} suffix={s.suffix} /></div>
              <p className="mono">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
