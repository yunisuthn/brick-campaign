import { Link } from 'react-router';

/**
 * Everything the bottom bar has no room for (reference document, section 10.7): Accueil,
 * Productions and Ventes have their own tab under 640 pixels, this page holds the rest.
 * On a wider screen the top bar already lists every section, so nothing links here.
 */
const sections = [
  { to: '/campagnes', label: 'Campagnes' },
  { to: '/mouleurs', label: 'Mouleurs' },
  { to: '/rizieres', label: 'Rizières' },
  { to: '/clients', label: 'Clients' },
  { to: '/versements', label: 'Versements' },
  { to: '/lots', label: 'Lots' },
  { to: '/depenses', label: 'Dépenses' },
  { to: '/soldes', label: 'Soldes' },
];

export function MorePage() {
  return (
    <main className="page">
      <h1>Plus</h1>
      <nav aria-label="Autres sections">
        <ul className="rows">
          {sections.map((section) => (
            <li key={section.to}>
              <Link to={section.to} className="row-name">
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
