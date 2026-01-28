import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  REVENUE = 'revenue',
  TRANSACTIONS = 'transactions',
  SETTLEMENTS = 'settlements',
  COMPREHENSIVE = 'comprehensive',
}

export enum ReportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
}

export class GenerateReportDto {
  @ApiProperty({
    description: 'Report type',
    enum: ReportType,
  })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({
    description: 'Start date for report',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for report',
    example: '2024-01-31T23:59:59Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Report format',
    enum: ReportFormat,
    default: ReportFormat.CSV,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.CSV;

  @ApiPropertyOptional({
    description: 'Merchant ID (admin only)',
  })
  @IsOptional()
  @IsString()
  merchantId?: string;
}
