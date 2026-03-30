import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MerchantAnalyticsService } from './merchant-analytics.service';
import { MerchantOverviewDto, RevenueTimelineDto, RevenueGranularity } from './dto/merchant-overview.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

class RevenueTimelineQueryDto {
  @IsEnum(RevenueGranularity)
  @IsOptional()
  granularity?: RevenueGranularity = RevenueGranularity.DAY;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}

@ApiTags('Merchant Analytics')
@Controller({ path: 'merchants/analytics', version: '1' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MerchantAnalyticsController {
  constructor(private readonly analyticsService: MerchantAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get merchant overview statistics for the last 30 days' })
  async getOverview(
    @Req() req: { user: { id: string } },
  ): Promise<MerchantOverviewDto> {
    return this.analyticsService.getOverview(req.user.id);
  }

  @Get('revenue-timeline')
  @ApiOperation({ summary: 'Get revenue timeline with specified granularity' })
  @ApiQuery({ name: 'granularity', enum: RevenueGranularity, required: false })
  @ApiQuery({ name: 'dateFrom', type: String, required: false })
  @ApiQuery({ name: 'dateTo', type: String, required: false })
  async getRevenueTimeline(
    @Req() req: { user: { id: string } },
    @Query() query: RevenueTimelineQueryDto,
  ): Promise<RevenueTimelineDto> {
    const dateFrom = query.dateFrom 
      ? new Date(query.dateFrom) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    return this.analyticsService.getRevenueTimeline(
      req.user.id,
      query.granularity || RevenueGranularity.DAY,
      dateFrom,
      dateTo,
    );
  }

  @Get(':merchantId/overview')
  @ApiOperation({ summary: 'Get specific merchant overview (admin only)' })
  async getMerchantOverview(
    @Param('merchantId') merchantId: string,
  ): Promise<MerchantOverviewDto> {
    return this.analyticsService.getOverview(merchantId);
  }

  @Get(':merchantId/revenue-timeline')
  @ApiOperation({ summary: 'Get specific merchant revenue timeline (admin only)' })
  async getMerchantRevenueTimeline(
    @Param('merchantId') merchantId: string,
    @Query() query: RevenueTimelineQueryDto,
  ): Promise<RevenueTimelineDto> {
    const dateFrom = query.dateFrom 
      ? new Date(query.dateFrom) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    return this.analyticsService.getRevenueTimeline(
      merchantId,
      query.granularity || RevenueGranularity.DAY,
      dateFrom,
      dateTo,
    );
  }
}
