import { isWithinCampaign } from './production.rules.js';

describe('isWithinCampaign', () => {
  const open = { startedOn: '2026-05-01', closedOn: null };
  const closed = { startedOn: '2026-05-01', closedOn: '2026-11-30' };

  it.each([
    ['the start day of an open campaign', open, '2026-05-01', true],
    ['any later day of an open campaign', open, '2027-01-15', true],
    ['the day before the start', open, '2026-04-30', false],
    ['the closing day of a closed campaign', closed, '2026-11-30', true],
    ['the day after the close', closed, '2026-12-01', false],
  ])('%s', (_label, campaign, date, expected) => {
    expect(isWithinCampaign(campaign, date)).toBe(expected);
  });
});
