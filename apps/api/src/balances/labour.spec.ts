import { labourCost, sumKnown } from './labour.js';

describe('labourCost', () => {
  it('multiplies the quantity by the rate', () => {
    expect(labourCost(2500, 20)).toBe(50000);
  });

  it('is unknown while the rate is not fixed and there is something to pay for', () => {
    expect(labourCost(2500, null)).toBeNull();
  });

  it('is zero for nothing to pay for, whatever the rate', () => {
    expect(labourCost(0, null)).toBe(0);
    expect(labourCost(0, 20)).toBe(0);
  });
});

describe('sumKnown', () => {
  it('adds known parts', () => {
    expect(sumKnown([1, 2, 3])).toBe(6);
    expect(sumKnown([])).toBe(0);
  });

  it('is unknown as soon as one part is', () => {
    expect(sumKnown([1, null, 3])).toBeNull();
  });
});
