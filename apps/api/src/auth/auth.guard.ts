import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { AuthenticatedRequest, SESSION_COOKIE, SessionClaims } from './session.js';

/** Registered as APP_GUARD: every route requires a valid session cookie unless marked @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string') throw new UnauthorizedException();

    try {
      const claims = await this.jwt.verifyAsync<SessionClaims>(token);
      request.user = { id: claims.sub, email: claims.email };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
