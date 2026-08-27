import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/types/jwt-payload.type.js';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user?.isSuperAdmin) {
      throw new ForbiddenException('Platform admin access required');
    }

    return true;
  }
}
