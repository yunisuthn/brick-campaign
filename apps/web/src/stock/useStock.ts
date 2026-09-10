import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/** Mirror of the API's StockDto. Nothing is stored: every figure is a sum over the live entries. */
export interface Stock {
  campaignId: string;
  produced: number;
  loaded: number;
  unloaded: number;
  delivered: number;
  /** produced - loaded. */
  raw: number;
  /** loaded - unloaded. */
  inKiln: number;
  /** unloaded - delivered. */
  fired: number;
}

export const STOCK_KEY = ['stock'] as const;

export function useStock(campaignId: string) {
  return useQuery({
    queryKey: [...STOCK_KEY, campaignId] as const,
    queryFn: () => api.get<Stock>(`/campaigns/${campaignId}/stock`),
  });
}
