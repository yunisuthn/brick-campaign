import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ProductionsService } from './productions.service.js';

describe('ProductionsService', () => {
  const campaignFindUnique = vi.fn();
  const moulderFindUnique = vi.fn();
  const riceFieldFindUnique = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    moulder: { findUnique: moulderFindUnique },
    riceField: { findUnique: riceFieldFindUnique },
    production: { create, findFirst, update },
  } as unknown as PrismaService;
  // Real reference checks over the mocked client: the service is tested with the checks it ships with.
  const service = new ProductionsService(prisma, new EntryReferences(prisma));

  const campaignId = 'campaign-id';
  const input = {
    date: '2026-06-10',
    moulderId: 'moulder-id',
    riceFieldId: 'rice-field-id',
    quantity: 1500,
  };
  const row = { id: 'production-id', campaignId, ...input, date: new Date('2026-06-10T00:00:00Z') };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    moulderFindUnique.mockResolvedValue({ active: true });
    riceFieldFindUnique.mockResolvedValue({ id: input.riceFieldId });
  });

  describe('create', () => {
    it('stores the entry with the campaign id and returns the date as YYYY-MM-DD', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, input)).resolves.toEqual({
        id: 'production-id',
        campaignId,
        ...input,
      });
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ...input, campaignId, date: new Date('2026-06-10T00:00:00Z') },
        }),
      );
    });

    it('throws 404 when the campaign does not exist', async () => {
      campaignFindUnique.mockResolvedValue(null);
      await expect(service.create('missing', input)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('checks the date, the moulder and the rice field before writing', async () => {
      await expect(
        service.create(campaignId, { ...input, date: '2026-04-30' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      moulderFindUnique.mockResolvedValue({ active: false });
      await expect(service.create(campaignId, input)).rejects.toBeInstanceOf(BadRequestException);
      moulderFindUnique.mockResolvedValue({ active: true });
      riceFieldFindUnique.mockResolvedValue(null);
      await expect(service.create(campaignId, input)).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('looks up within the campaign and ignores cancelled entries', async () => {
      findFirst.mockResolvedValue(null);
      await expect(service.findOne(campaignId, 'production-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'production-id', campaignId, cancelledAt: null },
        }),
      );
    });
  });

  describe('update', () => {
    it('only checks what changes: a quantity fix touches neither moulder nor rice field', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue({ ...row, quantity: 1600 });
      await expect(
        service.update(campaignId, 'production-id', { quantity: 1600 }),
      ).resolves.toMatchObject({ quantity: 1600 });
      expect(moulderFindUnique).not.toHaveBeenCalled();
      expect(riceFieldFindUnique).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: 1600, date: undefined } }),
      );
    });

    it('re-checks the campaign window when the date changes', async () => {
      findFirst.mockResolvedValue(row);
      await expect(
        service.update(campaignId, 'production-id', { date: '2026-04-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('stamps cancelledAt instead of deleting', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.cancel(campaignId, 'production-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'production-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });

    it('throws 404 on an already cancelled entry', async () => {
      findFirst.mockResolvedValue(null);
      await expect(service.cancel(campaignId, 'production-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(update).not.toHaveBeenCalled();
    });
  });
});
