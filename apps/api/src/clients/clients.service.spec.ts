import { rejectsWithCode } from '../../test/api-error.expect.js';
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
    await rejectsWithCode(service.findOne('missing'), 'client_not_found');
    await rejectsWithCode(service.update('missing', { locality: 'Elsewhere' }), 'client_not_found');
    expect(update).not.toHaveBeenCalled();
  });
});
