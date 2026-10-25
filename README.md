# Reelpop — 3D Popcorn Animation Website

A cinematic 3D popcorn ordering experience built with React, Three.js, GSAP, and Tailwind CSS v4.

![Reelpop Preview](public/regular.png)

## Features

- 🍿 **Animated 3D Cup** — 24-strip folding intro animation where flat colored bars converge into a full 3D popcorn cup
- 🎬 **Cinematic Intro** — GSAP-orchestrated timeline that unfolds the cup, falls popcorn kernels with realistic physics (gravity + bounce), and reveals the UI
- 🎨 **3 Flavours** — Switch between Salted, Caramel, and Peri-Peri; each with unique cup colors, kernel tints, and glow effects
- 📐 **3 Sizes** — Small, Medium, Large with real-time 3D scale transition
- 📱 **Fully Responsive** — Mobile and desktop layouts
- 🖱️ **Parallax** — Cup tracks your mouse cursor
- 🎯 **Scroll Transitions** — Cup morphs position and orientation as you scroll into the flavours section

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite 6 |
| 3D Rendering | Three.js + @react-three/fiber + @react-three/drei |
| Animation | GSAP 3 + ScrollTrigger |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |

## Quick Start

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
├── index.html          # Entry HTML (intro class, Google Fonts)
├── vite.config.ts      # Vite + Tailwind plugin
├── tsconfig.json       # TypeScript config
├── package.json
├── public/
│   ├── regular.png     # Salted popcorn image
│   ├── caramel.png     # Caramel popcorn image
│   └── peri-peri.png   # Peri-Peri popcorn image
└── src/
    ├── main.tsx        # React entry point
    ├── App.tsx         # Root component — wires scroll, pointer, intro
    ├── store.ts        # Zustand global state (flavour, size, orders)
    ├── index.css       # Tailwind theme tokens + base styles
    ├── components/
    │   ├── Hero.tsx    # Hero section (POPLoud headline, nav)
    │   └── Flavours.tsx# Flavour picker, disc swap, info panel, order button
    ├── data/
    │   └── flavours.ts # Flavour & size data (colors, copy, images)
    ├── lib/
    │   ├── clock.ts    # GSAP intro timeline clock + scroll/pointer state
    │   ├── intro.ts    # Master intro timeline (strips → cup → headline → UI)
    │   ├── math.ts     # Easing, lerp, clamp, TAU, mulberry32 PRNG
    │   └── view.ts     # Camera params + frustum view dimensions
    └── three/
        ├── dims.ts     # Cup parametric dimensions (H, RT, RB, WALL)
        ├── Experience.tsx # R3F Canvas, lighting, environment, Rig scroll camera
        ├── CupStage.tsx   # CupAssembly enter/exit + BlobShadow + size scaling
        ├── Cup.tsx     # 24-strip morph geometry + intro animation
        └── Popcorn.tsx # 150-kernel instanced mesh, fall & pop modes
```

## Customisation

| What | Where |
|---|---|
| Intro timing | `src/lib/clock.ts` — `INTRO` constants |
| Cup shape | `src/three/dims.ts` — `CUP` constants |
| Flavour colours, copy, images | `src/data/flavours.ts` |
| Kernel count | `COUNT` in `src/three/Popcorn.tsx` |
| Flavour images | Replace files in `/public` |

## License

MIT
