import { Link } from 'react-router';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';

/**
 * Everything the bottom bar has no room for (reference document, section 10.7): Accueil,
 * Productions and Ventes have their own tab under 640 pixels, this page holds the rest.
 * On a wider screen the top bar already lists every section, so nothing links here.
 */
const sections: ReadonlyArray<{ to: string; key: TranslationKey }> = [
  { to: '/campagnes', key: 'nav.campaigns' },
  { to: '/mouleurs', key: 'nav.moulders' },
  { to: '/rizieres', key: 'nav.riceFields' },
  { to: '/clients', key: 'nav.clients' },
  { to: '/versements', key: 'nav.payments' },
  { to: '/lots', key: 'nav.kilnBatches' },
  { to: '/depenses', key: 'nav.expenses' },
  { to: '/soldes', key: 'nav.balances' },
];

export function MorePage() {
  const { t } = useTranslation();
  return (
    <main className="page">
      <h1>{t('nav.more')}</h1>
      <nav aria-label={t('more.otherSections')}>
        <ul className="rows">
          {sections.map((section) => (
            <li key={section.to}>
              <Link to={section.to} className="row-name">
                {t(section.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
