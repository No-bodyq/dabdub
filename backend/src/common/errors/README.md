# Error Handling Module

This module provides a comprehensive error handling system for the DABDUB backend application.

## Quick Start

### Using Custom Exceptions

```typescript
import { NotFoundException, InsufficientFundsException } from './common/errors';

// In your service
throw new NotFoundException('User not found', { userId: '123' });
throw new InsufficientFundsException(100, 500);
```

### Using Validation

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// In your controller - validation happens automatically
@Post('users')
async createUser(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

## Files Structure

```
common/
├── errors/
│   ├── error-codes.enum.ts          # Error code enumeration
│   ├── error-response.dto.ts        # Standardized error response DTO
│   ├── exceptions/
│   │   ├── http-exceptions.ts       # HTTP exception classes
│   │   └── business-exceptions.ts   # Business logic exceptions
│   ├── index.ts                     # Module exports
│   └── README.md                    # This file
├── filters/
│   ├── http-exception.filter.ts     # HTTP exception filter
│   └── all-exceptions.filter.ts     # Global exception filter
├── pipes/
│   └── validation.pipe.ts           # Custom validation pipe
├── config/
│   └── sentry.config.ts             # Sentry configuration
├── utils/
│   └── retry.util.ts                # Retry logic utility
└── monitoring/
    ├── error-monitoring.service.ts  # Error monitoring service
    ├── error-monitoring.module.ts   # Error monitoring module
    └── error-monitoring.controller.ts # Error monitoring endpoints
```

## See Also

- [Full Documentation](../../docs/ERROR_HANDLING.md) - Complete error handling documentation
