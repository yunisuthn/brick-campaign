import { createCampaignSchema, updateCampaignSchema } from './campaign.dto.js';

const valid = {
  year: 2026,
  startedOn: '2026-05-01',
  mouldingRate: 20,
  transportRate: 5,
  kilnLoadingRate: 5,
};

describe('createCampaignSchema', () => {
  it('accepts a minimal body and defaults closedOn to null', () => {
    expect(createCampaignSchema.parse(valid)).toEqual({ ...valid, closedOn: null });
  });

  it('lets the rates be left out or null: to be fixed once negotiated', () => {
    const { year, startedOn } = valid;
    expect(createCampaignSchema.parse({ year, startedOn, transportRate: null })).toEqual({
      year,
      startedOn,
      closedOn: null,
      mouldingRate: null,
      transportRate: null,
      kilnLoadingRate: null,
    });
  });

  it.each([
    ['a year outside the range', { year: 1999 }],
    ['a date with a time part', { startedOn: '2026-05-01T00:00:00Z' }],
    ['an invalid calendar date', { startedOn: '2026-13-01' }],
    ['a negative rate', { mouldingRate: -1 }],
    ['a fractional rate', { transportRate: 2.5 }],
  ])('rejects %s', (_label, override) => {
    expect(createCampaignSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updateCampaignSchema', () => {
  it('accepts a single field and lets closedOn be null', () => {
    expect(updateCampaignSchema.parse({ closedOn: null })).toEqual({ closedOn: null });
  });

  it('leaves out closedOn when only a rate is sent, so a patch never reopens by accident', () => {
    expect(updateCampaignSchema.parse({ mouldingRate: 25 })).toEqual({ mouldingRate: 25 });
  });

  it('rejects an empty body', () => {
    expect(updateCampaignSchema.safeParse({}).success).toBe(false);
  });

  it('lets a rate go back to null, but never to a negative or fractional value', () => {
    expect(updateCampaignSchema.parse({ kilnLoadingRate: null })).toEqual({
      kilnLoadingRate: null,
    });
    expect(updateCampaignSchema.safeParse({ kilnLoadingRate: -1 }).success).toBe(false);
    expect(updateCampaignSchema.safeParse({ kilnLoadingRate: 2.5 }).success).toBe(false);
  });
});
