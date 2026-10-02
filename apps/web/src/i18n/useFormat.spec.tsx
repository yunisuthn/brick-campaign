import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { plain } from '../test/text.js';
import { I18nProvider } from './I18nProvider.js';
import { useFormat } from './useFormat.js';

function wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

describe('useFormat', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 2, 20, 0), toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('names today and yesterday, and dates the days before', () => {
    const { result } = renderHook(() => useFormat(), { wrapper });
    expect(result.current.day('2026-10-02')).toBe('Aujourd’hui · 2 octobre 2026');
    expect(result.current.day('2026-10-01')).toBe('Hier · 1 octobre 2026');
    expect(result.current.day('2026-09-30')).toBe('30 septembre 2026');
  });

  it('follows the interface language for dates and bricks, not for amounts', () => {
    localStorage.setItem('lang', 'mg');
    const { result } = renderHook(() => useFormat(), { wrapper });
    expect(result.current.day('2026-10-02')).toBe('Androany · 2 Oktobra 2026');
    expect(plain(result.current.bricks(42000))).toBe('42 000 biriky');
    expect(plain(result.current.amount(1250000))).toBe('1 250 000 Ar');
  });
});
