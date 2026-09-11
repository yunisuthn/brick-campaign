import { rejectsWithCode } from '../../test/api-error.expect.js';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ContractorWorksService } from './contractor-works.service.js';

describe('ContractorWorksService', () => {
  const campaignFindUnique = vi.fn();
  const kilnBatchFindFirst = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    kilnBatch: { findFirst: kilnBatchFindFirst },
    contractorWork: { create, findFirst, update },
  } as unknown as PrismaService;
  const service = new ContractorWorksService(prisma, new EntryReferences(prisma));

  const campaignId = 'campaign-id';
  const input = {
    date: '2026-07-01',
    kilnBatchId: 'batch-id',
    type: 'transport' as const,
    contractorName: 'Solo',
    quantity: 5000,
  };
  const row = { id: 'work-id', campaignId, ...input, date: new Date('2026-07-01T00:00:00Z') };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    kilnBatchFindFirst.mockResolvedValue({ id: 'batch-id' });
  });

  it('creates once the date and the batch are checked', async () => {
    create.mockResolvedValue(row);
    await expect(service.create(campaignId, input)).resolves.toEqual({
      id: 'work-id',
      campaignId,
      ...input,
    });
    kilnBatchFindFirst.mockResolvedValue(null);
    await rejectsWithCode(service.create(campaignId, input), 'unknown_kiln_batch');
    await rejectsWithCode(
      service.create(campaignId, { ...input, date: '2026-04-30' }),
      'date_outside_campaign',
    );
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('re-checks the batch only when it changes on update', async () => {
    findFirst.mockResolvedValue(row);
    update.mockResolvedValue(row);
    await service.update(campaignId, 'work-id', { quantity: 6000 });
    expect(kilnBatchFindFirst).not.toHaveBeenCalled();
    await service.update(campaignId, 'work-id', { kilnBatchId: 'other-batch' });
    expect(kilnBatchFindFirst).toHaveBeenCalledTimes(1);
  });

  it('throws 404 on a cancelled or unknown entry', async () => {
    findFirst.mockResolvedValue(null);
    await rejectsWithCode(service.findOne(campaignId, 'work-id'), 'contractor_work_not_found');
    await rejectsWithCode(service.cancel(campaignId, 'work-id'), 'contractor_work_not_found');
    expect(update).not.toHaveBeenCalled();
  });
});
