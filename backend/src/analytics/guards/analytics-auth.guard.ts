import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Guard to protect analytics endpoints
 * Ensures only authenticated merchants can access their own analytics
 */
@Injectable()
export class AnalyticsAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const merchantId = request.query.merchantId || request.params.merchantId;
    
    // TODO: Implement actual authentication check
    // For now, just validate merchantId exists
    if (!merchantId) {
      throw new UnauthorizedException('Merchant ID is required');
    }

    // TODO: Verify the authenticated user has access to this merchant's data
    // const user = request.user;
    // if (user.merchantId !== merchantId && !user.isAdmin) {
    //   throw new UnauthorizedException('Access denied to this merchant data');
    // }

    return true;
  }
}
