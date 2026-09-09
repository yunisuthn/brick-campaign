import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CampaignsService } from './campaigns.service.js';

describe('CampaignsService', () => {
  const create = vi.fn();
  const findUnique = vi.fn();
  const update = vi.fn();
  const prisma = { campaign: { create, findUnique, update } } as unknown as PrismaService;
  const service = new CampaignsService(prisma);

  const input = {
    year: 2026,
    startedOn: '2026-05-01',
    closedOn: null,
    mouldingRate: 20,
    transportRate: 5,
    kilnLoadingRate: 5,
  };
  const row = {
    id: 'campaign-id',
    ...input,
    startedOn: new Date('2026-05-01T00:00:00.000Z'),
    closedOn: null,
  };
  const uniqueViolation = new Prisma.PrismaClientKnownRequestError('duplicate', {
    code: 'P2002',
    clientVersion: 'test',
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('stores dates as UTC midnight and returns them as YYYY-MM-DD', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(input)).resolves.toEqual({ id: 'campaign-id', ...input });
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startedOn: new Date('2026-05-01T00:00:00.000Z'),
            closedOn: null,
          }),
        }),
      );
    });

    it('rejects a closing date before the start date without touching the database', async () => {
      await expect(service.create({ ...input, closedOn: '2026-04-30' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('maps a unique violation on year to 409', async () => {
      create.mockRejectedValue(uniqueViolation);
      await expect(service.create(input)).rejects.toBeInstanceOf(ConflictException);
    });

    it('lets other database errors through', async () => {
      create.mockRejectedValue(new Error('connection lost'));
      await expect(service.create(input)).rejects.toThrow('connection lost');
    });
  });

  describe('findOne', () => {
    it('throws 404 for an unknown id', async () => {
      findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('closes a campaign from closedOn alone, checked against the stored start date', async () => {
      findUnique.mockResolvedValue(row);
      update.mockResolvedValue({ ...row, closedOn: new Date('2026-11-30T00:00:00.000Z') });
      await expect(service.update('campaign-id', { closedOn: '2026-11-30' })).resolves.toEqual({
        id: 'campaign-id',
        ...input,
        closedOn: '2026-11-30',
      });
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'campaign-id' },
          data: expect.objectContaining({ closedOn: new Date('2026-11-30T00:00:00.000Z') }),
        }),
      );
    });

    it('rejects a closing date before the stored start date', async () => {
      findUnique.mockResolvedValue(row);
      await expect(
        service.update('campaign-id', { closedOn: '2026-04-30' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(update).not.toHaveBeenCalled();
    });

    it('rejects moving the start date after the stored closing date', async () => {
      findUnique.mockResolvedValue({ ...row, closedOn: new Date('2026-11-30T00:00:00.000Z') });
      await expect(
        service.update('campaign-id', { startedOn: '2026-12-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws 404 before updating an unknown campaign', async () => {
      findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { mouldingRate: 25 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(update).not.toHaveBeenCalled();
    });

    it('maps a year collision to 409', async () => {
      findUnique.mockResolvedValue(row);
      update.mockRejectedValue(uniqueViolation);
      await expect(service.update('campaign-id', { year: 2025 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
