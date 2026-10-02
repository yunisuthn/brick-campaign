import {
  CalendarDays,
  Flame,
  type LucideIcon,
  Receipt,
  Scale,
  Sprout,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import { ListCard, ListRow } from '@/components/ListCard';
import { IconTile } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';

/**
 * Everything the bottom bar has no room for (reference document, section 10.7): Accueil,
 * Productions and Ventes have their own tab under 640 pixels, this page holds the rest.
 * On a wider screen the top bar already lists every section, so nothing links here.
 */
const sections: ReadonlyArray<{ to: string; key: TranslationKey; icon: LucideIcon }> = [
  { to: '/campagnes', key: 'nav.campaigns', icon: CalendarDays },
  { to: '/mouleurs', key: 'nav.moulders', icon: Users },
  { to: '/rizieres', key: 'nav.riceFields', icon: Sprout },
  { to: '/clients', key: 'nav.clients', icon: UserRound },
  { to: '/versements', key: 'nav.payments', icon: Wallet },
  { to: '/lots', key: 'nav.kilnBatches', icon: Flame },
  { to: '/depenses', key: 'nav.expenses', icon: Receipt },
  { to: '/soldes', key: 'nav.balances', icon: Scale },
];

export function MorePage() {
  const { t } = useTranslation();
  return (
    <Screen>
      <PageHeader title={t('nav.more')} />
      <nav aria-label={t('more.otherSections')}>
        <ListCard>
          {sections.map((section) => (
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
