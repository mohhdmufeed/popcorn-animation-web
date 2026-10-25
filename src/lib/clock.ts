/** Seconds-based timeline for the intro. GSAP drives `introClock.t`. */
export const introClock = { t: 0 }

export const INTRO = {
  reveal0: 0.15,   // strips start rising
  revealDur: 0.5,
  conv0: 1.1,      // strips start converging into the cup
  convDur: 0.9,
  inner: 2.25,     // rim + interior appear
  fall0: 2.35,     // popcorn starts falling
  fallDur: 2.1,
  unlock: 3.8,     // scrolling allowed
  end: 4.45,
}

export const scrollState = { p: 0, smooth: 0 }
export const pointer = { x: 0, y: 0 }
