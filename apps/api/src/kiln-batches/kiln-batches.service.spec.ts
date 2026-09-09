import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { StockService } from '../stock/stock.service.js';
import { KilnBatchesService } from './kiln-batches.service.js';

describe('KilnBatchesService', () => {
  const campaignFindUnique = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const rawStock = vi.fn();
  const contractorWorkCount = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    kilnBatch: { create, findFirst, update },
    contractorWork: { count: contractorWorkCount },
  } as unknown as PrismaService;
  const stock = { rawStock } as unknown as StockService;
  const service = new KilnBatchesService(prisma, new EntryReferences(prisma), stock);

  const campaignId = 'campaign-id';
  const input = { loadedOn: '2026-07-01', unloadedOn: null, quantity: 40000 };
  const row = {
    id: 'batch-id',
    campaignId,
    loadedOn: new Date('2026-07-01T00:00:00Z'),
    unloadedOn: null,
    quantity: 40000,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    rawStock.mockResolvedValue(50000);
  });

  describe('create', () => {
    it('stores the batch when the raw stock covers it', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, input)).resolves.toEqual({
        id: 'batch-id',
        campaignId,
        ...input,
      });
      expect(rawStock).toHaveBeenCalledWith(campaignId, undefined);
    });

    it('refuses to load more than the raw stock, naming the available quantity', async () => {
      rawStock.mockResolvedValue(39999);
      await expect(service.create(campaignId, input)).rejects.toThrow('Only 39999 raw bricks');
      expect(create).not.toHaveBeenCalled();
    });

    it('rejects a loading date outside the campaign and an unloading before loading', async () => {
      await expect(
        service.create(campaignId, { ...input, loadedOn: '2026-04-30' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.create(campaignId, { ...input, unloadedOn: '2026-06-30' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('unloads a batch from unloadedOn alone, checked against the stored loading date', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue({ ...row, unloadedOn: new Date('2026-07-10T00:00:00Z') });
      await expect(
        service.update(campaignId, 'batch-id', { unloadedOn: '2026-07-10' }),
      ).resolves.toMatchObject({ unloadedOn: '2026-07-10' });
      expect(rawStock).not.toHaveBeenCalled();
      await expect(
        service.update(campaignId, 'batch-id', { unloadedOn: '2026-06-30' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('re-checks the stock without counting the batch itself when its quantity grows', async () => {
      findFirst.mockResolvedValue(row);
      rawStock.mockResolvedValue(45000);
      update.mockResolvedValue({ ...row, quantity: 45000 });
      await service.update(campaignId, 'batch-id', { quantity: 45000 });
      expect(rawStock).toHaveBeenCalledWith(campaignId, 'batch-id');
      await expect(
        service.update(campaignId, 'batch-id', { quantity: 45001 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws 404 on a cancelled or unknown batch', async () => {
      findFirst.mockResolvedValue(null);
      await expect(
        service.update(campaignId, 'batch-id', { quantity: 40000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('stamps cancelledAt instead of deleting', async () => {
      findFirst.mockResolvedValue(row);
      contractorWorkCount.mockResolvedValue(0);
      update.mockResolvedValue(row);
      await service.cancel(campaignId, 'batch-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'batch-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });

    it('refuses with 409 while live contractor works point at the batch', async () => {
      findFirst.mockResolvedValue(row);
      contractorWorkCount.mockResolvedValue(2);
      await expect(service.cancel(campaignId, 'batch-id')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(update).not.toHaveBeenCalled();
    });
  });
});
