import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { AuditInterceptor, Audit } from '../audit/audit.interceptor';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceWindowDto } from './dto/create-maintenance-window.dto';
import { MaintenanceWindowResponseDto } from './dto/maintenance-window-response.dto';

interface RequestWithUser extends Request {
  user: { id: string; role: string };
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'admin/maintenance', version: '1' })
export class MaintenanceAdminController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(AdminRole.SUPERADMIN)
  @Audit({ 
    action: 'maintenance.create', 
    resourceType: 'maintenance_window',
  })
  @ApiOperation({ summary: 'Schedule a new maintenance window' })
  @ApiResponse({ 
    status: 201, 
    description: 'Maintenance window created successfully',
    type: MaintenanceWindowResponseDto,
  })
  async createMaintenanceWindow(
    @Body() dto: CreateMaintenanceWindowDto,
    @Req() req: RequestWithUser,
  ): Promise<MaintenanceWindowResponseDto> {
    return this.maintenanceService.create(dto, req.user.id);
  }

  @Patch(':id/cancel')
  @Roles(AdminRole.SUPERADMIN)
  @Audit({ 
    action: 'maintenance.cancel', 
    resourceType: 'maintenance_window',
    resourceIdParam: 'id',
  })
  @ApiOperation({ summary: 'Cancel a scheduled maintenance window' })
  @ApiResponse({ 
    status: 200, 
    description: 'Maintenance window cancelled successfully',
    type: MaintenanceWindowResponseDto,
  })
  async cancelMaintenanceWindow(
    @Param('id') id: string,
  ): Promise<MaintenanceWindowResponseDto> {
    return this.maintenanceService.cancel(id);
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'List all maintenance windows' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all maintenance windows',
    type: [MaintenanceWindowResponseDto],
  })
  async listMaintenanceWindows(): Promise<MaintenanceWindowResponseDto[]> {
    return this.maintenanceService.findAll();
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get maintenance window details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Maintenance window details',
    type: MaintenanceWindowResponseDto,
  })
  async getMaintenanceWindow(
    @Param('id') id: string,
  ): Promise<MaintenanceWindowResponseDto> {
    return this.maintenanceService.findById(id);
  }
}