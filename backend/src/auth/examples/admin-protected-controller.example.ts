import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { RequirePermissionGuard } from '../guards/require-permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

/**
 * Example controller showing how to protect admin endpoints
 * with the AdminJwtGuard and permission-based access control
 */
@ApiTags('Admin Examples')
@Controller('admin/examples')
@UseGuards(AdminJwtGuard) // Protect all routes with admin JWT
@ApiBearerAuth()
export class AdminProtectedController {
  
  /**
   * Basic admin-only endpoint
   * Accessible by both ADMIN and SUPPORT_ADMIN roles
   */
  @Get('basic')
  @ApiOperation({ summary: 'Basic admin endpoint' })
  @ApiResponse({ status: 200, description: 'Admin data returned' })
  @ApiResponse({ status: 401, description: 'Invalid or missing admin token' })
  async getBasicAdminData(@Request() req: any) {
    return {
      message: 'This is admin-only data',
      admin: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }

  /**
   * Revenue analytics endpoint
   * Only accessible by ADMIN role (SUPPORT_ADMIN is restricted)
   */
  @Get('revenue')
  @UseGuards(RequirePermissionGuard)
  @RequirePermission('analytics:revenue')
  @ApiOperation({ summary: 'Revenue analytics (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Revenue data returned' })
  @ApiResponse({ status: 401, description: 'Invalid or missing admin token' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (SUPPORT_ADMIN restricted)' })
  async getRevenueAnalytics(@Request() req: any) {
    return {
      message: 'Sensitive revenue data',
      revenue: {
        total: 150000,
        monthly: 12500,
        currency: 'USD',
      },
      admin: req.user.email,
    };
  }

  /**
   * General analytics endpoint
   * Accessible by both ADMIN and SUPPORT_ADMIN roles
   */
  @Get('analytics')
  @UseGuards(RequirePermissionGuard)
  @RequirePermission('analytics:read')
  @ApiOperation({ summary: 'General analytics (ADMIN and SUPPORT_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Analytics data returned' })
  @ApiResponse({ status: 401, description: 'Invalid or missing admin token' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getGeneralAnalytics(@Request() req: any) {
    return {
      message: 'General analytics data',
      stats: {
        totalUsers: 1250,
        activeUsers: 890,
        totalTransactions: 5670,
      },
      admin: req.user.email,
    };
  }
}

/**
 * Usage Examples:
 * 
 * 1. Login as admin:
 *    POST /admin/auth/login
 *    { "email": "admin@example.com", "password": "password" }
 * 
 * 2. Use the returned access_token in Authorization header:
 *    Authorization: Bearer <access_token>
 * 
 * 3. Access protected endpoints:
 *    GET /admin/examples/basic (accessible by ADMIN and SUPPORT_ADMIN)
 *    GET /admin/examples/analytics (accessible by ADMIN and SUPPORT_ADMIN)
 *    GET /admin/examples/revenue (accessible by ADMIN only)
 * 
 * 4. Token expires in 2 hours by default (configurable via ADMIN_JWT_EXPIRES_IN)
 * 
 * 5. Refresh token when needed:
 *    POST /admin/auth/refresh
 *    { "refresh_token": "<refresh_token>" }
 */