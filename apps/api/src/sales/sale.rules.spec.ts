import { saleStatus, saleTotal } from './sale.rules.js';

describe('saleTotal', () => {
  it('is the quantity ordered times the unit price', () => {
    expect(saleTotal(5000, 250)).toBe(1_250_000);
  });
});

describe('saleStatus', () => {
  it('is ordered until the trips cover the order', () => {
    expect(saleStatus({ orderedQuantity: 5000, deliveredQuantity: 0, paid: false })).toBe(
      'ordered',
    );
    expect(saleStatus({ orderedQuantity: 5000, deliveredQuantity: 4999, paid: false })).toBe(
      'ordered',
    );
  });

  it('is delivered once the trips reach the order, surplus included', () => {
    expect(saleStatus({ orderedQuantity: 5000, deliveredQuantity: 5000, paid: false })).toBe(
      'delivered',
    );
    expect(saleStatus({ orderedQuantity: 5000, deliveredQuantity: 5100, paid: false })).toBe(
      'delivered',
    );
  });

  it('is paid as soon as a payment is recorded, delivered or not', () => {
    expect(saleStatus({ orderedQuantity: 5000, deliveredQuantity: 5000, paid: true })).toBe('paid');
    expect(saleStatus({ orderedQuantity: 5000, deliveredQuantity: 0, paid: true })).toBe('paid');
  });
});
