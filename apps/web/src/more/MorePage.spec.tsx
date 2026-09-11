import { screen } from '@testing-library/react';
import { renderRoutes } from '../test/render.js';
import { MorePage } from './MorePage.js';

describe('MorePage', () => {
  it('links to every section the bottom bar has no room for', () => {
    renderRoutes([{ path: '/plus', element: <MorePage /> }], '/plus');

    expect(screen.getByRole('heading', { name: 'Plus' })).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Campagnes', '/campagnes'],
      ['Mouleurs', '/mouleurs'],
      ['Rizières', '/rizieres'],
      ['Clients', '/clients'],
      ['Versements', '/versements'],
      ['Lots', '/lots'],
      ['Dépenses', '/depenses'],
      ['Soldes', '/soldes'],
    ]);
  });
});
