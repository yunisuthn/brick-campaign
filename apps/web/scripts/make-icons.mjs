/**
 * Draws the application icons, so no binary arrives in the repository without the code that
 * made it. A brick wall in the two colours of the interface: no text, since a letter would be
 * unreadable at 48 pixels on a phone.
 *
 *   node scripts/make-icons.mjs
 *
 * PNG is written by hand (zlib is in Node): a drawing this simple does not deserve an image
 * dependency. Maskable variants keep the wall inside the safe circle Android crops to.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const GROUND = [0x8a, 0x3b, 0x12];
const BRICK = [0xc9, 0x6a, 0x3a];
const MORTAR = [0xfb, 0xf7, 0xf2];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, pixel) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let at = 0;
  for (let y = 0; y < size; y += 1) {
    raw[at] = 0; // filter: none
    at += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = pixel(x, y);
      raw[at] = r;
      raw[at + 1] = g;
      raw[at + 2] = b;
      at += 3;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Four courses of bricks, every other one offset by half a brick, drawn inside `inset` of the
 * canvas so a maskable icon survives the circle Android crops it to.
 */
function wall(size, inset) {
  const left = Math.round(size * inset);
  const width = size - left * 2;
  const courseHeight = width / 5;
  const brickWidth = width / 2.5;
  const mortar = Math.max(1, Math.round(size / 64));

  return (x, y) => {
    const inX = x - left;
    const inY = y - left;
    if (inX < 0 || inY < 0 || inX >= width || inY >= width) return GROUND;

    const course = Math.floor(inY / courseHeight);
    const offset = course % 2 === 0 ? 0 : brickWidth / 2;
    const alongCourse = (inX + offset) % brickWidth;
    const downCourse = inY % courseHeight;
    const onMortar = alongCourse < mortar || downCourse < mortar;
    return onMortar ? MORTAR : BRICK;
  };
}

const publicDir = new URL('../public/', import.meta.url);
const icons = [
  ['icon-192.png', 192, 0.08],
  ['icon-512.png', 512, 0.08],
  // Android crops a maskable icon to a circle: the wall sits well inside the canvas.
  ['icon-maskable-512.png', 512, 0.2],
];

for (const [name, size, inset] of icons) {
  writeFileSync(new URL(name, publicDir), png(size, wall(size, inset)));
  console.log(`${name} (${size}x${size})`);
}
