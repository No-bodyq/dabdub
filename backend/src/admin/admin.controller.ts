import { Controller, Get, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { MerchantStatus, MerchantRole } from '../merchants/entities/merchant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MerchantRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('merchants')
  @ApiOperation({ summary: 'List all merchants' })
  findAllMerchants(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.findAllMerchants(+page, +limit);
  }

  @Get('merchants/:id')
  @ApiOperation({ summary: 'Get merchant details' })
  findOneMerchant(@Param('id') id: string) {
    return this.adminService.findOneMerchant(id);
  }

  @Patch('merchants/:id/status')
  @ApiOperation({ summary: 'Update merchant status' })
  updateStatus(@Param('id') id: string, @Body('status') status: MerchantStatus) {
    return this.adminService.updateMerchantStatus(id, status);
  }

  @Patch('merchants/bulk/status')
  @ApiOperation({ summary: 'Bulk update merchant status' })
  bulkUpdateStatus(@Body('ids') ids: string[], @Body('status') status: MerchantStatus) {
    return this.adminService.bulkUpdateMerchantStatus(ids, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global stats' })
  getStats() {
    return this.adminService.getGlobalStats();
  }

  @Get('fees')
  @ApiOperation({ summary: 'List all global fee configurations' })
  getFees() {
    return this.adminService.getGlobalFees();
  }

  @Patch('fees')
  @ApiOperation({ summary: 'Update a global fee rate' })
  updateFee(
    @Body() dto: { feeType: string; newRate: string; reason?: string },
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.adminService.updateGlobalFee(
      dto.feeType as any,
      dto.newRate,
      req.user.id,
      dto.reason,
    );
  }
}
