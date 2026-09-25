# Harsh Bavaskar · Portfolio

Robotics, embedded systems and computer vision. Live at [harshbavaskar.github.io/Portfolio](https://harshbavaskar.github.io/Portfolio).

## The story, in chapters

| # | Chapter | What happens |
|---|---------|--------------|
| 00 | Index | The name, and a rover drawn as an engineering figure. Drag to rotate. |
| 01 | The Rover | Pinned scroll: the NASA HERC rover explodes into its six subsystems, then drives out of frame to reveal the 5th-in-the-world result. |
| 02 | About | Statement that fills in as you read; odometer stats. |
| 03 | Path | Horizontal tape-deck timeline from first semester to the C-suite. |
| 04 | Work | Stacked spec sheets (Desk, TUX OS, NatLang, Polaris, AIRO Bot, BlockBallot, Footfall Counter, PRISMRx), each on its own "device" screen with a live model or real product screens. |
| 05 | Toolkit | A hardware keyboard of skills: hover, click, or type on your own keyboard. |
| 06 | Record | Awards, education, languages. |
| 07 | Contact | A dark sheet that lifts over the page. |

Small things: optional synthesised UI clicks (Sound in the nav) and a live Mumbai clock.

## Early-access pages

- **`/tux/`**: TUX OS early access, in TUX's own Space Black. The dot-matrix avatar changes mood with the form: cyan while you type, violet while it sends, green when you're in.
- **`/desk/`**: Desk testing, for students and teachers only. Six Classroom cards collapse into one Desk list.

Sign-ups go to a Google Sheet through a small Apps Script (`scripts/early-access.gs`): one tab per product, one row per email, and each person is told their place in the queue. To connect it:

1. Create a blank Google Sheet → **Extensions → Apps Script** → paste `scripts/early-access.gs` → Save.
2. **Deploy → New deployment → Web app**, execute as *Me*, access *Anyone*. Copy the URL.
3. Put the URL in `src/early/config.js` (or set `VITE_SIGNUP_ENDPOINT` at build time).

Until it's connected, the forms open a pre-filled email instead, so no sign-up is lost.

## Stack

- **React + Vite**
- **GSAP**: ScrollTrigger (pins, scrubs, horizontal scroll), SplitText, ScrambleText
- **Lenis**: smooth scrolling synced to GSAP's ticker
- **three.js**: the rover: paper-coloured faces for hidden-line removal, ink edge lines, a tweened paper ↔ ink theme shared with CSS
- **Canvas 2D**: the project demos (NatLang, Polaris, AIRO Bot, BlockBallot, Footfall Counter, PRISMRx)

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
