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
