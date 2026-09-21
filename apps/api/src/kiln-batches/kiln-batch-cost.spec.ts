import { kilnBatchCost, NO_COST } from './kiln-batch-cost.js';

describe('kilnBatchCost', () => {
  const rates = { kilnLoadingRate: 3 };

  it('is all zeros without anything linked', () => {
    expect(kilnBatchCost(rates, [], [])).toEqual(NO_COST);
  });

  it('adds the linked expenses to transport at its own rate and kiln loading at the campaign rate', () => {
    expect(
      kilnBatchCost(
        rates,
        [{ amount: 300000 }, { amount: 20000 }],
        [
          { type: 'transport', quantity: 40000, rate: 5 },
          { type: 'kiln_loading', quantity: 40000, rate: null },
          { type: 'transport', quantity: 10000, rate: 5 },
        ],
      ),
    ).toEqual({ expenses: 320000, labour: 370000, total: 690000 });
  });
});

describe('kilnBatchCost with a rate not fixed', () => {
  it('keeps the expenses known and makes the labour and the total unknown when a transport entry has no rate', () => {
    expect(
      kilnBatchCost(
        { kilnLoadingRate: 3 },
        [{ amount: 320000 }],
        [
          { type: 'transport', quantity: 40000, rate: null },
          { type: 'kiln_loading', quantity: 40000, rate: null },
        ],
      ),
    ).toEqual({ expenses: 320000, labour: null, total: null });
  });

  it('ignores a missing kiln loading rate for a batch with no kiln loading work', () => {
    expect(
      kilnBatchCost(
        { kilnLoadingRate: null },
        [],
        [{ type: 'transport', quantity: 40000, rate: 5 }],
      ),
    ).toEqual({ expenses: 0, labour: 200000, total: 200000 });
  });
});
