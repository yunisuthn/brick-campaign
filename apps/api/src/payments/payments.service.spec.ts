import { rejectsWithCode } from '../../test/api-error.expect.js';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PaymentsService } from './payments.service.js';

describe('PaymentsService', () => {
  const campaignFindUnique = vi.fn();
  const moulderFindUnique = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const count = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    moulder: { findUnique: moulderFindUnique },
    payment: { create, findFirst, update, count },
  } as unknown as PrismaService;
  const service = new PaymentsService(prisma, new EntryReferences(prisma));

  const campaignId = 'campaign-id';
  const base = { date: '2026-06-10', type: 'vatsy' as const, amount: 20000 };
  const row = {
    id: 'payment-id',
    campaignId,
    ...base,
    date: new Date('2026-06-10T00:00:00Z'),
    moulderId: 'moulder-id',
    contractorName: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    moulderFindUnique.mockResolvedValue({ active: true });
    count.mockResolvedValue(0);
  });

  describe('create', () => {
    it('stores a moulder payment with the contractor name null', async () => {
      create.mockResolvedValue(row);
      await expect(
        service.create(campaignId, { ...base, moulderId: 'moulder-id' }),
      ).resolves.toEqual({
        id: 'payment-id',
        campaignId,
        ...base,
        moulderId: 'moulder-id',
        contractorName: null,
      });
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            ...base,
            campaignId,
            date: new Date('2026-06-10T00:00:00Z'),
            moulderId: 'moulder-id',
            contractorName: null,
          },
        }),
      );
    });

    it('stores a contractor payment without looking up any moulder', async () => {
      create.mockResolvedValue({ ...row, moulderId: null, contractorName: 'Rasoa' });
      await service.create(campaignId, { ...base, contractorName: 'Rasoa' });
      expect(moulderFindUnique).not.toHaveBeenCalled();
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ moulderId: null, contractorName: 'Rasoa' }),
        }),
      );
    });

    it('rejects a date outside the campaign and an inactive moulder', async () => {
      await rejectsWithCode(
        service.create(campaignId, { ...base, date: '2026-04-30', moulderId: 'moulder-id' }),
        'date_outside_campaign',
      );
      moulderFindUnique.mockResolvedValue({ active: false });
      await rejectsWithCode(
        service.create(campaignId, { ...base, moulderId: 'moulder-id' }),
        'moulder_inactive',
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('rejects a second vatsy for the same moulder on the same day', async () => {
      count.mockResolvedValue(1);
      await rejectsWithCode(
        service.create(campaignId, { ...base, moulderId: 'moulder-id' }),
        'payment_duplicate_type',
      );
      expect(count).toHaveBeenCalledWith({
        where: {
          campaignId,
          moulderId: 'moulder-id',
          type: 'vatsy',
          date: new Date('2026-06-10T00:00:00Z'),
          cancelledAt: null,
          id: undefined,
        },
      });
      expect(create).not.toHaveBeenCalled();
    });

    it('never checks for a duplicate settlement, or for a contractor payment', async () => {
      count.mockResolvedValue(1);
      create.mockResolvedValue({ ...row, type: 'settlement' });
      await service.create(campaignId, { ...base, type: 'settlement', moulderId: 'moulder-id' });
      expect(count).not.toHaveBeenCalled();

      create.mockResolvedValue({ ...row, moulderId: null, contractorName: 'Rasoa' });
      await service.create(campaignId, { ...base, contractorName: 'Rasoa' });
      expect(count).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('switching to a contractor clears the moulder, and the reverse', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.update(campaignId, 'payment-id', { contractorName: 'Rasoa' });
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: { date: undefined, moulderId: null, contractorName: 'Rasoa' },
        }),
      );
      await service.update(campaignId, 'payment-id', { moulderId: 'other-moulder' });
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: { date: undefined, moulderId: 'other-moulder', contractorName: null },
        }),
      );
    });

    it('leaves the beneficiary alone when only the amount changes', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.update(campaignId, 'payment-id', { amount: 25000 });
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: { amount: 25000, date: undefined } }),
      );
    });

    it('throws 404 on a cancelled or unknown payment', async () => {
      findFirst.mockResolvedValue(null);
      await rejectsWithCode(
        service.update(campaignId, 'payment-id', { amount: 1 }),
        'payment_not_found',
      );
      expect(update).not.toHaveBeenCalled();
    });

    it('rejects a change that collides with another vatsy already on that day', async () => {
      findFirst.mockResolvedValue(row);
      count.mockResolvedValue(1);
      await rejectsWithCode(
        service.update(campaignId, 'payment-id', { amount: 25000 }),
        'payment_duplicate_type',
      );
      expect(count).toHaveBeenCalledWith({
        where: {
          campaignId,
          moulderId: 'moulder-id',
          type: 'vatsy',
          date: new Date('2026-06-10T00:00:00Z'),
          cancelledAt: null,
          id: { not: 'payment-id' },
        },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('does not check for a duplicate when switching to a contractor', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue({ ...row, moulderId: null, contractorName: 'Rasoa' });
      await service.update(campaignId, 'payment-id', { contractorName: 'Rasoa' });
      expect(count).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('stamps cancelledAt instead of deleting', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.cancel(campaignId, 'payment-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });
  });
});
