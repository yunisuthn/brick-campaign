import { rejectsWithCode } from '../../test/api-error.expect.js';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SalesService } from '../sales/sales.service.js';
import { SalePaymentsService } from './sale-payments.service.js';

describe('SalePaymentsService', () => {
  const campaignFindUnique = vi.fn();
  const saleFindFirst = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const update = vi.fn();
  const aggregate = vi.fn();
  const deliveryAggregate = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    sale: { findFirst: saleFindFirst },
    salePayment: { create, findFirst, findMany, update, aggregate },
    delivery: { aggregate: deliveryAggregate },
  } as unknown as PrismaService;
  const refs = new EntryReferences(prisma);
  const service = new SalePaymentsService(prisma, refs, new SalesService(prisma, refs));

  const campaignId = 'campaign-id';
  const saleId = 'sale-id';
  // 5 000 bricks at 250 Ar: the sale is worth 1 250 000 Ar.
  const sale = {
    id: saleId,
    campaignId,
    clientId: 'client-id',
    date: new Date('2026-08-01T00:00:00Z'),
    orderedQuantity: 5000,
    unitPrice: 250,
  };
  const input = { date: '2026-08-05', amount: 500_000 };
  const row = { id: 'payment-id', saleId, date: new Date('2026-08-05T00:00:00Z'), amount: 500_000 };

  /** How much the sale has already taken in, before the instalment under test. */
  function alreadyReceived(amount: number | null): void {
    aggregate.mockResolvedValue({ _sum: { amount } });
  }

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    saleFindFirst.mockResolvedValue(sale);
    deliveryAggregate.mockResolvedValue({ _sum: { quantity: null } });
    alreadyReceived(null);
  });

  describe('create', () => {
    it('stores the instalment against the sale', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, saleId, input)).resolves.toEqual({
        id: 'payment-id',
        saleId,
        date: '2026-08-05',
        amount: 500_000,
      });
    });

    it('takes an instalment that settles exactly what is left', async () => {
      alreadyReceived(1_000_000);
      create.mockResolvedValue({ ...row, amount: 250_000 });
      await expect(
        service.create(campaignId, saleId, { ...input, amount: 250_000 }),
      ).resolves.toMatchObject({ amount: 250_000 });
    });

    it('refuses to take more than the sale is worth, naming what is left', async () => {
      alreadyReceived(1_000_000);
      await rejectsWithCode(
        service.create(campaignId, saleId, { ...input, amount: 250_001 }),
        'sale_overpaid',
        { remaining: 250_000, amount: 250_001 },
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('rejects an instalment before the sale or outside the campaign', async () => {
      await rejectsWithCode(
        service.create(campaignId, saleId, { ...input, date: '2026-07-31' }),
        'sale_payment_before_sale',
      );
      saleFindFirst.mockResolvedValue({ ...sale, date: new Date('2026-04-01T00:00:00Z') });
      await rejectsWithCode(
        service.create(campaignId, saleId, { ...input, date: '2026-04-30' }),
        'date_outside_campaign',
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('throws 404 when the sale is unknown, cancelled or in another campaign', async () => {
      saleFindFirst.mockResolvedValue(null);
      await rejectsWithCode(service.create(campaignId, saleId, input), 'sale_not_found');
    });
  });

  describe('update', () => {
    it('weighs a raised amount against what is left, this instalment aside', async () => {
      findFirst.mockResolvedValue(row);
      alreadyReceived(1_250_000); // 500 000 of it is the instalment being corrected
      update.mockResolvedValue({ ...row, amount: 500_001 });
      await rejectsWithCode(
        service.update(campaignId, saleId, 'payment-id', { amount: 500_001 }),
        'sale_overpaid',
        { remaining: 500_000, amount: 500_001 },
      );
      await expect(
        service.update(campaignId, saleId, 'payment-id', { amount: 500_000 }),
      ).resolves.toMatchObject({ amount: 500_001 });
    });

    it('throws 404 on a cancelled or unknown instalment', async () => {
      findFirst.mockResolvedValue(null);
      await rejectsWithCode(
        service.update(campaignId, saleId, 'payment-id', { amount: 1 }),
        'sale_payment_not_found',
      );
    });
  });

  describe('cancel', () => {
    it('stamps cancelledAt instead of deleting', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.cancel(campaignId, saleId, 'payment-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });
  });
});
