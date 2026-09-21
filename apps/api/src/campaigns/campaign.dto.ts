import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';

/**
 * Ariary per brick: integer, zero allowed (a step can be unpaid in a given season), null while
 * the price is not negotiated yet (reference document, section 3, "tarif à fixer").
 */
const rateSchema = z.int().nonnegative().nullable();

/**
 * The prices offered for moulding or transport this season: one is picked per entry, since rice
 * fields worked are not all the same distance away. Empty until at least one is fixed.
 */
const rateListSchema = z.array(z.int().nonnegative());

const campaignFields = z.object({
  year: z.int().min(2000).max(2100),
  /** A year can hold more than one campaign — tranche 1, 2, 3… — unique together with the year. */
  tranche: z.int().min(1),
  startedOn: dateOnlySchema,
  closedOn: dateOnlySchema.nullable(),
  mouldingRates: rateListSchema,
  transportRates: rateListSchema,
  kilnLoadingRate: rateSchema,
});

/**
 * A campaign is created open unless a closing date is given (past seasons entered after the
 * fact), and a rate left out is to be fixed later.
 */
export const createCampaignSchema = campaignFields.extend({
  closedOn: campaignFields.shape.closedOn.default(null),
  mouldingRates: rateListSchema.default([]),
  transportRates: rateListSchema.default([]),
  kilnLoadingRate: rateSchema.default(null),
});

/**
 * Every field optional and no defaults: a field left out is left untouched, `closedOn: null`
 * reopens, a rate set to null goes back to "to be fixed". An empty body is a mistake, not a no-op.
 */
export const updateCampaignSchema = campaignFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;

/** What the API returns; dates as `YYYY-MM-DD`, rates null/empty while not fixed. */
export interface CampaignDto {
  id: string;
  year: number;
  tranche: number;
  startedOn: string;
  closedOn: string | null;
  mouldingRates: number[];
  transportRates: number[];
  kilnLoadingRate: number | null;
}
