import { NavLink, Outlet, useNavigate } from 'react-router';
import { CurrentCampaignProvider, useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useLogout, useSession } from './useSession.js';

/**
 * Header shared by every signed-in screen: who is in, the way out, and under it the current
 * campaign, which every entry of the next steps is made under.
 */
export function AppShell() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  const signOut = () =>
    logout.mutate(undefined, { onSuccess: () => navigate('/connexion', { replace: true }) });

  return (
    <CurrentCampaignProvider>
      <header className="shell-header">
        <strong>Briqueterie</strong>
        <span className="shell-who">
          <span>{session.data?.email}</span>
          <button type="button" onClick={signOut} disabled={logout.isPending}>
            Déconnexion
          </button>
        </span>
      </header>
      <CampaignPicker />
      <MainNav />
      <Outlet />
    </CurrentCampaignProvider>
  );
}

const sections = [
  { to: '/', label: 'Tableau de bord' },
  { to: '/campagnes', label: 'Campagnes' },
  { to: '/mouleurs', label: 'Mouleurs' },
  { to: '/rizieres', label: 'Rizières' },
  { to: '/clients', label: 'Clients' },
  { to: '/productions', label: 'Productions' },
  { to: '/versements', label: 'Versements' },
  { to: '/lots', label: 'Lots' },
  { to: '/ventes', label: 'Ventes' },
  { to: '/depenses', label: 'Dépenses' },
  { to: '/soldes', label: 'Soldes' },
];

/**
 * One link per section; the stylesheet marks the current one, which react-router flags with
 * `aria-current`. The dashboard needs `end`: every path descends from the root, so without it
 * that link would always look like the current one.
 */
function MainNav() {
  return (
    <nav aria-label="Sections" className="shell-nav">
      {sections.map((section) => (
        <NavLink key={section.to} to={section.to} end={section.to === '/'}>
          {section.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** A closed campaign can still be chosen, to read past figures; it says so in the option. */
function CampaignPicker() {
  const { campaign, campaigns, choose } = useCurrentCampaign();

  return (
    <nav aria-label="Campagne courante" className="shell-campaign">
      <label>
        Campagne courante
        <select
          value={campaign?.id ?? ''}
          onChange={(event) => choose(event.target.value)}
          disabled={campaigns.length === 0}
        >
          {campaigns.length === 0 && <option value="">Aucune</option>}
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year}
              {c.closedOn !== null && ' (clôturée)'}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
