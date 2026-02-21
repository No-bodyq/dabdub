import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
