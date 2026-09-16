import { saleStatus, saleTotal } from './sale.rules.js';

const sale = { orderedQuantity: 5000, unitPrice: 250 }; // 1 250 000 Ar

describe('saleTotal', () => {
  it('is the quantity ordered times the unit price', () => {
    expect(saleTotal(5000, 250)).toBe(1_250_000);
  });
});

describe('saleStatus', () => {
  it('is ordered until the trips cover the order', () => {
    expect(saleStatus({ ...sale, deliveredQuantity: 0, receivedAmount: 0 })).toBe('ordered');
    expect(saleStatus({ ...sale, deliveredQuantity: 4999, receivedAmount: 0 })).toBe('ordered');
  });

  it('is delivered once the trips reach the order, surplus included', () => {
    expect(saleStatus({ ...sale, deliveredQuantity: 5000, receivedAmount: 0 })).toBe('delivered');
    expect(saleStatus({ ...sale, deliveredQuantity: 5100, receivedAmount: 0 })).toBe('delivered');
  });

  it('is partially paid from the first instalment, delivered or not', () => {
    expect(saleStatus({ ...sale, deliveredQuantity: 0, receivedAmount: 1 })).toBe('partially_paid');
    expect(saleStatus({ ...sale, deliveredQuantity: 5000, receivedAmount: 1_249_999 })).toBe(
      'partially_paid',
    );
  });

  it('is paid once the instalments cover the total, delivered or not', () => {
    expect(saleStatus({ ...sale, deliveredQuantity: 0, receivedAmount: 1_250_000 })).toBe('paid');
    expect(saleStatus({ ...sale, deliveredQuantity: 5000, receivedAmount: 1_250_000 })).toBe(
      'paid',
    );
  });
});
