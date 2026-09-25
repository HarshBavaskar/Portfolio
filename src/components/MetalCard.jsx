import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, reduced } from '../lib/motion';
import { click } from '../lib/sound';
import { CARD, qrMatrix, buildVCard, renderCardImage, deliver } from '../lib/card';
import Mark from './Mark';
import Magnetic from './Magnetic';

/*
  A brushed-aluminium contact card. It floats, tilts toward the pointer
  with a moving highlight, and flips on tap. Both buttons produce files
  that keep working offline.
*/
export default function MetalCard() {
  const stage = useRef(null);
  const [busy, setBusy] = useState('');
  const qr = useMemo(() => qrMatrix(), []);
  const flipped = useRef(false);

  useEffect(() => {
    const el = stage.current;
    const tilt = el.querySelector('.mc__tilt');
    const flip = el.querySelector('.mc__flip');
    const ctx = gsap.context(() => {
      gsap.from(el.querySelector('.mc__float'), {
        rotationX: 50, rotationY: -35, y: 120, autoAlpha: 0, duration: 1.6, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 80%' },
      });
      if (!reduced) gsap.to(tilt, { y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }, el);

    const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.7, ease: 'power3' });
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.7, ease: 'power3' });
    let downAt = null;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * 28);
      rx(-(y - 0.5) * 22);
      // light sits opposite the tilt, as a real highlight would
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      el.style.setProperty('--band', `${(x * 160 - 30).toFixed(1)}%`);
    };
    const leave = () => { ry(0); rx(0); };
    const down = (e) => { downAt = [e.clientX, e.clientY]; };
    const up = (e) => {
      if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) return;
      downAt = null;
      flipped.current = !flipped.current;
      click(flipped.current ? 700 : 900, 0.04, 0.05);
      gsap.to(flip, { rotationY: flipped.current ? 180 : 0, duration: 1.1, ease: 'expo.inOut' });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    return () => {
      ctx.revert();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
    };
  }, []);

  const saveContact = (e) => {
    e.preventDefault();
    click(1200);
    const blob = new Blob([buildVCard()], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'Harsh-Bavaskar.vcf' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const saveCard = async (e) => {
    e.preventDefault();
    click(1200);
    setBusy('card');
    try { await deliver(await renderCardImage(), 'Harsh-Bavaskar-card.jpg'); } finally { setBusy(''); }
  };

  return (
    <div className="mc">
      <div className="mc__copy">
        <span className="mono dim">Take my card</span>
        <p className="mc__title">Keep it. It works offline.</p>
        <p className="mc__text">Save me straight to your contacts, or keep the card itself — both live on your device, no connection needed.</p>
        <div className="mc__actions">
          <Magnetic href="#" className="btn btn--signal" onClick={saveContact}>Save to contacts <span aria-hidden="true">↓</span></Magnetic>
          <Magnetic href="#" className="btn btn--inv" onClick={saveCard} aria-busy={busy === 'card'}>
            {busy === 'card' ? 'Engraving…' : 'Download card'} <span aria-hidden="true">↓</span>
          </Magnetic>
        </div>
        <p className="mono dim mc__hint">Tap the card to turn it over</p>
      </div>

      <div className="mc__stage" ref={stage} data-cursor="Flip">
        <i className="mc__shadow" aria-hidden="true" />
        <div className="mc__float">
          <div className="mc__tilt">
            <div className="mc__flip">
              <div className="mc__face mc__front" aria-label={`${CARD.name} — ${CARD.role}`}>
                <i className="mc__metal" aria-hidden="true" />
                <Mark className="mc__mark" />
                <div className="mc__name">
                  <b>{CARD.name}</b>
                  <span className="mono">{CARD.role}</span>
                  <i className="mc__inlay" aria-hidden="true" />
                </div>
                <div className="mc__foot mono"><span>{CARD.serial}</span><span>{CARD.place}</span></div>
                <i className="mc__sheen" aria-hidden="true" />
              </div>
              <div className="mc__face mc__back">
                <i className="mc__metal" aria-hidden="true" />
                <span className="mono mc__label">Contact</span>
                <dl className="mc__rows">
                  {CARD.rows.map(([k, v]) => (
                    <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
                <figure className="mc__qr">
                  <svg viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" aria-label="QR code to the portfolio">
                    {Array.from({ length: qr.size }, (_, r) => Array.from({ length: qr.size }, (_, c) => (qr.on(r, c) ? <rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" /> : null)))}
                  </svg>
                  <figcaption className="mono">Scan for the portfolio</figcaption>
                </figure>
                <i className="mc__sheen" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
