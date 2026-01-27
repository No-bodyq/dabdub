import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';

@Injectable()
export class MerchantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== UserRole.MERCHANT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Merchant role required');
    }

    return true;
  }
}
