// Renders the app icons from the HB monogram (same paths as src/components/Mark.jsx).
// Run: npx -p sharp node scripts/icons.cjs (or with sharp installed) → writes into public/
const sharp = require('sharp');
const path = require('path');

const INK = ['M4 3.5v21', 'M13 3.5v21', 'M13 3.5h4.5a5.25 5.25 0 0 1 0 10.5H13', 'M13 14h5.5a5.25 5.25 0 0 1 0 10.5H13'];
const PAPER = '#EEECE7', INKC = '#121212', SIGNAL = '#FF5B14';

// the glyph's visual centre and height, in its 28-unit box (strokes included)
const CX = 13.9, CY = 14, GH = 23.6;

function svg(size, { glyph, radius = 0 }) {
  const s = (size * glyph) / GH;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius * size}" fill="${PAPER}"/>
  <g transform="translate(${size / 2} ${size / 2}) scale(${s}) translate(${-CX} ${-CY})" fill="none" stroke-linecap="square" stroke-linejoin="miter">
    <g stroke="${INKC}" stroke-width="2.6">${INK.map((d) => `<path d="${d}"/>`).join('')}</g>
    <path d="M4 14h9" stroke="${SIGNAL}" stroke-width="3.4"/>
  </g>
</svg>`;
}

const out = (f) => path.join(__dirname, '..', 'public', f);
const jobs = [
  // "any": a rounded tile, used by desktop installs and the tab
  ['icon-192.png', 192, { glyph: 0.5, radius: 0.22 }],
  ['icon-512.png', 512, { glyph: 0.5, radius: 0.22 }],
  // maskable: full bleed, the glyph inside the 80% safe circle
  ['icon-maskable-192.png', 192, { glyph: 0.4 }],
  ['icon-maskable-512.png', 512, { glyph: 0.4 }],
  // iOS rounds its own corners and dislikes transparency
  ['apple-touch-icon.png', 180, { glyph: 0.48 }],
  ['favicon-32.png', 32, { glyph: 0.62, radius: 0.2 }],
];

(async () => {
  for (const [file, size, opt] of jobs) await sharp(Buffer.from(svg(size, opt))).png({ compressionLevel: 9 }).toFile(out(file));
  require('fs').writeFileSync(out('icon.svg'), svg(64, { glyph: 0.6, radius: 0.2 }));
  console.log('icons written');
})();
