import { contractorBalance } from './contractor-balance.js';

describe('contractorBalance', () => {
  const rates = { kilnLoadingRate: 3 };

  it('is all zeros without entries', () => {
    expect(contractorBalance(rates, [], [])).toEqual({
      bricksByType: { transport: 0, kiln_loading: 0 },
      earned: 0,
      paid: 0,
      paidByType: { vatsy: 0, advance: 0, settlement: 0, fee: 0 },
      due: 0,
    });
  });

  it('applies each type at its own rate and subtracts every payment', () => {
    const result = contractorBalance(
      rates,
      [
        { type: 'transport', quantity: 40000, rate: 5 },
        { type: 'kiln_loading', quantity: 40000, rate: null },
        { type: 'transport', quantity: 10000, rate: 5 },
      ],
      [{ type: 'advance', amount: 100000 }],
    );
    expect(result).toEqual({
      bricksByType: { transport: 50000, kiln_loading: 40000 },
      earned: 370000,
      paid: 100000,
      paidByType: { vatsy: 0, advance: 100000, settlement: 0, fee: 0 },
      due: 270000,
    });
  });

  it('sums transport entries at different rates, since rice fields are not all as far', () => {
    const result = contractorBalance(
      rates,
      [
        { type: 'transport', quantity: 40000, rate: 5 },
        { type: 'transport', quantity: 10000, rate: 8 },
      ],
      [],
    );
    expect(result.earned).toBe(40000 * 5 + 10000 * 8);
  });
});

describe('contractorBalance with a rate not fixed', () => {
  it('is unknown when a transport entry has no rate yet', () => {
    const result = contractorBalance(
      { kilnLoadingRate: 3 },
      [{ type: 'transport', quantity: 40000, rate: null }],
      [{ type: 'advance', amount: 100000 }],
    );
    expect(result).toMatchObject({ earned: null, paid: 100000, due: null });
  });

  it('is unknown when the kiln loading rate is missing and there is work of that type', () => {
    const result = contractorBalance(
      { kilnLoadingRate: null },
      [{ type: 'kiln_loading', quantity: 40000, rate: null }],
      [],
    );
    expect(result).toMatchObject({ earned: null, due: null });
  });

  it('is known when the missing rate is for a type without work', () => {
    const result = contractorBalance(
      { kilnLoadingRate: 3 },
      [{ type: 'kiln_loading', quantity: 40000, rate: null }],
      [],
    );
    expect(result).toMatchObject({ earned: 120000, due: 120000 });
  });
});
