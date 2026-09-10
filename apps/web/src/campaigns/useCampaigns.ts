import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/** Mirror of the API's CampaignDto: dates as `YYYY-MM-DD`, rates in ariary per brick. */
export interface Campaign {
  id: string;
  year: number;
  startedOn: string;
  closedOn: string | null;
  mouldingRate: number;
  transportRate: number;
  kilnLoadingRate: number;
}

export const CAMPAIGNS_KEY = ['campaigns'] as const;

/** The API already sorts by year, newest first; the screen shows the list as it comes. */
export function useCampaigns() {
  return useQuery({ queryKey: CAMPAIGNS_KEY, queryFn: () => api.get<Campaign[]>('/campaigns') });
}
