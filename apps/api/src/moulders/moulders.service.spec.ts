import { rejectsWithCode } from '../../test/api-error.expect.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { MouldersService } from './moulders.service.js';

describe('MouldersService', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const update = vi.fn();
  const prisma = { moulder: { findMany, findUnique, update } } as unknown as PrismaService;
  const service = new MouldersService(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lists active moulders only unless asked otherwise', async () => {
    findMany.mockResolvedValue([]);
    await service.findAll({ includeInactive: false });
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { active: true } }));
    await service.findAll({ includeInactive: true });
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: {} }));
  });

  it('throws 404 for an unknown id on read and before update', async () => {
    findUnique.mockResolvedValue(null);
    await rejectsWithCode(service.findOne('missing'), 'moulder_not_found');
    await rejectsWithCode(service.update('missing', { active: false }), 'moulder_not_found');
    expect(update).not.toHaveBeenCalled();
  });
});
