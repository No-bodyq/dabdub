import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VolumeAnalyticsQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: ['hour', 'day', 'week', 'month'] })
  @IsIn(['hour', 'day', 'week', 'month'])
  granularity: 'hour' | 'day' | 'week' | 'month';

  @ApiPropertyOptional({ enum: ['chain', 'token', 'merchant', 'status'] })
  @IsOptional()
  @IsIn(['chain', 'token', 'merchant', 'status'])
  groupBy?: 'chain' | 'token' | 'merchant' | 'status';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenSymbol?: string;
}

export class VolumePeriodDto {
  period: string;
  transactionCount: number;
  volumeUsd: string;
  feesCollectedUsd: string;
  successCount: number;
  failedCount: number;
}

export class VolumePeriodGroupedDto {
  period: string;
  breakdown: Record<string, { transactionCount: number; volumeUsd: string }>;
}

export class VolumeTotalsDto {
  transactionCount: number;
  volumeUsd: string;
  feesCollectedUsd: string;
}

export class VolumeAnalyticsResponseDto {
  granularity: string;
  startDate: string;
  endDate: string;
  series: VolumePeriodDto[] | VolumePeriodGroupedDto[];
  totals: VolumeTotalsDto;
}
