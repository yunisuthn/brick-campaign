import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { dictionary, type TranslationKey } from './translations.js';

export type Lang = 'fr' | 'mg';

const STORAGE_KEY = 'lang';

/** Falls back to French when storage is blocked (a private window) or holds nothing useful. */
function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'mg' ? 'mg' : 'fr';
  } catch {
    return 'fr';
  }
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** `{name}` inside the template is replaced from `vars`; every other character is literal. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Wraps the whole signed-in app (reference document, section 10.6 style: one thing, described
 * once). Every piece of on-screen text goes through `t`, so switching language is instant and
 * needs no reload; the choice is remembered per browser, not per person, since the API carries
 * no language of its own.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Still switches for this visit; it just will not be remembered next time.
    }
  };

  const t = useMemo(() => {
    return (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = dictionary[lang][key];
      if (vars === undefined) return template;
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template,
      );
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === null) throw new Error('useTranslation used outside I18nProvider');
  return context;
}
