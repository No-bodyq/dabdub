import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error code identifier',
    example: 'VALIDATION_ERROR',
  })
  code: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'Request identifier for tracking',
    example: 'req-123456-789',
  })
  requestId: string;

  @ApiProperty({
    description: 'Timestamp of error occurrence',
    example: '2024-01-20T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Additional error details',
    example: { field: 'email', reason: 'Invalid format' },
    required: false,
  })
  details?: Record<string, any>;
}

export class SuccessResponseDto<T> {
  @ApiProperty({
    description: 'Response data',
  })
  data: T;

  @ApiProperty({
    description: 'Response metadata',
    required: false,
  })
  meta?: Record<string, any>;

  @ApiProperty({
    description: 'Request identifier for tracking',
    example: 'req-123456-789',
  })
  requestId: string;
}

export class CommonResponseDto<T> {
  @ApiProperty({
    description: 'Indicates whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response payload',
    required: false,
  })
  data?: T | null;

  @ApiProperty({
    description: 'Optional human-readable message',
    required: false,
    example: 'Operation completed successfully',
  })
  message?: string;
}
