import { NavLink, Outlet, useNavigate } from 'react-router';
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
      <header className="shell-header">
        <strong>{t('shell.appName')}</strong>
        <span className="shell-who">
          <LangSwitcher />
          <span>{session.data?.email}</span>
          <button type="button" onClick={signOut} disabled={logout.isPending}>
            {t('shell.logout')}
          </button>
        </span>
      </header>
      <CampaignPicker />
      <MainNav />
      <Outlet />
      <BottomNav />
    </CurrentCampaignProvider>
  );
}

/** French and Malagasy, kept as two plain buttons rather than a select: only two choices, and
 * a button's own label stays readable in whichever language is not currently picked. */
function LangSwitcher() {
  const { lang, setLang, t } = useTranslation();
  const other: Lang = lang === 'fr' ? 'mg' : 'fr';
  return (
    <button type="button" onClick={() => setLang(other)}>
      {t(`shell.lang.${other}` as TranslationKey)}
    </button>
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

const bottomSections: ReadonlyArray<{ to: string; key: TranslationKey }> = [
  { to: '/', key: 'nav.home' },
  { to: '/productions', key: 'nav.productions' },
  { to: '/ventes', key: 'nav.sales' },
  { to: '/plus', key: 'nav.more' },
];

/**
 * Four destinations under the thumb (reference document, section 10.7): the evening's two main
 * entries, the dashboard they open on, and everything else behind "Plus". Shown only under 640
 * pixels; same routes as the top bar, so nothing needs keeping in sync between the two.
 */
function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('nav.bottom')} className="shell-bottom-nav">
      {bottomSections.map((section) => (
        <NavLink key={section.to} to={section.to} end={section.to === '/'}>
          {t(section.key)}
        </NavLink>
      ))}
    </nav>
  );
}

/** A closed campaign can still be chosen, to read past figures; it says so in the option. */
function CampaignPicker() {
  const { campaign, campaigns, choose } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <nav aria-label={t('shell.currentCampaign')} className="shell-campaign">
      <label>
        {t('shell.currentCampaign')}
        <select
          value={campaign?.id ?? ''}
          onChange={(event) => choose(event.target.value)}
          disabled={campaigns.length === 0}
        >
          {campaigns.length === 0 && <option value="">{t('shell.noCampaign')}</option>}
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year}
              {c.closedOn !== null && t('shell.closedSuffix')}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
