import { useEffect, useRef } from 'react';
import { createRover, roverApi } from '../gl/rover';

export default function GLStage() {
  const canvas = useRef(null);
  useEffect(() => {
    let api;
    try {
      api = createRover(canvas.current);
      roverApi.current = api;
    } catch {
      canvas.current.style.display = 'none'; // no WebGL — the page still reads fine
    }
    return () => { api?.dispose(); roverApi.current = null; };
  }, []);
  return <canvas className="gl" ref={canvas} aria-hidden="true" />;
}
