# Error Handling and Exception Filters Documentation

## Overview

This document describes the comprehensive error handling system implemented in the DABDUB backend application. The system provides standardized error responses, custom exception classes, validation, error tracking, and monitoring capabilities.

## Table of Contents

1. [Error Code System](#error-code-system)
2. [Exception Classes](#exception-classes)
3. [Global Exception Filters](#global-exception-filters)
4. [Validation Pipe](#validation-pipe)
5. [Error Response Format](#error-response-format)
6. [Sentry Integration](#sentry-integration)
7. [Retry Logic](#retry-logic)
8. [Error Monitoring](#error-monitoring)
9. [Usage Examples](#usage-examples)
10. [Error Codes Reference](#error-codes-reference)

## Error Code System

The application uses a structured error code enumeration system where codes follow the pattern: `[CATEGORY][SUB_CATEGORY][NUMBER]`.

### Error Code Categories

- **1xxx**: General/System Errors
- **2xxx**: Validation Errors
- **3xxx**: Authentication/Authorization Errors
- **4xxx**: Business Logic Errors
- **5xxx**: External Service Errors
- **6xxx**: Database Errors
- **7xxx**: Payment/Transaction Errors

### Example Error Codes

```typescript
ErrorCode.INTERNAL_SERVER_ERROR // 1000
ErrorCode.VALIDATION_ERROR      // 2000
ErrorCode.UNAUTHORIZED          // 3000
ErrorCode.INSUFFICIENT_FUNDS    // 4008
ErrorCode.PAYMENT_FAILED        // 7001
```

## Exception Classes

### HTTP Exceptions

Standard HTTP exceptions that map to HTTP status codes:

- `BadRequestException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404)
- `ConflictException` (409)
- `UnprocessableEntityException` (422)
- `LockedException` (423)
- `TooManyRequestsException` (429)
- `InternalServerErrorException` (500)
- `BadGatewayException` (502)
- `ServiceUnavailableException` (503)
- `GatewayTimeoutException` (504)
- `ValidationException` (400) - with detailed field errors

### Business Logic Exceptions

Domain-specific exceptions for business logic errors:

- `InsufficientFundsException`
- `WalletNotFoundException`
- `UserNotFoundException`
- `TransactionNotFoundException`
- `WalletLockedException`
- `TransactionLimitExceededException`
- `InvalidTransactionStateException`
- `OperationNotAllowedException`
- `ResourceAlreadyExistsException`

## Global Exception Filters

### HttpExceptionFilter

Catches all HTTP exceptions and formats them into standardized error responses. Handles:
- Custom `BaseHttpException` instances
- Standard NestJS `HttpException` instances
- Error logging with context
- Sentry integration for server errors (5xx)

### AllExceptionsFilter

Catches all exceptions (including non-HTTP exceptions) as a fallback. Ensures no unhandled exceptions escape the application.

## Validation Pipe

The `CustomValidationPipe` provides:
- Automatic validation using `class-validator`
- Detailed error messages for each field
- Nested object validation
- Whitelist and forbid non-whitelisted properties
- Automatic transformation

## Error Response Format

All errors return a consistent response structure:

```json
{
  "success": false,
  "errorCode": "4008",
  "message": "You do not have sufficient funds to complete this transaction.",
  "details": "Insufficient funds. Current balance: 100, Required: 500",
  "validationErrors": [
    {
      "field": "email",
      "message": "email must be an email",
      "rejectedValue": "invalid-email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ],
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "stack": "...", // Only in development
  "metadata": {
    "currentBalance": 100,
    "requiredAmount": 500
  }
}
```

### Response Fields

- `success`: Always `false` for errors
- `errorCode`: Error code from `ErrorCode` enum
- `message`: User-friendly error message (safe to display)
- `details`: Technical error message (may contain sensitive info, only in development)
- `validationErrors`: Array of validation errors (only for validation failures)
- `requestId`: Request ID for tracking (from middleware)
- `timestamp`: ISO timestamp of the error
- `stack`: Stack trace (only in development)
- `metadata`: Additional error context

## Sentry Integration

Sentry is integrated for error tracking and monitoring. Configuration:

1. Set `SENTRY_DSN` environment variable
2. Sentry automatically captures:
   - All server errors (5xx)
   - Unhandled exceptions
   - Errors with full context (request, headers, body)
   - Sensitive data is automatically sanitized

### Environment Variables

```bash
SENTRY_DSN=your-sentry-dsn
NODE_ENV=production
APP_VERSION=1.0.0
```

## Retry Logic

The retry utility provides exponential backoff for transient errors:

```typescript
import { retry } from './common/utils/retry.util';

// Retry with default options
const result = await retry(() => externalServiceCall());

// Retry with custom options
const result = await retry(() => externalServiceCall(), {
  maxAttempts: 5,
  initialDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  isRetryable: (error) => error.status >= 500,
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt}: ${error.message}`);
  },
});
```

### Retry Decorator

```typescript
import { Retryable } from './common/utils/retry.util';

class MyService {
  @Retryable({ maxAttempts: 3 })
  async callExternalService() {
    // This method will automatically retry on failure
  }
}
```

## Error Monitoring

The error monitoring service provides:

- In-memory error logging
- Error statistics by code and status
- Recent error retrieval
- Integration with Sentry

### Monitoring Endpoints

- `GET /monitoring/errors/statistics?hours=24` - Get error statistics
- `GET /monitoring/errors/by-code?code=4008&limit=10` - Get errors by code
- `GET /monitoring/errors/clear` - Clear error logs

**Note**: In production, these endpoints should be protected with authentication.

## Usage Examples

### Throwing Custom Exceptions

```typescript
import { NotFoundException, InsufficientFundsException } from './common/errors';

// HTTP Exception
throw new NotFoundException('User not found', { userId: '123' });

// Business Exception
throw new InsufficientFundsException(100, 500, { transactionId: 'tx-123' });
```

### Validation with DTOs

```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

// In controller
@Post('users')
async createUser(@Body() createUserDto: CreateUserDto) {
  // Validation happens automatically via CustomValidationPipe
  return this.userService.create(createUserDto);
}
```

### Handling Errors in Services

```typescript
import { Injectable } from '@nestjs/common';
import { WalletNotFoundException, InsufficientFundsException } from './common/errors';

@Injectable()
export class WalletService {
  async transfer(walletId: string, amount: number) {
    const wallet = await this.findWallet(walletId);
    if (!wallet) {
      throw new WalletNotFoundException(walletId);
    }

    if (wallet.balance < amount) {
      throw new InsufficientFundsException(wallet.balance, amount);
    }

    // Process transfer...
  }
}
```

## Error Codes Reference

### General/System Errors (1xxx)

| Code | Name | HTTP Status | Description |
|------|------|-------------|-------------|
| 1000 | INTERNAL_SERVER_ERROR | 500 | An internal server error occurred |
| 1001 | NOT_IMPLEMENTED | 501 | This feature is not yet implemented |
| 1002 | SERVICE_UNAVAILABLE | 503 | Service is temporarily unavailable |
| 1003 | TIMEOUT | 504 | Request timeout |
| 1004 | RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded |

### Validation Errors (2xxx)

| Code | Name | HTTP Status | Description |
|------|------|-------------|-------------|
| 2000 | VALIDATION_ERROR | 400 | Validation error |
| 2001 | INVALID_INPUT | 400 | Invalid input provided |
| 2002 | MISSING_REQUIRED_FIELD | 400 | Required field is missing |
| 2003 | INVALID_FORMAT | 400 | Invalid format |
| 2004 | INVALID_EMAIL | 400 | Invalid email address |
| 2005 | INVALID_PHONE | 400 | Invalid phone number |
| 2006 | INVALID_DATE | 400 | Invalid date |
| 2007 | VALUE_TOO_LONG | 400 | Value is too long |
| 2008 | VALUE_TOO_SHORT | 400 | Value is too short |
| 2009 | INVALID_RANGE | 400 | Invalid range |

### Authentication/Authorization Errors (3xxx)

| Code | Name | HTTP Status | Description |
|------|------|-------------|-------------|
| 3000 | UNAUTHORIZED | 401 | Unauthorized access |
| 3001 | FORBIDDEN | 403 | Access forbidden |
| 3002 | INVALID_CREDENTIALS | 401 | Invalid credentials |
| 3003 | TOKEN_EXPIRED | 401 | Token has expired |
| 3004 | TOKEN_INVALID | 401 | Invalid token |
| 3005 | SESSION_EXPIRED | 401 | Session has expired |
| 3006 | INSUFFICIENT_PERMISSIONS | 403 | Insufficient permissions |

### Business Logic Errors (4xxx)

| Code | Name | HTTP Status | Description |
|------|------|-------------|-------------|
| 4000 | NOT_FOUND | 404 | Resource not found |
| 4001 | RESOURCE_NOT_FOUND | 404 | Resource not found |
| 4002 | USER_NOT_FOUND | 404 | User not found |
| 4003 | WALLET_NOT_FOUND | 404 | Wallet not found |
| 4004 | TRANSACTION_NOT_FOUND | 404 | Transaction not found |
| 4005 | DUPLICATE_ENTRY | 409 | Duplicate entry |
| 4006 | RESOURCE_ALREADY_EXISTS | 409 | Resource already exists |
| 4007 | OPERATION_NOT_ALLOWED | 403 | Operation not allowed |
| 4008 | INSUFFICIENT_FUNDS | 400 | Insufficient funds |
| 4009 | WALLET_LOCKED | 423 | Wallet is locked |
| 4010 | TRANSACTION_LIMIT_EXCEEDED | 400 | Transaction limit exceeded |
| 4011 | INVALID_TRANSACTION_STATE | 400 | Invalid transaction state |

### External Service Errors (5xxx)

| Code | Name | HTTP Status | Description |
|------|------|-------------|-------------|
| 5000 | EXTERNAL_SERVICE_ERROR | 502 | External service error |
| 5001 | EXTERNAL_SERVICE_TIMEOUT | 504 | External service timeout |
| 5002 | EXTERNAL_SERVICE_UNAVAILABLE | 503 | External service unavailable |
| 5003 | API_RATE_LIMIT_EXCEEDED | 429 | API rate limit exceeded |

### Database Errors (6xxx)

| Code | Name | HTTP Status | Description |
|------|------|-------------|-------------|
| 6000 | DATABASE_ERROR | 500 | Database error |
| 6001 | DATABASE_CONNECTION_ERROR | 503 | Database connection error |
| 6002 | DATABASE_QUERY_ERROR | 500 | Database query error |
| 6003 | DATABASE_TRANSACTION_ERROR | 500 | Database transaction error |
| 6004 | CONSTRAINT_VIOLATION | 400 | Database constraint violation |

### Payment/Transaction Errors (7xxx)

| Code | Name | HTTP Status | Description |
|------|------|-------------|-------------|
| 7000 | PAYMENT_ERROR | 500 | Payment error |
| 7001 | PAYMENT_FAILED | 402 | Payment failed |
| 7002 | PAYMENT_DECLINED | 402 | Payment declined |
| 7003 | PAYMENT_PROCESSING_ERROR | 500 | Payment processing error |
| 7004 | INVALID_PAYMENT_METHOD | 400 | Invalid payment method |
| 7005 | PAYMENT_TIMEOUT | 504 | Payment timeout |

## Best Practices

1. **Always use custom exceptions** - Use the provided exception classes instead of throwing generic errors
2. **Include metadata** - Provide context in exception metadata for better debugging
3. **User-friendly messages** - Error messages shown to users should not expose sensitive information
4. **Logging** - All errors are automatically logged with context
5. **Sentry** - Server errors (5xx) are automatically sent to Sentry
6. **Validation** - Use DTOs with class-validator decorators for automatic validation
7. **Retry logic** - Use retry utility for transient errors in external service calls

## Security Considerations

- Sensitive data (passwords, tokens, etc.) is automatically sanitized in logs and Sentry
- User-facing error messages don't expose sensitive information
- Stack traces are only included in development mode
- Request headers and bodies are sanitized before logging

## Testing

When testing error handling:

1. Test that exceptions return the correct error code
2. Verify error messages are user-friendly
3. Ensure sensitive data is not exposed
4. Check that errors are logged correctly
5. Verify Sentry integration (in test environment)

## Troubleshooting

### Errors not being caught

- Ensure global exception filters are registered in `main.ts`
- Check filter order (AllExceptionsFilter should be last)

### Validation not working

- Ensure `CustomValidationPipe` is registered globally
- Verify DTOs use class-validator decorators
- Check that DTOs are properly typed in controller methods

### Sentry not capturing errors

- Verify `SENTRY_DSN` is set
- Check that errors have status >= 500
- Review Sentry dashboard for configuration issues
