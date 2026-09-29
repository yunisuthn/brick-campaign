import { useId } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { BottomNav } from '@/components/BottomNav';
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
import { CurrentCampaignProvider, useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { type Lang, useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';
import { useLogout, useSession } from './useSession.js';

/**
 * Header shared by every signed-in screen: who is in, the way out, and under it the current
 * campaign, which every entry of the next steps is made under.
 */
export function AppShell() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const signOut = () =>
    logout.mutate(undefined, { onSuccess: () => navigate('/connexion', { replace: true }) });

  return (
    <CurrentCampaignProvider>
      <header className="ui flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
          >
            B
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <strong className="font-semibold">{t('shell.appName')}</strong>
            <span className="truncate text-xs text-muted-foreground">{session.data?.email}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <LangSwitcher />
          <AccountMenu
            email={session.data?.email ?? ''}
            onSignOut={signOut}
            signingOut={logout.isPending}
          />
        </span>
      </header>
      <CampaignPicker />
      <MainNav />
      <Outlet />
      <BottomNav />
    </CurrentCampaignProvider>
  );
}

/**
 * French and Malagasy: two choices, so one button that flips between them, both codes shown
 * and the current one stressed. Its accessible name says what a press does.
 */
function LangSwitcher() {
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

const sections: ReadonlyArray<{ to: string; key: TranslationKey }> = [
  { to: '/', key: 'nav.dashboard' },
  { to: '/campagnes', key: 'nav.campaigns' },
  { to: '/mouleurs', key: 'nav.moulders' },
  { to: '/rizieres', key: 'nav.riceFields' },
  { to: '/clients', key: 'nav.clients' },
  { to: '/productions', key: 'nav.productions' },
  { to: '/versements', key: 'nav.payments' },
  { to: '/lots', key: 'nav.kilnBatches' },
  { to: '/ventes', key: 'nav.sales' },
  { to: '/depenses', key: 'nav.expenses' },
  { to: '/soldes', key: 'nav.balances' },
];

/**
 * One link per section; the stylesheet marks the current one, which react-router flags with
 * `aria-current`. The dashboard needs `end`: every path descends from the root, so without it
 * that link would always look like the current one. Hidden under 640 pixels (section 10.7),
 * where eleven links wrapped to three lines above every screen; the bottom bar takes over.
 */
function MainNav() {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('nav.sections')} className="shell-nav">
      {sections.map((section) => (
        <NavLink key={section.to} to={section.to} end={section.to === '/'}>
          {t(section.key)}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * A closed campaign can still be chosen, to read past figures; it says so in the option. The
 * list is Radix's, positioned by its own code rather than the browser's native popup, which is
 * what the old hand-made dropdown was for (form/Select.tsx).
 */
function CampaignPicker() {
  const { campaign, campaigns, choose } = useCurrentCampaign();
  const { t } = useTranslation();
  const id = useId();

  return (
    <nav aria-label={t('shell.currentCampaign')} className="ui border-b bg-card px-4 pt-2 pb-3">
      <div className="mx-auto flex max-w-md flex-col gap-1.5">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {t('shell.currentCampaign')}
        </Label>
        <Select value={campaign?.id ?? ''} onValueChange={choose} disabled={campaigns.length === 0}>
          <SelectTrigger id={id} className="w-full bg-card">
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
