import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, finePointer, isDesktop } from '../lib/motion';
import { click } from '../lib/sound';
import { toolkit } from '../data';

const flat = toolkit.flatMap((row, c) => row.keys.map((k, i) => ({ c, i, name: k[0], note: k[1] })));

export default function Toolkit() {
  const root = useRef(null);
  const name = useRef(null);
  const [sel, setSel] = useState({ c: 0, i: 0 });
  const cycle = useRef({});

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const board = root.current.querySelector('.tk__board');
      const desk = isDesktop();
      const rest = desk ? 20 : 3; // a tall phone board keystones badly, so it lies nearly flat
      // it rises off the desk and settles tilted back, like hardware on a table
      gsap.fromTo('.tk__rig', { rotationX: desk ? 52 : 22, y: desk ? 140 : 60 }, {
        rotationX: rest,
        y: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.tk__stage', start: 'top bottom', end: 'center 62%', scrub: true },
      });
      gsap.from('.tk__key, .tk__cat', {
        y: -16,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'back.out(2)',
        stagger: { each: 0.01, from: 'start' },
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: '.tk__stage', start: 'top 70%' },
      });

      if (!finePointer) return;
      // the board follows the pointer a few degrees; a highlight slides over it
      const ry = gsap.quickTo(board, 'rotationY', { duration: 0.8, ease: 'power3' });
      const rx = gsap.quickTo(board, 'rotationX', { duration: 0.8, ease: 'power3' });
      const move = (e) => {
        const r = board.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        ry((x - 0.5) * 9);
        rx(-(y - 0.5) * 6);
        board.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        board.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      };
      const leave = () => { ry(0); rx(0); };
      board.addEventListener('pointermove', move);
      board.addEventListener('pointerleave', leave);
      return () => {
        board.removeEventListener('pointermove', move);
        board.removeEventListener('pointerleave', leave);
      };
    }, root);
    return () => ctx.revert();
  }, []);

  const pick = (c, i, sound = true) => {
    setSel({ c, i });
    if (sound) click(900 + c * 180 + i * 18, 0.025, 0.05);
  };

  useEffect(() => {
    const k = toolkit[sel.c].keys[sel.i];
    gsap.to(name.current, { duration: 0.6, scrambleText: { text: k[0], chars: 'upperAndLowerCase', speed: 0.8 } });
  }, [sel]);

  // type on your own keyboard to press keys here
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || e.key.toLowerCase() === 'g') return;
      const r = root.current.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const ch = e.key.toLowerCase();
      const hits = flat.filter((f) => f.name.toLowerCase().startsWith(ch));
      if (!hits.length) return;
      const n = ((cycle.current[ch] ?? -1) + 1) % hits.length;
      cycle.current[ch] = n;
      const h = hits[n];
      pick(h.c, h.i);
      const el = root.current.querySelector(`[data-k="${h.c}-${h.i}"]`);
      el.classList.add('is-down');
      setTimeout(() => el.classList.remove('is-down'), 140);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const cur = toolkit[sel.c];
  return (
    <section id="toolkit" className="tk" ref={root} data-chapter data-theme="light">
      <div className="wrap">
        <div className="sec-head mono"><span>05 — Toolkit</span><span className="dim">Hover, click, or type on your keyboard</span></div>
        <h2 className="tk__title" data-reveal="lines">Every layer of the stack, from torque to TypeScript.</h2>

        <div className="tk__stage">
        <div className="tk__rig">
        <div className="tk__shadow" aria-hidden="true" />
        <div className="tk__board">
          <i className="tk__sheen" aria-hidden="true" />
          <i className="tk__screw tl" aria-hidden="true" /><i className="tk__screw tr" aria-hidden="true" />
          <i className="tk__screw bl" aria-hidden="true" /><i className="tk__screw br" aria-hidden="true" />
          <div className="tk__lcd">
            <div className="tk__lcd-row mono">
              <span>{String(sel.c + 1).padStart(2, '0')}.{String(sel.i + 1).padStart(2, '0')} — {cur.cat}</span>
              <span className="tk__meter" aria-hidden="true">
                {toolkit.map((row, c) => (
                  <i key={row.cat} className={c === sel.c ? 'is-on' : ''} style={{ height: `${6 + row.keys.length * 1.6}px` }} />
                ))}
              </span>
            </div>
            <p className="tk__name" ref={name} aria-live="polite">{toolkit[0].keys[0][0]}</p>
            <p className="tk__note mono">{cur.keys[sel.i][1]}</p>
            <i className="tk__glare" aria-hidden="true" />
          </div>

          <div className="tk__keys">
            {toolkit.map((row, c) => (
              <div className="tk__row" key={row.cat}>
                <span className={`tk__cat mono${c === sel.c ? ' is-on' : ''}`}>{row.cat}</span>
                <div className="tk__row-keys">
                {row.keys.map(([k], i) => (
                  <button
                    type="button"
                    key={k}
                    data-k={`${c}-${i}`}
                    className={`tk__key${c === sel.c && i === sel.i ? ' is-sel' : ''}`}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && pick(c, i, false)}
                    onClick={() => pick(c, i)}
                  >
                    <span>{k}</span>
                  </button>
                ))}
                </div>
              </div>
            ))}
          </div>
          <div className="tk__foot mono dim">
            <span>{flat.length} keys · {toolkit.length} banks</span>
            <span><i className="tk__led" aria-hidden="true" />HB-05 Toolkit</span>
          </div>
        </div>
        </div>
        </div>
      </div>
    </section>
  );
}
