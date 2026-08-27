import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '../../auth/types/jwt-payload.type.js';

export const CurrentBusinessId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!user?.businessId) {
      throw new ForbiddenException('No business selected for this account');
    }
    return user.businessId;
  },
);
