import { moulderBalance } from './moulder-balance.js';

describe('moulderBalance', () => {
  it('is all zeros for a moulder with no entries', () => {
    expect(moulderBalance(20, [], [])).toEqual({
      bricks: 0,
      earned: 0,
      paid: 0,
      paidByType: { vatsy: 0, advance: 0, settlement: 0 },
      due: 0,
    });
  });

  it('sums bricks, applies the rate and subtracts every payment whatever its type', () => {
    const result = moulderBalance(
      20,
      [{ quantity: 1000 }, { quantity: 1500 }],
      [
        { type: 'vatsy', amount: 10000 },
        { type: 'vatsy', amount: 10000 },
        { type: 'advance', amount: 15000 },
      ],
    );
    expect(result).toEqual({
      bricks: 2500,
      earned: 50000,
      paid: 35000,
      paidByType: { vatsy: 20000, advance: 15000, settlement: 0 },
      due: 15000,
    });
  });

  it('goes negative when payments exceed what was earned', () => {
    expect(moulderBalance(20, [{ quantity: 100 }], [{ type: 'advance', amount: 5000 }]).due).toBe(
      -3000,
    );
  });

  it('reaches zero once the settlement is paid', () => {
    const result = moulderBalance(
      20,
      [{ quantity: 2500 }],
      [
        { type: 'vatsy', amount: 20000 },
        { type: 'settlement', amount: 30000 },
      ],
    );
    expect(result.due).toBe(0);
  });
});
