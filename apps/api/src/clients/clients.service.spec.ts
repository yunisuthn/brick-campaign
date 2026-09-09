import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ClientsService } from './clients.service.js';

describe('ClientsService', () => {
  const findUnique = vi.fn();
  const update = vi.fn();
  const prisma = { client: { findUnique, update } } as unknown as PrismaService;
  const service = new ClientsService(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws 404 for an unknown id on read and before update', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update('missing', { locality: 'Elsewhere' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(update).not.toHaveBeenCalled();
  });
});
