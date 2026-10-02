import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/render.js';
import { ConfirmStrip } from './ConfirmStrip.js';
import { GroupHeader, ListCard, ListRow } from './ListCard.js';
import { initials } from './marks.js';
import { LoadingList, NoCampaign } from './states.js';

describe('ListCard and ListRow', () => {
  it('lists rows that each lead to their record, under a group heading', () => {
    renderWithProviders(
      <ListCard header={<GroupHeader title="Hier" aside="1 800 briques" />}>
        <ListRow to="/productions/p1" title="Rakoto" subtitle="Ambany" figure="1 800 briques" />
      </ListCard>,
    );
    expect(screen.getByRole('heading', { name: 'Hier' })).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('RakotoAmbany1 800 briques');
    expect(screen.getByRole('link', { name: /Rakoto/ })).toHaveAttribute('href', '/productions/p1');
  });
});

describe('ConfirmStrip', () => {
  it('confirms or keeps, each by its own button', async () => {
    const onConfirm = vi.fn();
    const onKeep = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ConfirmStrip
        confirmLabel="Confirmer la suppression"
        keepLabel="Garder"
        onConfirm={onConfirm}
        onKeep={onKeep}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Garder' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la suppression' }));
    expect(onKeep).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe('states', () => {
  it('says it is loading to a screen reader while showing grey rows', () => {
    renderWithProviders(<LoadingList />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…');
  });

  it('leads to the first campaign when there is none', () => {
    renderWithProviders(<NoCampaign suffix="productions.noCampaignSuffix" />);
    expect(screen.getByRole('link', { name: 'créez la première' })).toHaveAttribute(
      'href',
      '/campagnes/nouvelle',
    );
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Rakoto Jean')).toBe('RJ');
    expect(initials('Rado')).toBe('R');
    expect(initials('  ')).toBe('?');
  });
});
