import { stockLevels } from './stock.rules.js';

describe('stockLevels', () => {
  it('is all zeros without entries', () => {
    expect(stockLevels({ produced: 0, loaded: 0, unloaded: 0, delivered: 0 })).toEqual({
      raw: 0,
      inKiln: 0,
      fired: 0,
    });
  });

  it('moves bricks from raw to the kiln to fired, then out with deliveries', () => {
    expect(
      stockLevels({ produced: 130000, loaded: 85000, unloaded: 40000, delivered: 2500 }),
    ).toEqual({ raw: 45000, inKiln: 45000, fired: 37500 });
  });
});
