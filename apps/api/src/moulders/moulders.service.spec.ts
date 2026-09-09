import { NotFoundException } from '@nestjs/common';
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
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update('missing', { active: false })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(update).not.toHaveBeenCalled();
  });
});
