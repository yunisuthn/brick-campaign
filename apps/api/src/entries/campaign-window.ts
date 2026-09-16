/** The part of a campaign an entry date is checked against. `YYYY-MM-DD` strings compare as text. */
export interface CampaignWindow {
  startedOn: string;
  closedOn: string | null;
}

/** An entry belongs to a campaign only if dated inside it: never before the start, never after the close. */
export function isWithinCampaign(campaign: CampaignWindow, date: string): boolean {
  if (date < campaign.startedOn) return false;
  return campaign.closedOn === null || date <= campaign.closedOn;
}
