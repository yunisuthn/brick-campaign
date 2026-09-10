import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/** Ariary per brick, null while the price is not negotiated yet ("à fixer"). */
export interface CampaignRates {
  mouldingRate: number | null;
  transportRate: number | null;
  kilnLoadingRate: number | null;
}

/** Mirror of the API's CampaignDto: dates as `YYYY-MM-DD`. */
export interface Campaign extends CampaignRates {
  id: string;
  year: number;
  startedOn: string;
  closedOn: string | null;
}

/** A campaign is created open: the API defaults `closedOn` to null when it is left out. */
export type NewCampaign = Omit<Campaign, 'id' | 'closedOn'>;

/** What a PATCH may carry: any field but the id, the rest is left untouched. */
export type CampaignPatch = Partial<Omit<Campaign, 'id'>>;

/** Prefix of every campaign query: invalidating it refreshes the list and each detail alike. */
export const CAMPAIGNS_KEY = ['campaigns'] as const;
const campaignKey = (id: string) => [...CAMPAIGNS_KEY, id] as const;

/** The API already sorts by year, newest first; the screen shows the list as it comes. */
export function useCampaigns() {
  return useQuery({ queryKey: CAMPAIGNS_KEY, queryFn: () => api.get<Campaign[]>('/campaigns') });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKey(id),
    queryFn: () => api.get<Campaign>(`/campaigns/${id}`),
  });
}

/** The answer seeds the detail cache, so the page shown next does not fetch what it already has. */
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCampaign) => api.post<Campaign>('/campaigns', input),
    onSuccess: (campaign) => {
      queryClient.setQueryData(campaignKey(campaign.id), campaign);
      return queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY, exact: true });
    },
  });
}

/** Closing and fixing the rates both go through here: the answer replaces the detail at once, the list is refreshed behind it. */
export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: CampaignPatch) => api.patch<Campaign>(`/campaigns/${id}`, patch),
    onSuccess: (campaign) => {
      queryClient.setQueryData(campaignKey(id), campaign);
      return queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY, exact: true });
    },
  });
}
