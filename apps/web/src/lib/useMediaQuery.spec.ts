import { act, renderHook } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery.js';

/** A list for one query, its listeners kept so a test can fire a change. */
function fakeList(matches: boolean, api: 'modern' | 'legacy') {
  const listeners = new Set<() => void>();
  const list = {
    matches,
    media: '(min-width: 40rem)',
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    ...(api === 'modern' && {
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    }),
  };
  const change = (next: boolean) => {
    list.matches = next;
    act(() => listeners.forEach((listener) => listener()));
  };
  return { list, listeners, change };
}

describe('useMediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('never matches where the browser has no matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useMediaQuery('(min-width: 40rem)'));
    expect(result.current).toBe(false);
  });

  it.each(['modern', 'legacy'] as const)(
    'follows the window with the %s listener API, and lets go on unmount',
    (api) => {
      const fake = fakeList(false, api);
      vi.stubGlobal('matchMedia', () => fake.list);
      const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 40rem)'));
      expect(result.current).toBe(false);

      fake.change(true);
      expect(result.current).toBe(true);

      unmount();
      expect(fake.listeners.size).toBe(0);
    },
  );

  it('subscribes once, however often the component re-renders', () => {
    const fake = fakeList(false, 'modern');
    const matchMedia = vi.fn(() => fake.list);
    vi.stubGlobal('matchMedia', matchMedia);
    const { rerender } = renderHook(() => useMediaQuery('(min-width: 40rem)'));
    rerender();
    rerender();
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(fake.listeners.size).toBe(1);
  });
});
