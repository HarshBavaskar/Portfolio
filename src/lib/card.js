import QRCode from 'qrcode';
import { links } from '../data';

/*
  The contact card's data, its QR code, and a vCard for the phone's
  contacts, all made in the browser.
*/

export const SITE = 'https://harshbavaskar.github.io/Portfolio/';
export const CARD = {
  name: 'Harsh Bavaskar',
  role: 'Robotics · Embedded Systems · Computer Vision',
  place: 'Mumbai, India',
  serial: 'HB / 26 · No. 0001',
  rows: [
    ['Email', links.email],
    ...(links.phone ? [['Phone', links.phone]] : []),
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

/* A small square contact photo: the board's corner, logo lit. */
function contactPhoto() {
  const n = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = n;
  const c = canvas.getContext('2d');
  c.fillStyle = '#0b0c0d';
  c.fillRect(0, 0, n, n);
  c.strokeStyle = '#1b1f21';
  c.lineWidth = 5;
  [[0, 206, 140, 206, 190, 256], [256, 40, 200, 40, 160, 0]].forEach(([a, b, d, e, f, g]) => {
    c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineTo(f, g); c.stroke();
  });
  c.fillStyle = '#c99b45';
  [[34, 34], [222, 222]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); });
  drawMark(c, 58, 58, 5, '#ecebe6');
  return canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
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
    ...(links.phone ? [`TEL;TYPE=CELL:${links.phone.replace(/[^\d+]/g, '')}`] : []),
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
  download(blob, filename);
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
