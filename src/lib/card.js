import QRCode from 'qrcode';
import { links } from '../data';

/*
  The take-away contact card: a vCard for the phone's contacts and a
  rendered image of the metal card, both made in the browser, both usable
  offline for good.
*/

export const SITE = 'https://harshbavaskar.github.io/Portfolio/';
export const CARD = {
  name: 'Harsh Bavaskar',
  role: 'Robotics · Embedded Systems · Computer Vision',
  place: 'Mumbai, India',
  serial: 'HB — 26 · No. 0001',
  rows: [
    ['Email', links.email],
    ['Web', 'harshbavaskar.github.io/Portfolio'],
    ['GitHub', 'github.com/HarshBavaskar'],
    ['LinkedIn', 'linkedin.com/in/harsh-bavaskar'],
  ],
};

export const qrMatrix = (text = SITE) => {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  return { size: modules.size, on: (r, c) => !!modules.get(r, c) };
};

const INK = [
  'M4 3.5v21',
  'M13 3.5v21',
  'M13 3.5h4.5a5.25 5.25 0 0 1 0 10.5H13',
  'M13 14h5.5a5.25 5.25 0 0 1 0 10.5H13',
];

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// the HB monogram at (x, y), `s` pixels per glyph unit
function drawMark(c, x, y, s, ink, bar = '#FF5B14') {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineWidth = 2.6;
  c.lineCap = 'square';
  c.lineJoin = 'miter';
  c.strokeStyle = ink;
  INK.forEach((d) => c.stroke(new Path2D(d)));
  c.strokeStyle = bar;
  c.lineWidth = 3.4;
  c.stroke(new Path2D('M4 14h9'));
  c.restore();
}

// engraved: a light lower lip, then the cut itself
function engrave(c, fn) {
  c.save();
  c.translate(0, 1.4);
  fn('rgba(255,255,255,0.75)');
  c.restore();
  fn('rgba(38,40,44,0.88)');
}

