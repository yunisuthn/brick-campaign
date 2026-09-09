import { campaignResult } from './campaign-result.js';

describe('campaignResult', () => {
  const rates = { mouldingRate: 20, transportRate: 5, kilnLoadingRate: 3 };
  const nothing = {
    sales: [],
    expenses: [],
    productions: [],
    contractorWorks: [],
    payments: [],
    deliveries: [],
  };

  it('is all zeros for a campaign without entries', () => {
    expect(campaignResult(rates, nothing)).toEqual({
      revenue: 0,
      received: 0,
      outstanding: 0,
      expenses: {
        total: 0,
        byCategory: {
          rice_field: 0,
          akofa: 0,
          tai_charbon: 0,
          fuel: 0,
          repair: 0,
          food: 0,
          other: 0,
        },
      },
      labour: { moulding: 0, transport: 0, kilnLoading: 0, total: 0, paid: 0, outstanding: 0 },
      deliveryCosts: 0,
      result: 0,
    });
  });

  it('tells revenue, received and outstanding apart', () => {
    const result = campaignResult(rates, {
      ...nothing,
      sales: [
        { orderedQuantity: 5000, unitPrice: 250, amountReceived: 1_250_000 },
        { orderedQuantity: 10000, unitPrice: 240, amountReceived: null },
      ],
    });
    expect(result).toMatchObject({
      revenue: 3_650_000,
      received: 1_250_000,
      outstanding: 2_400_000,
    });
  });

  it('counts the labour owed, paid or not, so an advance moves the outstanding but not the result', () => {
    const entries = {
      ...nothing,
      sales: [{ orderedQuantity: 40000, unitPrice: 250, amountReceived: 10_000_000 }],
      expenses: [
        { category: 'akofa' as const, amount: 300_000 },
        { category: 'akofa' as const, amount: 20_000 },
        { category: 'rice_field' as const, amount: 500_000 },
      ],
      productions: [{ quantity: 30000 }, { quantity: 10000 }],
      contractorWorks: [
        { type: 'transport' as const, quantity: 40000 },
        { type: 'kiln_loading' as const, quantity: 40000 },
      ],
      deliveries: [{ cost: 60_000 }, { cost: 60_000 }],
    };
    const unpaid = campaignResult(rates, entries);
    expect(unpaid.expenses).toEqual({
      total: 820_000,
      byCategory: {
        rice_field: 500_000,
        akofa: 320_000,
        tai_charbon: 0,
        fuel: 0,
        repair: 0,
        food: 0,
        other: 0,
      },
    });
    expect(unpaid.labour).toEqual({
      moulding: 800_000,
      transport: 200_000,
      kilnLoading: 120_000,
      total: 1_120_000,
      paid: 0,
      outstanding: 1_120_000,
    });
    expect(unpaid.deliveryCosts).toBe(120_000);
    // 10 000 000 - 820 000 - 1 120 000 - 120 000
    expect(unpaid.result).toBe(7_940_000);

    const advanced = campaignResult(rates, { ...entries, payments: [{ amount: 400_000 }] });
    expect(advanced.labour).toMatchObject({ paid: 400_000, outstanding: 720_000 });
    expect(advanced.result).toBe(unpaid.result);
  });
});
