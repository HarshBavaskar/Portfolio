import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, reduced } from '../lib/motion';
import { click } from '../lib/sound';
import { CARD, buildVCard, deliver, download } from '../lib/card';
import { loader } from '../lib/preload';

/*
  The contact card as a real, rendered circuit board. Tap to turn it over,
  drag to spin it; both links hand over files that keep working offline.
*/
export default function IdCard() {
  const root = useRef(null);
  const canvas = useRef(null);
  const api = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let dead = false, st;
    const proxy = { v: reduced ? 1 : 0 };
    // built, compiled and uploaded under the preloader, not when it scrolls into view
    (async () => {
      let card;
      try {
        const { createPcbCard } = await import('../gl/pcbcard');
        if (dead) return;
        card = await createPcbCard(canvas.current, { still: reduced });
      } catch {
        loader.done('card'); // no WebGL: the links still work
        return;
      } finally {
        if (dead) card?.dispose();
      }
      if (dead) return;
      loader.done('card');
      api.current = card;
      card.setEnter(proxy.v);
      root.current.classList.add('is-ready');
      if (!reduced) {
        st = ScrollTrigger.create({
          trigger: root.current, start: 'top 85%', once: true,
          onEnter: () => gsap.to(proxy, { v: 1, duration: 2, ease: 'expo.out', onUpdate: () => card.setEnter(proxy.v) }),
        });
      }
    })();
    return () => {
      dead = true;
      st?.kill();
      gsap.killTweensOf(proxy);
      api.current?.dispose();
      api.current = null;
    };
  }, []);

  const saveContact = (e) => {
    e.preventDefault();
    click(1200);
    // a plain download: phones open .vcf files straight into Contacts
    download(new Blob([buildVCard()], { type: 'text/vcard;charset=utf-8' }), 'Harsh-Bavaskar.vcf');
  };
  const saveCard = async (e) => {
    e.preventDefault();
    if (!api.current || busy) return;
    click(1200);
    setBusy(true);
    try { await deliver(await api.current.snapshot(), 'Harsh-Bavaskar-card.jpg'); } finally { setBusy(false); }
  };

  return (
    <figure className="idc" ref={root}>
      <canvas className="idc__gl" ref={canvas} data-cursor="Flip" role="img" aria-label={`${CARD.name}'s contact card, a circuit board. Tap to turn it over.`} />
      <figcaption className="idc__links mono">
        <a href="#" className="ulink" onClick={saveContact}>Save contact ↓</a>
        <a href="#" className="ulink" onClick={saveCard} aria-busy={busy}>{busy ? 'Rendering…' : 'Download card ↓'}</a>
      </figcaption>
    </figure>
  );
}
