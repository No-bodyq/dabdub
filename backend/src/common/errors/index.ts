/**
 * Error Handling Module Exports
 * Central export point for all error-related classes and utilities
 */

// Error Codes
export { ErrorCode, ErrorCodeMetadata } from './error-codes.enum';

// Error Response DTOs
export { ErrorResponseDto, ValidationError } from './error-response.dto';

// HTTP Exceptions
export {
  BaseHttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  LockedException,
  TooManyRequestsException,
  InternalServerErrorException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
  ValidationException,
} from './exceptions/http-exceptions';

// Business Logic Exceptions
export {
  BusinessException,
  InsufficientFundsException,
  WalletNotFoundException,
  UserNotFoundException,
  TransactionNotFoundException,
  WalletLockedException,
  TransactionLimitExceededException,
  InvalidTransactionStateException,
  OperationNotAllowedException,
  ResourceAlreadyExistsException,
} from './exceptions/business-exceptions';
