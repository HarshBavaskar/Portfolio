import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, finePointer, isDesktop, reduced } from '../lib/motion';
import { click } from '../lib/sound';
import { loader } from '../lib/preload';
import { toolkit } from '../data';

const flat = toolkit.flatMap((row, c) => row.keys.map((k, i) => ({ c, i, name: k[0], note: k[1] })));
const phone = () => matchMedia('(max-width: 899px)').matches;

/*
  The toolkit is a rendered piece of hardware (gl/console.js): wide on
  desktop, a compact unit on phones. If WebGL is unavailable, the CSS
  board below stands in.
*/
export default function Toolkit() {
  const root = useRef(null);
  const canvas = useRef(null);
  const api = useRef(null);
  const [sel, setSel] = useState({ c: 0, i: 0 });
  const [compact, setCompact] = useState(phone);
  const [fallback, setFallback] = useState(false);
  const cycle = useRef({});

  const pick = (c, i, sound = true) => {
    setSel({ c, i });
    if (sound) click(900 + c * 180 + i * 18, 0.025, 0.05);
  };

  // phones and desktops get different builds; rebuild if the width crosses over
  useEffect(() => {
    const mq = matchMedia('(max-width: 899px)');
    const on = () => setCompact(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    let dead = false, st, proxy = { v: reduced ? 1 : 0 };
    (async () => {
      let unit;
      try {
        const { createConsole } = await import('../gl/console');
        if (dead) return;
        unit = await createConsole(canvas.current, { banks: toolkit, compact, onPick: (c, i, how) => pick(c, i, how === 'tap') });
      } catch {
        if (!dead) setFallback(true);
        loader.done('toolkit');
        return;
      }
      if (dead) { unit.dispose(); return; }
      api.current = unit;
      loader.done('toolkit');
      unit.setRise(proxy.v);
      if (!reduced) {
        // it rises off the desk and settles tilted back as the section scrolls in
        st = gsap.to(proxy, {
          v: 1,
          ease: 'none',
          onUpdate: () => unit.setRise(proxy.v),
          scrollTrigger: { trigger: canvas.current, start: 'top bottom', end: 'center 62%', scrub: true },
        });
        ScrollTrigger.refresh();
      }
    })();
    return () => {
      dead = true;
      st?.scrollTrigger?.kill();
      st?.kill();
      api.current?.dispose();
      api.current = null;
    };
  }, [compact]);

  useEffect(() => { api.current?.select(sel.c, sel.i); }, [sel]);

  // type on your own keyboard to press keys here
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const r = root.current.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const ch = e.key.toLowerCase();
      const hits = flat.filter((f) => f.name.toLowerCase().startsWith(ch));
      if (!hits.length) return;
      const n = ((cycle.current[ch] ?? -1) + 1) % hits.length;
      cycle.current[ch] = n;
      const h = hits[n];
      pick(h.c, h.i);
      if (api.current) {
        // the key press lands after the bank has switched on the compact unit
        setTimeout(() => api.current?.press(h.c, h.i), 30);
        return;
      }
      const el = root.current.querySelector(`[data-k="${h.c}-${h.i}"]`);
      el?.classList.add('is-down');
      setTimeout(() => el?.classList.remove('is-down'), 140);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <section id="toolkit" className="tk" ref={root} data-chapter data-theme="charcoal">
      <div className="wrap">
        <div className="sec-head mono"><span>05 / Toolkit</span><span className="dim">{compact ? 'Tap a bank, tap again or touch the list' : 'Hover, click, or type on your keyboard'}</span></div>
        <h2 className="tk__title" data-reveal="lines">Every layer of the stack, from torque to TypeScript.</h2>
        {fallback ? (
          <Board sel={sel} pick={pick} />
        ) : (
          <>
            <canvas key={compact ? 'c' : 'w'} className={`tk__gl${compact ? ' is-compact' : ''}`} ref={canvas} role="img" aria-label="The toolkit console: a keyboard of skills with a screen that names the selected key." />
            <ul className="sr-only">
              {flat.map((f) => (
                <li key={`${f.c}-${f.i}`}><button type="button" onClick={() => pick(f.c, f.i)}>{toolkit[f.c].cat}: {f.name}. {f.note}</button></li>
              ))}
            </ul>
            <p className="sr-only" aria-live="polite">{toolkit[sel.c].keys[sel.i][0]}: {toolkit[sel.c].keys[sel.i][1]}</p>
          </>
        )}
      </div>
    </section>
  );
}

// The CSS board: shown only where WebGL is unavailable.
function Board({ sel, pick }) {
  const root = useRef(null);
  const name = useRef(null);

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

  useEffect(() => {
    const k = toolkit[sel.c].keys[sel.i];
    gsap.to(name.current, { duration: 0.6, scrambleText: { text: k[0], chars: 'upperAndLowerCase', speed: 0.8 } });
  }, [sel]);

  const cur = toolkit[sel.c];
  return (
    <div ref={root}>
        <div className="tk__stage">
        <div className="tk__rig">
        <div className="tk__shadow" aria-hidden="true" />
        <div className="tk__board">
          <i className="tk__sheen" aria-hidden="true" />
          <i className="tk__screw tl" aria-hidden="true" /><i className="tk__screw tr" aria-hidden="true" />
          <i className="tk__screw bl" aria-hidden="true" /><i className="tk__screw br" aria-hidden="true" />
          <div className="tk__lcd">
            <div className="tk__lcd-row mono">
              <span>{String(sel.c + 1).padStart(2, '0')}.{String(sel.i + 1).padStart(2, '0')} / {cur.cat}</span>
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
  );
}
