import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';

/** Ariary per brick: integer, zero allowed (a step can be unpaid in a given season). */
const rateSchema = z.int().nonnegative();

const campaignFields = z.object({
  year: z.int().min(2000).max(2100),
  startedOn: dateOnlySchema,
  closedOn: dateOnlySchema.nullable(),
  mouldingRate: rateSchema,
  transportRate: rateSchema,
  kilnLoadingRate: rateSchema,
});

/** A campaign is created open unless a closing date is given (past seasons entered after the fact). */
export const createCampaignSchema = campaignFields.extend({
  closedOn: campaignFields.shape.closedOn.default(null),
});

/**
 * Every field optional and no defaults: a field left out is left untouched, `closedOn: null` reopens.
 * An empty body is a mistake, not a no-op.
 */
export const updateCampaignSchema = campaignFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;

/** What the API returns; dates as `YYYY-MM-DD`. */
export interface CampaignDto {
  id: string;
  year: number;
  startedOn: string;
  closedOn: string | null;
  mouldingRate: number;
  transportRate: number;
  kilnLoadingRate: number;
}
