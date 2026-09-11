import { rejectsWithCode } from '../../test/api-error.expect.js';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SalesService } from '../sales/sales.service.js';
import type { StockService } from '../stock/stock.service.js';
import { DeliveriesService } from './deliveries.service.js';

describe('DeliveriesService', () => {
  const campaignFindUnique = vi.fn();
  const saleFindFirst = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const aggregate = vi.fn();
  const firedStock = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    sale: { findFirst: saleFindFirst },
    delivery: { create, findFirst, update, aggregate },
  } as unknown as PrismaService;
  const refs = new EntryReferences(prisma);
  const stock = { firedStock } as unknown as StockService;
  const service = new DeliveriesService(prisma, refs, new SalesService(prisma, refs), stock);

  const campaignId = 'campaign-id';
  const saleId = 'sale-id';
  const sale = {
    id: saleId,
    campaignId,
    clientId: 'client-id',
    date: new Date('2026-08-01T00:00:00Z'),
    orderedQuantity: 5000,
    unitPrice: 250,
    paidOn: null,
    amountReceived: null,
  };
  const input = { date: '2026-08-05', quantity: 2500, cost: 60000, plate: null };
  const row = {
    id: 'delivery-id',
    saleId,
    date: new Date('2026-08-05T00:00:00Z'),
    quantity: 2500,
    cost: 60000,
    plate: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    saleFindFirst.mockResolvedValue(sale);
    aggregate.mockResolvedValue({ _sum: { quantity: null } });
    firedStock.mockResolvedValue(40000);
  });

  describe('create', () => {
    it('stores the trip when the fired stock covers it', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, saleId, input)).resolves.toEqual({
        id: 'delivery-id',
        saleId,
        ...input,
      });
      expect(firedStock).toHaveBeenCalledWith(campaignId, undefined);
    });

    it('refuses to deliver more than the fired stock, naming the available quantity', async () => {
      firedStock.mockResolvedValue(2499);
      await rejectsWithCode(service.create(campaignId, saleId, input), 'fired_stock_too_low', {
        available: 2499,
        quantity: 2500,
      });
      expect(create).not.toHaveBeenCalled();
    });

    it('rejects a trip before the sale date or outside the campaign', async () => {
      await rejectsWithCode(
        service.create(campaignId, saleId, { ...input, date: '2026-07-31' }),
        'delivery_before_sale',
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
    it('re-checks the stock without counting the trip itself when its quantity grows', async () => {
      findFirst.mockResolvedValue(row);
      firedStock.mockResolvedValue(3000);
      update.mockResolvedValue({ ...row, quantity: 3000 });
      await service.update(campaignId, saleId, 'delivery-id', { quantity: 3000 });
      expect(firedStock).toHaveBeenCalledWith(campaignId, 'delivery-id');
      await rejectsWithCode(
        service.update(campaignId, saleId, 'delivery-id', { quantity: 3001 }),
        'fired_stock_too_low',
      );
    });

    it('fixes the cost without touching the stock or the dates', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue({ ...row, cost: 65000 });
      await expect(
        service.update(campaignId, saleId, 'delivery-id', { cost: 65000 }),
      ).resolves.toMatchObject({ cost: 65000 });
      expect(firedStock).not.toHaveBeenCalled();
      expect(campaignFindUnique).not.toHaveBeenCalled();
    });

    it('throws 404 on a cancelled or unknown delivery', async () => {
      findFirst.mockResolvedValue(null);
      await rejectsWithCode(
        service.update(campaignId, saleId, 'delivery-id', { cost: 1 }),
        'delivery_not_found',
      );
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'delivery-id',
            saleId,
            cancelledAt: null,
            sale: { campaignId, cancelledAt: null },
          },
        }),
      );
    });
  });

  describe('cancel', () => {
    it('stamps cancelledAt instead of deleting', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.cancel(campaignId, saleId, 'delivery-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'delivery-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });
  });
});
