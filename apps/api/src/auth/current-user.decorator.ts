import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, SessionUser } from './session.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);
