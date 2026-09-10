/**
 * Narrow no-break space and no-break space, the two French number formatting puts between
 * thousands. Built from their code points: written out they are invisible in the source, and
 * the lint rightly refuses them there.
 */
const INVISIBLE_SPACES = new RegExp(`[${String.fromCharCode(0x202f, 0x00a0)}]`, 'g');

/**
 * Raw `textContent` comparisons go through here, so an expected string can be written with
 * plain spaces. Queries like `getByText` and `toHaveTextContent` need no help: they normalise
 * whitespace themselves.
 */
export function plain(text: string | null | undefined): string {
  return (text ?? '').replace(INVISIBLE_SPACES, ' ');
}
