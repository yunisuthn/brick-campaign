import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword, normaliseEmail, verifyPassword } from './password.js';
import { SessionClaims, SessionUser } from './session.js';

@Injectable()
export class AuthService implements OnModuleInit {
  /** Verified against when the email is unknown, so both failure paths cost an argon2 verify. */
  private dummyHash = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await hashPassword('dummy-password-never-accepted');
  }

  /** Unknown email and wrong password are indistinguishable from the outside. */
  async login(email: string, password: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: normaliseEmail(email) },
      select: { id: true, email: true, passwordHash: true },
    });
    const valid = await verifyPassword(user?.passwordHash ?? this.dummyHash, password);
    if (!user || !valid) throw new UnauthorizedException('Invalid credentials');
    return { id: user.id, email: user.email };
  }

  issueToken(user: SessionUser): Promise<string> {
    const claims: SessionClaims = { sub: user.id, email: user.email };
    return this.jwt.signAsync(claims);
  }
}
