# Harsh Bavaskar — Portfolio

Robotics, embedded systems and computer vision. Live at [harshbavaskar.github.io/Portfolio](https://harshbavaskar.github.io/Portfolio).

## The story, in chapters

| # | Chapter | What happens |
|---|---------|--------------|
| 00 | Index | The name, and a rover drawn as an engineering figure — drag to rotate. |
| 01 | The Rover | Pinned scroll: the NASA HERC rover explodes into its six subsystems, then drives out of frame to reveal the 5th-in-the-world result. |
| 02 | About | Statement that fills in as you read; odometer stats. |
| 03 | Path | Horizontal tape-deck timeline from first semester to the C-suite. |
| 04 | Work | Stacked spec sheets. Each project runs a live, interactive model on its own "device" screen. |
| 05 | Toolkit | A hardware keyboard of skills — hover, click, or type on your own keyboard. |
| 06 | Record | Awards, education, languages. |
| 07 | Contact | A dark sheet that lifts over the page. |

Small things: optional synthesised UI clicks (Sound in the nav), a live Mumbai clock, and **press G** to see the 12-column grid.

## Stack

- **React + Vite**
- **GSAP** — ScrollTrigger (pins, scrubs, horizontal scroll), SplitText, ScrambleText
- **Lenis** — smooth scrolling synced to GSAP's ticker
- **three.js** — the rover: paper-coloured faces for hidden-line removal, ink edge lines, a tweened paper ↔ ink theme shared with CSS
- **Canvas 2D** — the project demos (NatLang, Polaris, AIRO Bot, BlockBallot, Footfall Counter, PRISMRx)

Type is Geist and Geist Mono. Respects `prefers-reduced-motion`.

## Develop

```bash
npm install
npm run dev      # local
npm run build    # production build to dist/
npm run lint
```

Pushes to `main`/`master` deploy to GitHub Pages via `.github/workflows/deploy.yml`.

---
Designed and built by Harsh Bavaskar.
