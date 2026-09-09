import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SalesService } from './sales.service.js';

describe('SalesService', () => {
  const campaignFindUnique = vi.fn();
  const clientFindUnique = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    client: { findUnique: clientFindUnique },
    sale: { create, findFirst, update },
  } as unknown as PrismaService;
  const service = new SalesService(prisma, new EntryReferences(prisma));

  const campaignId = 'campaign-id';
  const clientId = 'client-id';
  const input = {
    clientId,
    date: '2026-08-01',
    orderedQuantity: 5000,
    unitPrice: 250,
    payment: null,
  };
  const row = {
    id: 'sale-id',
    campaignId,
    clientId,
    date: new Date('2026-08-01T00:00:00Z'),
    orderedQuantity: 5000,
    unitPrice: 250,
    paidOn: null,
    amountReceived: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    clientFindUnique.mockResolvedValue({ id: clientId });
  });

  describe('create', () => {
    it('stores the sale unpaid and maps the two payment columns to one nullable object', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, input)).resolves.toEqual({
        id: 'sale-id',
        campaignId,
        ...input,
      });
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paidOn: null, amountReceived: null }),
        }),
      );
    });

    it('rejects a date outside the campaign, an unknown client and a payment before the sale', async () => {
      await expect(
        service.create(campaignId, { ...input, date: '2026-04-30' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      clientFindUnique.mockResolvedValueOnce(null);
      await expect(service.create(campaignId, input)).rejects.toThrow('Unknown client');
      await expect(
        service.create(campaignId, {
          ...input,
          payment: { paidOn: '2026-07-31', amountReceived: 1_250_000 },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('records the payment from payment alone, checked against the stored sale date', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue({
        ...row,
        paidOn: new Date('2026-08-20T00:00:00Z'),
        amountReceived: 1_250_000,
      });
      const payment = { paidOn: '2026-08-20', amountReceived: 1_250_000 };
      await expect(service.update(campaignId, 'sale-id', { payment })).resolves.toMatchObject({
        payment,
      });
      expect(clientFindUnique).not.toHaveBeenCalled();
      await expect(
        service.update(campaignId, 'sale-id', {
          payment: { paidOn: '2026-07-31', amountReceived: 1_250_000 },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('takes a payment back with payment: null', async () => {
      findFirst.mockResolvedValue({
        ...row,
        paidOn: new Date('2026-08-20T00:00:00Z'),
        amountReceived: 1_250_000,
      });
      update.mockResolvedValue(row);
      await expect(service.update(campaignId, 'sale-id', { payment: null })).resolves.toMatchObject(
        { payment: null },
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paidOn: null, amountReceived: null }),
        }),
      );
    });

    it('throws 404 on a cancelled or unknown sale', async () => {
      findFirst.mockResolvedValue(null);
      await expect(
        service.update(campaignId, 'sale-id', { unitPrice: 260 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('stamps cancelledAt instead of deleting', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.cancel(campaignId, 'sale-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'sale-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });
  });
});
