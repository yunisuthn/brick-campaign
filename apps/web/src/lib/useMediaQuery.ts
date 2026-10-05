import { useSyncExternalStore } from 'react';

/**
 * Whether a media query matches, kept up to date as the window is resized. Where the browser
 * has no `matchMedia` (jsdom, under the tests) it never matches: the phone layout.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}
