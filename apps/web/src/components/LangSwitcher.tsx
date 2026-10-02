import { Button } from '@/components/ui/button';
import { type Lang, useTranslation } from '@/i18n/I18nProvider';

/**
 * French and Malagasy: two choices, so one button that flips between them, both codes shown
 * and the current one stressed. Its accessible name says what a press does.
 */
export function LangSwitcher() {
  const { lang, setLang, t } = useTranslation();
  const other: Lang = lang === 'fr' ? 'mg' : 'fr';
  return (
    <Button
      type="button"
      variant="outline"
      className="px-3 text-xs"
      onClick={() => setLang(other)}
      aria-label={t(other === 'mg' ? 'shell.switchToMg' : 'shell.switchToFr')}
    >
      <span className={lang === 'mg' ? 'font-bold' : 'text-muted-foreground'}>MG</span>
      <span aria-hidden="true" className="text-muted-foreground">
        /
      </span>
      <span className={lang === 'fr' ? 'font-bold' : 'text-muted-foreground'}>FR</span>
    </Button>
  );
}
