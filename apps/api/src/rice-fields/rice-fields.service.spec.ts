import { rejectsWithCode } from '../../test/api-error.expect.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { RiceFieldsService } from './rice-fields.service.js';

describe('RiceFieldsService', () => {
  const findUnique = vi.fn();
  const update = vi.fn();
  const prisma = { riceField: { findUnique, update } } as unknown as PrismaService;
  const service = new RiceFieldsService(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws 404 for an unknown id on read and before update', async () => {
    findUnique.mockResolvedValue(null);
    await rejectsWithCode(service.findOne('missing'), 'rice_field_not_found');
    await rejectsWithCode(
      service.update('missing', { location: 'Elsewhere' }),
      'rice_field_not_found',
    );
    expect(update).not.toHaveBeenCalled();
  });
});