function brushed(c, x, y, w, h) {
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#cfd2d6');
  g.addColorStop(0.45, '#eceef0');
  g.addColorStop(0.55, '#e3e5e8');
  g.addColorStop(1, '#c3c6ca');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // hairline grain
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let yy = y; yy < y + h; yy += 1.5) {
    c.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${rand() * 0.18})` : `rgba(60,62,66,${rand() * 0.06})`;
    c.fillRect(x, yy, w, 1);
  }
  // a soft band of light across the metal
  const s = c.createLinearGradient(x, y, x + w, y + h * 0.6);
  s.addColorStop(0.25, 'rgba(255,255,255,0)');
  s.addColorStop(0.42, 'rgba(255,255,255,0.45)');
  s.addColorStop(0.58, 'rgba(255,255,255,0)');
  c.fillStyle = s;
  c.fillRect(x, y, w, h);
}

function cardFace(c, x, y, w, h, draw) {
  const r = h * 0.07;
  // thickness and shadow
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.55)';
  c.shadowBlur = h * 0.12;
  c.shadowOffsetY = h * 0.06;
  roundRect(c, x, y + 3, w, h, r);
  c.fillStyle = '#8e9196';
  c.fill();
  c.restore();
  c.save();
  roundRect(c, x, y, w, h, r);
  c.clip();
  brushed(c, x, y, w, h);
  draw();
  c.restore();
  // bevelled edge
  roundRect(c, x + 1, y + 1, w - 2, h - 2, r);
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = 2;
  c.stroke();
  roundRect(c, x, y, w, h, r);
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = 1;
  c.stroke();
}

const font = (weight, px, mono) => `${weight} ${px}px ${mono ? '"Geist Mono", ui-monospace, monospace' : 'Geist, "Helvetica Neue", Arial, sans-serif'}`;

/* Both faces of the card, stacked, on a dark ground: phone-friendly. */
export async function renderCardImage() {
  await document.fonts?.ready;
  const S = 2; // render at twice the size
  const W = 1200, H = 1640, cw = 1000, ch = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const c = canvas.getContext('2d');
  c.scale(S, S);
  c.fillStyle = '#101010';
  c.fillRect(0, 0, W, H);
  const x = (W - cw) / 2;

  // front
  cardFace(c, x, 110, cw, ch, () => {
    engrave(c, (ink) => drawMark(c, x + 64, 110 + 64, 5.2, ink));
    engrave(c, (ink) => {
      c.fillStyle = ink;
      c.font = font(600, 74, false);
      c.fillText(CARD.name, x + 64, 110 + 440);
      c.font = font(500, 22, true);
      c.fillText(CARD.role.toUpperCase(), x + 66, 110 + 492);
      c.fillText(CARD.serial.toUpperCase(), x + 66, 110 + 574);
      c.textAlign = 'right';
      c.fillText(CARD.place.toUpperCase(), x + cw - 64, 110 + 574);
      c.textAlign = 'left';
    });
    c.fillStyle = '#FF5B14';
    c.fillRect(x + 64, 110 + 516, 180, 4);
  });

  // back
  const by = 110 + ch + 90;
  cardFace(c, x, by, cw, ch, () => {
    engrave(c, (ink) => {
      c.fillStyle = ink;
      c.font = font(500, 20, true);
      c.fillText('CONTACT', x + 64, by + 84);
      CARD.rows.forEach(([k, v], i) => {
        const ry = by + 170 + i * 92;
        c.font = font(500, 18, true);
        c.fillText(k.toUpperCase(), x + 64, ry);
        c.font = font(500, 32, false);
        c.fillText(v, x + 64, ry + 40);
      });
    });
    // engraved QR
    const { size, on } = qrMatrix();
    const q = 250, cell = q / size, qx = x + cw - 64 - q, qy = by + 150;
    engrave(c, (ink) => {
      c.fillStyle = ink;
      for (let r = 0; r < size; r++) for (let col = 0; col < size; col++) if (on(r, col)) c.fillRect(qx + col * cell, qy + r * cell, cell + 0.4, cell + 0.4);
      c.font = font(500, 16, true);
      c.textAlign = 'center';
      c.fillText('SCAN FOR THE PORTFOLIO', qx + q / 2, qy + q + 40);
      c.textAlign = 'left';
    });
    engrave(c, (ink) => drawMark(c, x + cw - 64 - 34, by + 56, 1.25, ink));
  });

  c.fillStyle = 'rgba(236,234,228,0.45)';
  c.font = font(500, 18, true);
  c.textAlign = 'center';
  c.fillText('HARSHBAVASKAR.GITHUB.IO/PORTFOLIO', W / 2, H - 50);
  return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
}

/* A small square contact photo: the monogram on brushed metal. */
function contactPhoto() {
  const n = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = n;
  const c = canvas.getContext('2d');
  brushed(c, 0, 0, n, n);
  engrave(c, (ink) => drawMark(c, 58, 58, 5, ink));
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

// vCard lines fold at 75 octets with CRLF + space
const fold = (line) => line.match(/.{1,74}/g).join('\r\n ');

export function buildVCard() {
  const esc = (s) => s.replace(/([,;\\])/g, '\\$1');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Bavaskar;Harsh;;;',
    `FN:${CARD.name}`,
    `TITLE:${esc('Robotics, Embedded Systems & Computer Vision')}`,
    'ORG:Atlas Skilltech University',
    `EMAIL;TYPE=INTERNET,PREF:${links.email}`,
    `URL:${SITE}`,
    `item1.URL:${links.github}`,
    'item1.X-ABLabel:GitHub',
    `item2.URL:${links.linkedin}`,
    'item2.X-ABLabel:LinkedIn',
    `X-SOCIALPROFILE;TYPE=github:${links.github}`,
    `X-SOCIALPROFILE;TYPE=linkedin:${links.linkedin}`,
    'ADR;TYPE=WORK:;;;Mumbai;;;India',
    `NOTE:${esc("Robotics, embedded systems and real-time computer vision. Led India's only entry in NASA HERC's RC division to 5th in the world.")}`,
    `PHOTO;ENCODING=b;TYPE=JPEG:${contactPhoto()}`,
    'END:VCARD',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

// On phones, hand the file to the share sheet (Save to Photos / Contacts);
// elsewhere, a plain download.
export async function deliver(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file], title: 'Harsh Bavaskar' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
