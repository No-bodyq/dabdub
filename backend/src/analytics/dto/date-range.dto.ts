import {
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TimeInterval {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class DateRangeDto {
  @ApiProperty({
    description: 'Start date in ISO 8601 format',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date in ISO 8601 format',
    example: '2024-01-31T23:59:59Z',
  })
  @IsDateString()
  endDate!: string;
}

export class DateRangeQueryDto extends DateRangeDto {
  @ApiPropertyOptional({
    description: 'Time interval for grouping data',
    enum: TimeInterval,
    default: TimeInterval.DAY,
  })
  @IsOptional()
  @IsEnum(TimeInterval)
  interval?: TimeInterval = TimeInterval.DAY;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
