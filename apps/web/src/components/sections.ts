import {
  BrickWall,
  CalendarDays,
  Flame,
  Home,
  type LucideIcon,
  Receipt,
  Scale,
  ShoppingCart,
  Sprout,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import type { TranslationKey } from '@/i18n/translations';

export interface Section {
  to: string;
  key: TranslationKey;
  /** A shorter label where room is tight: the bottom bar's tab. */
  shortKey?: TranslationKey;
  icon: LucideIcon;
}

/**
 * Every section, in the order the sidebar and the top bar list them. The one list the sidebar,
 * the top bar, the bottom bar and the Plus page all draw from, so a route, a label or an icon
 * changes in one place.
 */
export const sections: ReadonlyArray<Section> = [
  { to: '/', key: 'nav.dashboard', shortKey: 'nav.home', icon: Home },
  { to: '/campagnes', key: 'nav.campaigns', icon: CalendarDays },
  { to: '/mouleurs', key: 'nav.moulders', icon: Users },
  { to: '/rizieres', key: 'nav.riceFields', icon: Sprout },
  { to: '/clients', key: 'nav.clients', icon: UserRound },
  { to: '/productions', key: 'nav.productions', icon: BrickWall },
  { to: '/versements', key: 'nav.payments', icon: Wallet },
  { to: '/lots', key: 'nav.kilnBatches', icon: Flame },
  { to: '/ventes', key: 'nav.sales', icon: ShoppingCart },
  { to: '/depenses', key: 'nav.expenses', icon: Receipt },
  { to: '/soldes', key: 'nav.balances', icon: Scale },
];

/** The sections with a tab of their own in the bottom bar, under 640 pixels (section 10.7). */
const tabbed = new Set(['/', '/productions', '/ventes']);

export const bottomBarSections = sections.filter((section) => tabbed.has(section.to));

/** The rest, which the Plus page holds. */
export const moreSections = sections.filter((section) => !tabbed.has(section.to));
