import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../lib/motion';

// Odometer digits that roll into place when scrolled into view.
export default function Roll({ value, suffix = '' }) {
  const ref = useRef(null);
  const digits = String(value).split('');
  useEffect(() => {
    const cols = ref.current.querySelectorAll('.roll__col');
    gsap.set(cols, { yPercent: 0 });
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        cols.forEach((c, i) => {
          const d = +digits[i];
          gsap.to(c, { yPercent: -(d + 10) * (100 / 20), duration: 2 + i * 0.25, ease: 'expo.out', delay: i * 0.06 });
        });
      },
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span className="roll" ref={ref} aria-label={`${value}${suffix}`}>
      {digits.map((d, i) => (
        <span className="roll__win" key={i} aria-hidden="true">
          <span className="roll__size">{d}</span>
          <span className="roll__col">
            {Array.from({ length: 20 }, (_, n) => <span key={n}>{n % 10}</span>)}
          </span>
        </span>
      ))}
      {suffix && <span className="roll__suf" aria-hidden="true">{suffix}</span>}
    </span>
  );
}
