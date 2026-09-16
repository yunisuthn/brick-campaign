/** "2026-06-27" -> "27/06/2026"; anything else, including '', becomes ''. */
export function isoToFrench(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

/** "27/06/2026" -> "2026-06-27"; incomplete or out-of-range text becomes ''. */
export function frenchToIso(text: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return '';
  const [, d, m, y] = match;
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? `${y}-${m}-${d}` : '';
}

/** Digits typed so far, laid out jj/mm/aaaa: "270620" -> "27/06/20". */
export function maskFrenchDateDigits(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter((part) => part !== '')
    .join('/');
}
