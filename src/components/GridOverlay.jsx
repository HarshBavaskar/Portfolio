import { useEffect, useState } from 'react';

// Press G: show the 12-column grid the page is built on.
export default function GridOverlay() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const key = (e) => {
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.target.closest('input, textarea')) setOn((v) => !v);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);
  return (
    <div className={`gridlay${on ? ' is-on' : ''}`} aria-hidden="true">
      <div className="wrap grid">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
    </div>
  );
}
