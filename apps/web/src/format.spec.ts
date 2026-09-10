import { formatAmount, formatBricks, formatDate, today } from './format.js';

describe('formatAmount', () => {
  it('groups thousands the French way and appends the currency', () => {
    expect(formatAmount(1_250_000)).toBe('1 250 000 Ar');
    expect(formatAmount(0)).toBe('0 Ar');
  });
});

describe('formatDate', () => {
  it('spells the month in French', () => {
    expect(formatDate('2026-05-10')).toBe('10 mai 2026');
  });

  it('keeps the calendar day whatever the zone', () => {
    expect(formatDate('2026-01-01')).toBe('1 janvier 2026');
  });
});

describe('today', () => {
  it('gives the local calendar day in the API format', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 10, 23, 30) });
    expect(today()).toBe('2026-09-10');
    vi.useRealTimers();
  });
});

describe('formatBricks', () => {
  it('groups thousands and agrees the noun', () => {
    expect(formatBricks(1200)).toBe('1 200 briques');
    expect(formatBricks(1)).toBe('1 brique');
  });
});
