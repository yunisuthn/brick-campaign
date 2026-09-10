import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

/** A campaign is created open: the API defaults `closedOn` to null when it is left out. */
export type NewCampaign = Omit<Campaign, 'id' | 'closedOn'>;

export const CAMPAIGNS_KEY = ['campaigns'] as const;

/** The API already sorts by year, newest first; the screen shows the list as it comes. */
export function useCampaigns() {
  return useQuery({ queryKey: CAMPAIGNS_KEY, queryFn: () => api.get<Campaign[]>('/campaigns') });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCampaign) => api.post<Campaign>('/campaigns', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}
