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
import { type ReactNode, useId } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { BottomNav } from '@/components/BottomNav';
import { LangSwitcher } from '@/components/LangSwitcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { cn } from '@/lib/utils';
import { CurrentCampaignProvider, useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';
import { useLogout, useSession } from './useSession.js';

/**
 * Around every signed-in screen: who is in, the way out, the current campaign, which every
 * entry is made under, and the sections. Under 1024 pixels a header, the campaign under it and
 * a bar of sections (the bottom bar under 640, section 10.7); from 1024 a sidebar holds them
 * all, beside the screen. One or the other is rendered, never both: no control is doubled.
 */
export function AppShell() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const desktop = useMediaQuery('(min-width: 64rem)');

  const signOut = () =>
    logout.mutate(undefined, { onSuccess: () => navigate('/connexion', { replace: true }) });
  const email = session.data?.email ?? '';
  const account = <AccountMenu email={email} onSignOut={signOut} signingOut={logout.isPending} />;

  // The screen keeps its place in the tree whichever layout is on, so resizing the window
  // across 1024 pixels does not remount it and lose what was being typed.
  return (
    <CurrentCampaignProvider>
      <div className={desktop ? 'flex min-h-dvh' : undefined}>
        {desktop && <Sidebar email={email} account={account} />}
        <div className="min-w-0 grow">
          {!desktop && (
            <>
              <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5">
                <Brand email={email} />
                <span className="flex shrink-0 items-center gap-2">
                  <LangSwitcher />
                  {account}
                </span>
              </header>
              <CampaignPicker />
              <MainNav />
            </>
          )}
          <Outlet />
          {!desktop && <BottomNav />}
        </div>
      </div>
    </CurrentCampaignProvider>
  );
}

/** The mark, the application's name and who is signed in. */
function Brand({ email }: { email: string }) {
  const { t } = useTranslation();
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
      >
        B
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <strong className="font-semibold">{t('shell.appName')}</strong>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </span>
    </span>
  );
}

/**
 * From 1024 pixels: the brand, the current campaign and every section down the left edge,
 * the language and the account at its foot. It stays in place while the screen scrolls.
 */
function Sidebar({ email, account }: { email: string; account: ReactNode }) {
  const { t } = useTranslation();
  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r bg-card">
      <div className="border-b px-4 py-3">
        <Brand email={email} />
      </div>
      <CampaignPicker inSidebar />
      <nav aria-label={t('nav.sections')} className="grow overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {sections.map(({ to, key, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold aria-[current=page]:text-primary"
              >
                <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                {t(key)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <LangSwitcher />
        {account}
      </div>
    </aside>
  );
}

/** The signed-in person's initial; the way out sits behind it. */
function AccountMenu({
  email,
  onSignOut,
  signingOut,
}: {
  email: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t('shell.accountMenu')}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase">
            {email.charAt(0) || '?'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-11" disabled={signingOut} onSelect={onSignOut}>
          {t('shell.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const sections: ReadonlyArray<{ to: string; key: TranslationKey; icon: LucideIcon }> = [
  { to: '/', key: 'nav.dashboard', icon: Home },
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

/**
 * One link per section; the current one, which react-router flags with `aria-current`, gets
 * the brick colour and a pale pill. The dashboard needs `end`: every path descends from the
 * root, so without it that link would always look like the current one. Hidden under 640
 * pixels (section 10.7), where eleven links wrapped to three lines above every screen; the
 * bottom bar takes over. On one line that scrolls sideways when a tablet is too narrow for all
 * eleven. From 1024 pixels the sidebar lists the same sections instead.
 */
function MainNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.sections')}
      className="hidden gap-1 overflow-x-auto border-b bg-card px-3 py-1.5 sm:flex"
    >
      {sections.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          end={section.to === '/'}
          className="flex min-h-9 shrink-0 items-center rounded-md px-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold aria-[current=page]:text-primary"
        >
          {t(section.key)}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * A closed campaign can still be chosen, to read past figures; it says so in the option. The
 * list is Radix's, positioned by its own code rather than the browser's native popup, which
 * opens off in a corner under device emulation and in some in-app webviews.
 */
function CampaignPicker({ inSidebar = false }: { inSidebar?: boolean }) {
  const { campaign, campaigns, choose } = useCurrentCampaign();
  const { t } = useTranslation();
  const id = useId();

  return (
    <nav
      aria-label={t('shell.currentCampaign')}
      className={cn('border-b bg-card', inSidebar ? 'px-4 py-3' : 'px-4 pt-2 pb-3 sm:py-2')}
    >
      <div
        className={cn(
          'flex flex-col gap-1.5',
          !inSidebar &&
            'mx-auto max-w-md sm:max-w-2xl sm:flex-row sm:items-center sm:gap-3 sm:px-2',
        )}
      >
        <Label htmlFor={id} className="shrink-0 text-xs text-muted-foreground">
          {t('shell.currentCampaign')}
        </Label>
        <Select value={campaign?.id ?? ''} onValueChange={choose} disabled={campaigns.length === 0}>
          <SelectTrigger id={id} className={cn('w-full bg-card', !inSidebar && 'sm:w-64')}>
            <SelectValue placeholder={t('shell.noCampaign')} />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id} className="min-h-11">
                {`${c.year}${t('campaigns.trancheSuffix', { tranche: c.tranche })}${c.closedOn !== null ? t('shell.closedSuffix') : ''}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </nav>
  );
}
