import { ListCard, ListRow } from '@/components/ListCard';
import { IconTile } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { moreSections } from '@/components/sections';
import { useTranslation } from '../i18n/I18nProvider.js';

/**
 * Everything the bottom bar has no room for (reference document, section 10.7): Accueil,
 * Productions and Ventes have their own tab under 640 pixels, this page holds the rest.
 * On a wider screen the top bar or the sidebar already lists every section, so nothing links
 * here.
 */
export function MorePage() {
  const { t } = useTranslation();
  return (
    <Screen>
      <PageHeader title={t('nav.more')} />
      <nav aria-label={t('more.otherSections')}>
        <ListCard>
          {moreSections.map((section) => (
            <ListRow
              key={section.to}
              to={section.to}
              title={t(section.key)}
              leading={<IconTile icon={section.icon} />}
            />
          ))}
        </ListCard>
      </nav>
    </Screen>
  );
}
