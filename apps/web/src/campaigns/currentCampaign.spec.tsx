import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import {
  type CurrentCampaign,
  CurrentCampaignProvider,
  useCurrentCampaign,
} from './currentCampaign.js';

const base = { startedOn: '2026-05-10', mouldingRates: [40], transportRates: [10], kilnLoadingRate: 5 };
const closed2026 = { ...base, id: 'c3', year: 2026, closedOn: '2026-11-30' };
const open2025 = { ...base, id: 'c2', year: 2025, closedOn: null };
const closed2024 = { ...base, id: 'c1', year: 2024, closedOn: '2024-11-30' };

let current: CurrentCampaign;
function Probe() {
  current = useCurrentCampaign();
  return <p>{current.campaign ? `Courante : ${current.campaign.year}` : 'Aucune'}</p>;
}

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <Probe />
    </CurrentCampaignProvider>,
  );
}

describe('CurrentCampaignProvider', () => {
  it('defaults to the newest open campaign when nothing was chosen', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([closed2026, open2025, closed2024])),
    );
    mount();
    expect(await screen.findByText('Courante : 2025')).toBeInTheDocument();
  });

  it('falls back to the newest campaign when all are closed', async () => {
    server.use(http.get('/api/campaigns', () => HttpResponse.json([closed2026, closed2024])));
    mount();
    expect(await screen.findByText('Courante : 2026')).toBeInTheDocument();
  });

  it('keeps the chosen campaign in localStorage and reads it back', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([closed2026, open2025, closed2024])),
    );
    mount();
    await screen.findByText('Courante : 2025');

    act(() => current.choose('c1'));
    expect(screen.getByText('Courante : 2024')).toBeInTheDocument();
    expect(localStorage.getItem('currentCampaignId')).toBe('c1');

    localStorage.setItem('currentCampaignId', 'c3');
    mount();
    expect(await screen.findByText('Courante : 2026')).toBeInTheDocument();
  });

  it('ignores a stored id the API no longer knows', async () => {
    localStorage.setItem('currentCampaignId', 'gone');
    server.use(http.get('/api/campaigns', () => HttpResponse.json([open2025])));
    mount();
    expect(await screen.findByText('Courante : 2025')).toBeInTheDocument();
  });

  it('has no campaign when the API has none', async () => {
    server.use(http.get('/api/campaigns', () => HttpResponse.json([])));
    mount();
    expect(await screen.findByText('Aucune')).toBeInTheDocument();
  });
});
