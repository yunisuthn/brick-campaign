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
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.75rem 1rem',
          background: 'var(--brick)',
          color: 'white',
        }}
      >
        <strong>Briqueterie</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
  { to: '/campagnes', label: 'Campagnes' },
  { to: '/mouleurs', label: 'Mouleurs' },
  { to: '/rizieres', label: 'Rizières' },
  { to: '/clients', label: 'Clients' },
  { to: '/productions', label: 'Productions' },
  { to: '/versements', label: 'Versements' },
];

/** One link per section, the current one underlined; grows with the front plan. */
function MainNav() {
  return (
    <nav
      aria-label="Sections"
      style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem', flexWrap: 'wrap' }}
    >
      {sections.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}
        >
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
    <nav
      aria-label="Campagne courante"
      style={{ padding: '0.5rem 1rem', background: 'white', borderBottom: '1px solid #e5ddd4' }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
