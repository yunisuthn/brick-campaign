import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Whether a media query matches, kept up to date as the window is resized. Where the browser
 * has no `matchMedia` (jsdom, under the tests) it never matches: the phone layout. One list per
 * query, and one subscription for as long as the query is the same, whatever re-renders.
 */
export function useMediaQuery(query: string): boolean {
  const list = useMemo(
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query) : null),
    [query],
  );
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (list === null) return () => undefined;
      if (typeof list.addEventListener === 'function') {
        list.addEventListener('change', onChange);
        return () => list.removeEventListener('change', onChange);
      }
      // Safari before 14 and older Android webviews only know the older pair.
      list.addListener(onChange);
      return () => list.removeListener(onChange);
    },
    [list],
  );
  return useSyncExternalStore(
    subscribe,
    () => list?.matches ?? false,
    () => false,
  );
}
