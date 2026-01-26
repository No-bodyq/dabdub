import { ApiProperty } from '@nestjs/swagger';

export class RateLimitInfoDto {
  @ApiProperty({
    description: 'Maximum number of requests allowed',
    example: 1000,
  })
  limit: number;

  @ApiProperty({
    description: 'Time window in seconds',
    example: 3600,
  })
  window: number;

  @ApiProperty({
    description: 'Remaining requests in current window',
    example: 950,
  })
  remaining: number;

  @ApiProperty({
    description: 'Unix timestamp when rate limit resets',
    example: 1705766400,
  })
  resetAt: number;

  @ApiProperty({
    description: 'Rate limit tier',
    example: 'standard',
    enum: ['free', 'standard', 'premium', 'enterprise'],
  })
  tier: string;
}

export class RateLimitWarningDto {
  @ApiProperty({
    description: 'Warning message about rate limit',
    example: 'You are approaching your rate limit',
  })
  message: string;

  @ApiProperty({
    description: 'Percentage of rate limit used',
    example: 90,
    minimum: 0,
    maximum: 100,
  })
  percentageUsed: number;

  @ApiProperty({
    description: 'Requests remaining before limit',
    example: 100,
  })
  requestsRemaining: number;
}
