import { createCampaignSchema, updateCampaignSchema } from './campaign.dto.js';

const valid = {
  year: 2026,
  startedOn: '2026-05-01',
  mouldingRates: [20, 28],
  transportRates: [5, 8],
  kilnLoadingRate: 5,
};

describe('createCampaignSchema', () => {
  it('accepts a minimal body and defaults closedOn to null', () => {
    expect(createCampaignSchema.parse(valid)).toEqual({ ...valid, closedOn: null });
  });

  it('lets the price lists and the kiln loading rate be left out: to be fixed once negotiated', () => {
    const { year, startedOn } = valid;
    expect(createCampaignSchema.parse({ year, startedOn, transportRates: [] })).toEqual({
      year,
      startedOn,
      closedOn: null,
      mouldingRates: [],
      transportRates: [],
      kilnLoadingRate: null,
    });
  });

  it.each([
    ['a year outside the range', { year: 1999 }],
    ['a date with a time part', { startedOn: '2026-05-01T00:00:00Z' }],
    ['an invalid calendar date', { startedOn: '2026-13-01' }],
    ['a negative price in the moulding list', { mouldingRates: [-1] }],
    ['a fractional price in the transport list', { transportRates: [2.5] }],
    ['a negative kiln loading rate', { kilnLoadingRate: -1 }],
  ])('rejects %s', (_label, override) => {
    expect(createCampaignSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updateCampaignSchema', () => {
  it('accepts a single field and lets closedOn be null', () => {
    expect(updateCampaignSchema.parse({ closedOn: null })).toEqual({ closedOn: null });
  });

  it('leaves out closedOn when only a price list is sent, so a patch never reopens by accident', () => {
    expect(updateCampaignSchema.parse({ mouldingRates: [25] })).toEqual({ mouldingRates: [25] });
  });

  it('rejects an empty body', () => {
    expect(updateCampaignSchema.safeParse({}).success).toBe(false);
  });

  it('lets a price list go back to empty, but never hold a negative or fractional value', () => {
    expect(updateCampaignSchema.parse({ mouldingRates: [] })).toEqual({ mouldingRates: [] });
    expect(updateCampaignSchema.safeParse({ mouldingRates: [-1] }).success).toBe(false);
    expect(updateCampaignSchema.safeParse({ transportRates: [2.5] }).success).toBe(false);
  });

  it('lets the kiln loading rate go back to null, but never to a negative or fractional value', () => {
    expect(updateCampaignSchema.parse({ kilnLoadingRate: null })).toEqual({
      kilnLoadingRate: null,
    });
    expect(updateCampaignSchema.safeParse({ kilnLoadingRate: -1 }).success).toBe(false);
    expect(updateCampaignSchema.safeParse({ kilnLoadingRate: 2.5 }).success).toBe(false);
  });
});
