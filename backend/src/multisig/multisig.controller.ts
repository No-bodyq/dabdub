import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MultisigService } from './multisig.service';
import { MultisigRequest, MultisigRequestType } from './entities/multisig-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

class CreateMultisigRequestDto {
  txXdr!: string;
  type!: MultisigRequestType;
  threshold!: string;
}

class ApproveMultisigRequestDto {
  signatureXdr!: string;
}

class RejectMultisigRequestDto {
  reason!: string;
}

@ApiTags('Multisig')
@Controller({ path: 'multisig', version: '1' })
@ApiBearerAuth()
export class MultisigController {
  constructor(private readonly multisigService: MultisigService) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new multisig request for a large transaction' })
  async createRequest(
    @Body() dto: CreateMultisigRequestDto,
    @Req() req: { user: { id: string } },
  ): Promise<MultisigRequest> {
    return this.multisigService.createRequest(
      dto.txXdr,
      dto.type,
      req.user.id,
      dto.threshold,
    );
  }

  @Post('requests/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Approve a multisig request' })
  async approveRequest(
    @Param('id') id: string,
    @Body() dto: ApproveMultisigRequestDto,
    @Req() req: { user: { id: string } },
  ): Promise<MultisigRequest> {
    return this.multisigService.approve(
      id,
      req.user.id,
      dto.signatureXdr,
    );
  }

  @Post('requests/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Reject a multisig request' })
  async rejectRequest(
    @Param('id') id: string,
    @Body() dto: RejectMultisigRequestDto,
    @Req() req: { user: { id: string } },
  ): Promise<MultisigRequest> {
    return this.multisigService.reject(
      id,
      req.user.id,
      dto.reason,
    );
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get a multisig request by ID' })
  async getRequest(@Param('id') id: string): Promise<MultisigRequest> {
    return this.multisigService.findById(id);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all pending multisig requests' })
  async getPendingRequests(
    @Req() req: { user: { id: string } },
  ): Promise<MultisigRequest[]> {
    return this.multisigService.findPendingForAdmin(req.user.id);
  }

  @Get('threshold-check')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if an amount exceeds the multisig threshold' })
  async checkThreshold(@Query('amount') amount: string): Promise<{ exceeds: boolean }> {
    return { exceeds: this.multisigService.isThresholdExceeded(amount) };
  }
}
