import { kilnBatchCost, NO_COST } from './kiln-batch-cost.js';

describe('kilnBatchCost', () => {
  const rates = { transportRate: 5, kilnLoadingRate: 3 };

  it('is all zeros without anything linked', () => {
    expect(kilnBatchCost(rates, [], [])).toEqual(NO_COST);
  });

  it('adds the linked expenses to each work type at its own rate', () => {
    expect(
      kilnBatchCost(
        rates,
        [{ amount: 300000 }, { amount: 20000 }],
        [
          { type: 'transport', quantity: 40000 },
          { type: 'kiln_loading', quantity: 40000 },
          { type: 'transport', quantity: 10000 },
        ],
      ),
    ).toEqual({ expenses: 320000, labour: 370000, total: 690000 });
  });
});

describe('kilnBatchCost with a rate not fixed', () => {
  it('keeps the expenses known and makes the labour and the total unknown', () => {
    expect(
      kilnBatchCost(
        { transportRate: 5, kilnLoadingRate: null },
        [{ amount: 320000 }],
        [
          { type: 'transport', quantity: 40000 },
          { type: 'kiln_loading', quantity: 40000 },
        ],
      ),
    ).toEqual({ expenses: 320000, labour: null, total: null });
  });

  it('ignores a missing rate for a type the batch has no work of', () => {
    expect(
      kilnBatchCost(
        { transportRate: 5, kilnLoadingRate: null },
        [],
        [{ type: 'transport', quantity: 40000 }],
      ),
    ).toEqual({ expenses: 0, labour: 200000, total: 200000 });
  });
});
