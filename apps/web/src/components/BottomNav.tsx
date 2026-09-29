import { BrickWall, Home, MoreHorizontal, ShoppingCart, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';
import { cn } from '@/lib/utils';

const destinations: ReadonlyArray<{ to: string; key: TranslationKey; Icon: LucideIcon }> = [
  { to: '/', key: 'nav.home', Icon: Home },
  { to: '/productions', key: 'nav.productions', Icon: BrickWall },
  { to: '/ventes', key: 'nav.sales', Icon: ShoppingCart },
  { to: '/plus', key: 'nav.more', Icon: MoreHorizontal },
];

/**
 * Four destinations under the thumb (reference document, section 10.7), below 640 pixels only;
 * the top bar takes over above. react-router sets `aria-current="page"` on the current one,
 * which is what the brick colour and the pale pill behind its icon key on.
 */
export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.bottom')}
      className="ui fixed inset-x-0 bottom-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgb(0_0_0/0.06)] sm:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {destinations.map(({ to, key, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={cn(
                'group flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors',
                'hover:text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
              )}
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full transition-colors group-aria-[current=page]:bg-primary/10">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {t(key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
