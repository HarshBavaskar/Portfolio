import { useEffect, useRef } from 'react';
import { roverApi } from '../gl/state';
import { loader } from '../lib/preload';

export default function GLStage() {
  const canvas = useRef(null);
  useEffect(() => {
    let api, dead = false;
    // three.js arrives as its own chunk while the preloader runs
    import('../gl/rover')
      .then(({ createRover }) => {
        if (dead) return;
        api = createRover(canvas.current);
        roverApi.current = api;
        // its first frames (shader compile, buffer upload) happen under the preloader
        requestAnimationFrame(() => requestAnimationFrame(() => loader.done('rover')));
      })
      .catch(() => {
        if (canvas.current) canvas.current.style.display = 'none'; // no WebGL — the page still reads fine
        loader.done('rover');
      });
    return () => { dead = true; api?.dispose(); roverApi.current = null; };
  }, []);
  return <canvas className="gl" ref={canvas} aria-hidden="true" />;
}
