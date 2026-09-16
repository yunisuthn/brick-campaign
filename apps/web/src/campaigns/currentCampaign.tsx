import { createContext, type ReactNode, useContext, useState } from 'react';
import { type Campaign, useCampaigns } from './useCampaigns.js';

/**
 * Kept in localStorage, not sessionStorage: on a phone the tab is closed and reopened all the
 * time, and the campaign is the same for a whole season. Both accounts share the same campaigns,
 * so the choice survives a logout.
 */
const STORAGE_KEY = 'currentCampaignId';

function readChoice(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeChoice(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage refused (private mode, quota): the choice lasts for this page only.
  }
}

export interface CurrentCampaign {
  /** The chosen campaign, or a sensible default; null only when there is no campaign at all. */
  campaign: Campaign | null;
  /** Every campaign, for the selector; empty while loading. */
  campaigns: Campaign[];
  choose: (id: string) => void;
}

const CurrentCampaignContext = createContext<CurrentCampaign | null>(null);

/**
 * With no choice yet, or a stored id the API no longer knows, the newest open campaign stands
 * in, then the newest of all: the person should not have to choose when there is only one.
 */
export function CurrentCampaignProvider({ children }: { children: ReactNode }) {
  const [chosenId, setChosenId] = useState(readChoice);
  const campaigns = useCampaigns().data ?? [];
  const campaign =
    campaigns.find((c) => c.id === chosenId) ??
    campaigns.find((c) => c.closedOn === null) ??
    campaigns[0] ??
    null;

  const choose = (id: string) => {
    setChosenId(id);
    writeChoice(id);
  };

  return (
    <CurrentCampaignContext.Provider value={{ campaign, campaigns, choose }}>
      {children}
    </CurrentCampaignContext.Provider>
  );
}

export function useCurrentCampaign(): CurrentCampaign {
  const value = useContext(CurrentCampaignContext);
  if (!value) throw new Error('useCurrentCampaign needs a CurrentCampaignProvider above it');
  return value;
}
