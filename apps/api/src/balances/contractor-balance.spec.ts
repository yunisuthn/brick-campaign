import { contractorBalance } from './contractor-balance.js';

describe('contractorBalance', () => {
  const rates = { transportRate: 5, kilnLoadingRate: 3 };

  it('is all zeros without entries', () => {
    expect(contractorBalance(rates, [], [])).toEqual({
      bricksByType: { transport: 0, kiln_loading: 0 },
      earned: 0,
      paid: 0,
      paidByType: { vatsy: 0, advance: 0, settlement: 0 },
      due: 0,
    });
  });

  it('applies each type at its own rate and subtracts every payment', () => {
    const result = contractorBalance(
      rates,
      [
        { type: 'transport', quantity: 40000 },
        { type: 'kiln_loading', quantity: 40000 },
        { type: 'transport', quantity: 10000 },
      ],
      [{ type: 'advance', amount: 100000 }],
    );
    expect(result).toEqual({
      bricksByType: { transport: 50000, kiln_loading: 40000 },
      earned: 370000,
      paid: 100000,
      paidByType: { vatsy: 0, advance: 100000, settlement: 0 },
      due: 270000,
    });
  });
});
