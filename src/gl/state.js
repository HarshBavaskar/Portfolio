// Scroll-driven rover state: kept free of three.js so sections can import it
// without pulling the renderer into the main bundle.
export const roverState = {
  cx: 0.7, cy: 0.42, // screen-space centre (0..1)
  dist: 1, // camera distance multiplier
  explode: 0, // 0 assembled → 1 fully exploded
  focus: -1, // highlighted subsystem, -1 none
  turn: 0, // scroll-driven yaw
  auto: 1, // idle rotation weight
  drive: 0, // 0..1 drive-off distance
  lock: 0, // 0 free yaw → 1 yaw follows lockYaw
  lockYaw: -0.62,
  opacity: 1, // scroll-driven
  intro: 0, // preloader reveal
  anchors: Array.from({ length: 6 }, () => ({ x: 0, y: 0 })),
};

// Imperative handle (drag) for the live renderer, filled once it loads.
export const roverApi = { current: null };
