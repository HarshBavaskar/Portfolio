import { useEffect, useState } from 'react';

const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });

export default function Clock({ suffix = ' IST' }) {
  const [now, setNow] = useState(() => fmt.format(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(fmt.format(new Date())), 10000);
    return () => clearInterval(id);
  }, []);
  const [h, m] = now.split(':');
  return <>{h}<span className="blink">:</span>{m}{suffix}</>;
}
