import { moulderBalance } from './moulder-balance.js';

describe('moulderBalance', () => {
  it('is all zeros for a moulder with no entries', () => {
    expect(moulderBalance([], [])).toEqual({
      bricks: 0,
      earned: 0,
      paid: 0,
      paidByType: { vatsy: 0, advance: 0, settlement: 0, fee: 0 },
      due: 0,
    });
  });

  it('sums bricks, applies each entry’s own rate and subtracts every payment whatever its type', () => {
    const result = moulderBalance(
      [
        { quantity: 1000, rate: 20 },
        { quantity: 1500, rate: 20 },
      ],
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
      paidByType: { vatsy: 20000, advance: 15000, settlement: 0, fee: 0 },
      due: 15000,
    });
  });

  it('subtracts a fee the same as any other payment, even alone with no other payment', () => {
    const result = moulderBalance([{ quantity: 1000, rate: 20 }], [{ type: 'fee', amount: 5000 }]);
    expect(result.paidByType.fee).toBe(5000);
    expect(result.paid).toBe(5000);
    expect(result.due).toBe(15000);
  });

  it('sums entries at different rates, since rice fields are not all the same distance away', () => {
    const result = moulderBalance(
      [
        { quantity: 1000, rate: 20 },
        { quantity: 1500, rate: 28 },
      ],
      [],
    );
    expect(result.earned).toBe(1000 * 20 + 1500 * 28);
  });

  it('goes negative when payments exceed what was earned', () => {
    expect(
      moulderBalance([{ quantity: 100, rate: 20 }], [{ type: 'advance', amount: 5000 }]).due,
    ).toBe(-3000);
  });

  it('reaches zero once the settlement is paid', () => {
    const result = moulderBalance(
      [{ quantity: 2500, rate: 20 }],
      [
        { type: 'vatsy', amount: 20000 },
        { type: 'settlement', amount: 30000 },
      ],
    );
    expect(result.due).toBe(0);
  });
});

describe('moulderBalance with a rate not fixed', () => {
  it('knows the bricks and the payments but not what is earned or due', () => {
    expect(
      moulderBalance([{ quantity: 2500, rate: null }], [{ type: 'vatsy', amount: 10000 }]),
    ).toEqual({
      bricks: 2500,
      earned: null,
      paid: 10000,
      paidByType: { vatsy: 10000, advance: 0, settlement: 0, fee: 0 },
      due: null,
    });
  });

  it('owes nothing for no bricks, so an advance alone is a known negative due', () => {
    expect(moulderBalance([], [{ type: 'advance', amount: 5000 }])).toMatchObject({
      earned: 0,
      due: -5000,
    });
  });

  it('is unknown overall when only one of several entries has no rate yet', () => {
    expect(
      moulderBalance(
        [
          { quantity: 1000, rate: 20 },
          { quantity: 500, rate: null },
        ],
        [],
      ).earned,
    ).toBeNull();
  });
});
