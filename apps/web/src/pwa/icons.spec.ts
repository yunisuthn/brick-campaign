import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The manifest points at these three files by name and size (see `vite.config.ts`); a phone
 * refuses to install the application when one is missing or the wrong shape. They are drawn
 * by `scripts/make-icons.mjs`.
 */
const icons = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
] as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('application icons', () => {
  it.each(icons)('%s is a square PNG of %i pixels', (name, size) => {
    const file = readFileSync(join(process.cwd(), 'public', name));

    expect(file.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    // The IHDR chunk holds the dimensions, just after the signature and the chunk header.
    expect(file.readUInt32BE(16)).toBe(size);
    expect(file.readUInt32BE(20)).toBe(size);
  });
});
