import { rejectsWithCode } from '../../test/api-error.expect.js';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService', () => {
  const campaignFindUnique = vi.fn();
  const kilnBatchFindFirst = vi.fn();
  const riceFieldFindUnique = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const update = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    kilnBatch: { findFirst: kilnBatchFindFirst },
    riceField: { findUnique: riceFieldFindUnique },
    expense: { create, findFirst, findMany, update },
  } as unknown as PrismaService;
  const service = new ExpensesService(prisma, new EntryReferences(prisma));

  const campaignId = 'campaign-id';
  const input = {
    date: '2026-05-15',
    category: 'akofa' as const,
    amount: 300_000,
    label: '3 charrettes',
    kilnBatchId: null,
    riceFieldId: null,
  };
  const row = { id: 'expense-id', campaignId, ...input, date: new Date('2026-05-15T00:00:00Z') };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    kilnBatchFindFirst.mockResolvedValue({ id: 'batch-id' });
    riceFieldFindUnique.mockResolvedValue({ id: 'field-id' });
  });

  describe('create', () => {
    it('stores an unlinked expense without looking any link up', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, input)).resolves.toEqual({
        id: 'expense-id',
        campaignId,
        ...input,
      });
      expect(kilnBatchFindFirst).not.toHaveBeenCalled();
      expect(riceFieldFindUnique).not.toHaveBeenCalled();
    });

    it('checks the batch within the campaign and the rice field when linked', async () => {
      create.mockResolvedValue(row);
      await service.create(campaignId, {
        ...input,
        kilnBatchId: 'batch-id',
        riceFieldId: 'field-id',
      });
      expect(kilnBatchFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'batch-id', campaignId, cancelledAt: null } }),
      );
      kilnBatchFindFirst.mockResolvedValue(null);
      await rejectsWithCode(
        service.create(campaignId, { ...input, kilnBatchId: 'batch-id' }),
        'unknown_kiln_batch',
      );
      riceFieldFindUnique.mockResolvedValue(null);
      await rejectsWithCode(
        service.create(campaignId, { ...input, riceFieldId: 'field-id' }),
        'unknown_rice_field',
      );
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('rejects a date outside the campaign', async () => {
      await rejectsWithCode(
        service.create(campaignId, { ...input, date: '2026-04-30' }),
        'date_outside_campaign',
      );
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('passes the filters through, live entries of the campaign only', async () => {
      findMany.mockResolvedValue([]);
      await service.findAll(campaignId, { category: 'fuel' });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { campaignId, cancelledAt: null, category: 'fuel' } }),
      );
    });
  });

  describe('update', () => {
    it('re-checks a link only when it is set, detaching with null needs nothing', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue(row);
      await service.update(campaignId, 'expense-id', { amount: 320_000, kilnBatchId: null });
      expect(kilnBatchFindFirst).not.toHaveBeenCalled();
      await service.update(campaignId, 'expense-id', { kilnBatchId: 'batch-id' });
      expect(kilnBatchFindFirst).toHaveBeenCalledTimes(1);
    });

    it('throws 404 on a cancelled or unknown expense', async () => {
      findFirst.mockResolvedValue(null);
      await rejectsWithCode(
        service.update(campaignId, 'expense-id', { amount: 1 }),
        'expense_not_found',
      );
      await rejectsWithCode(service.cancel(campaignId, 'expense-id'), 'expense_not_found');
      expect(update).not.toHaveBeenCalled();
    });
  });
});
