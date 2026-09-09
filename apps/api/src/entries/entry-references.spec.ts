import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { EntryReferences } from './entry-references.js';

describe('EntryReferences', () => {
  const campaignFindUnique = vi.fn();
  const moulderFindUnique = vi.fn();
  const riceFieldFindUnique = vi.fn();
  const clientFindUnique = vi.fn();
  const kilnBatchFindFirst = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    moulder: { findUnique: moulderFindUnique },
    riceField: { findUnique: riceFieldFindUnique },
    client: { findUnique: clientFindUnique },
    kilnBatch: { findFirst: kilnBatchFindFirst },
  } as unknown as PrismaService;
  const refs = new EntryReferences(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the campaign window as YYYY-MM-DD and 404s on an unknown campaign', async () => {
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: new Date('2026-11-30T00:00:00Z'),
    });
    await expect(refs.campaignWindow('campaign-id')).resolves.toEqual({
      startedOn: '2026-05-01',
      closedOn: '2026-11-30',
    });
    campaignFindUnique.mockResolvedValue(null);
    await expect(refs.campaignWindow('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a date outside the campaign with 400', () => {
    const window = { startedOn: '2026-05-01', closedOn: null };
    expect(() => refs.assertWithinCampaign(window, '2026-04-30')).toThrow(BadRequestException);
    expect(() => refs.assertWithinCampaign(window, '2026-05-01')).not.toThrow();
  });

  it('rejects an unknown or inactive moulder with 400', async () => {
    moulderFindUnique.mockResolvedValue(null);
    await expect(refs.assertActiveMoulder('x')).rejects.toThrow('Unknown moulder');
    moulderFindUnique.mockResolvedValue({ active: false });
    await expect(refs.assertActiveMoulder('x')).rejects.toThrow('is inactive');
    moulderFindUnique.mockResolvedValue({ active: true });
    await expect(refs.assertActiveMoulder('x')).resolves.toBeUndefined();
  });

  it('rejects an unknown rice field with 400', async () => {
    riceFieldFindUnique.mockResolvedValue(null);
    await expect(refs.assertRiceField('x')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unknown client with 400', async () => {
    clientFindUnique.mockResolvedValue(null);
    await expect(refs.assertClient('x')).rejects.toBeInstanceOf(BadRequestException);
    clientFindUnique.mockResolvedValue({ id: 'x' });
    await expect(refs.assertClient('x')).resolves.toBeUndefined();
  });

  it('looks the kiln batch up within the campaign, live only, and 400s otherwise', async () => {
    kilnBatchFindFirst.mockResolvedValue(null);
    await expect(refs.assertKilnBatch('campaign-id', 'batch-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(kilnBatchFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'batch-id', campaignId: 'campaign-id', cancelledAt: null },
      }),
    );
  });
});
