import { rejectsWithCode } from '../../test/api-error.expect.js';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService.login', () => {
  const user = { id: 'user-id', email: 'rakoto@example.com', passwordHash: '' };
  const findUnique = vi.fn();
  const prisma = { user: { findUnique } } as unknown as PrismaService;
  let service: AuthService;

  beforeAll(async () => {
    user.passwordHash = await hashPassword('right-password');
    service = new AuthService(prisma, new JwtService({ secret: 'x'.repeat(32) }));
    await service.onModuleInit();
  });

  beforeEach(() => {
    findUnique.mockReset();
  });

  it('returns the session user on valid credentials and normalises the email', async () => {
    findUnique.mockResolvedValue(user);
    await expect(service.login('  Rakoto@Example.com ', 'right-password')).resolves.toEqual({
      id: 'user-id',
      email: 'rakoto@example.com',
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'rakoto@example.com' } }),
    );
  });

  it('rejects a wrong password', async () => {
    findUnique.mockResolvedValue(user);
    await rejectsWithCode(service.login(user.email, 'wrong-password'), 'invalid_credentials');
  });

  it('rejects an unknown email with the same error as a wrong password', async () => {
    findUnique.mockResolvedValue(null);
    const unknown = await service.login('nobody@example.com', 'whatever').catch((e) => e);
    findUnique.mockResolvedValue(user);
    const wrong = await service.login(user.email, 'wrong-password').catch((e) => e);
    expect(unknown.getResponse()).toMatchObject({ code: 'invalid_credentials' });
    expect(unknown.getResponse()).toEqual(wrong.getResponse());
  });
});
