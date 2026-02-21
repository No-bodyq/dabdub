import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ValidationException,
  InsufficientFundsException,
  WalletNotFoundException,
} from './exceptions/http-exceptions';
import { ErrorCode } from './error-codes.enum';
import { ErrorResponseDto } from './error-response.dto';

describe('Error Handling System', () => {
  describe('HTTP Exceptions', () => {
    it('should create BadRequestException with correct error code', () => {
      const exception = new BadRequestException('Invalid input');
      expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(exception.getStatus()).toBe(400);
    });

    it('should create NotFoundException with correct error code', () => {
      const exception = new NotFoundException('Resource not found');
      expect(exception.errorCode).toBe(ErrorCode.NOT_FOUND);
      expect(exception.getStatus()).toBe(404);
    });

    it('should create UnauthorizedException with correct error code', () => {
      const exception = new UnauthorizedException('Unauthorized');
      expect(exception.errorCode).toBe(ErrorCode.UNAUTHORIZED);
      expect(exception.getStatus()).toBe(401);
    });

    it('should convert exception to ErrorResponseDto', () => {
      const exception = new NotFoundException('User not found', {
        userId: '123',
      });
      const errorResponse = exception.toErrorResponse('req-123', false);

      expect(errorResponse).toBeInstanceOf(ErrorResponseDto);
      expect(errorResponse.errorCode).toBe(ErrorCode.NOT_FOUND);
      expect(errorResponse.message).toBeTruthy();
      expect(errorResponse.requestId).toBe('req-123');
      expect(errorResponse.metadata).toEqual({ userId: '123' });
    });

    it('should include stack trace in development mode', () => {
      const exception = new BadRequestException('Test error');
      const errorResponse = exception.toErrorResponse('req-123', true);

      expect(errorResponse.stack).toBeDefined();
    });
  });

  describe('Business Exceptions', () => {
    it('should create InsufficientFundsException with metadata', () => {
      const exception = new InsufficientFundsException(100, 500);
      expect(exception.errorCode).toBe(ErrorCode.INSUFFICIENT_FUNDS);
      expect(exception.getStatus()).toBe(400);
      expect(exception.metadata).toHaveProperty('currentBalance', 100);
      expect(exception.metadata).toHaveProperty('requiredAmount', 500);
    });

    it('should create WalletNotFoundException with wallet ID', () => {
      const exception = new WalletNotFoundException('wallet-123');
      expect(exception.errorCode).toBe(ErrorCode.WALLET_NOT_FOUND);
      expect(exception.getStatus()).toBe(404);
      expect(exception.metadata).toHaveProperty('walletId', 'wallet-123');
    });
  });

  describe('Validation Exception', () => {
    it('should create ValidationException with validation errors', () => {
      const validationErrors = [
        {
          field: 'email',
          message: 'email must be an email',
          rejectedValue: 'invalid-email',
          constraints: { isEmail: 'email must be an email' },
        },
        {
          field: 'password',
          message: 'password must be longer than or equal to 8 characters',
          rejectedValue: 'short',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
          },
        },
      ] as any;

      const exception = new ValidationException(validationErrors);
      expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(exception.getStatus()).toBe(400);
      expect(exception.validationErrors).toHaveLength(2);

      const errorResponse = exception.toErrorResponse('req-123', false);
      expect(errorResponse.validationErrors).toHaveLength(2);
      expect(errorResponse.validationErrors?.[0].field).toBe('email');
    });
  });

  describe('Error Response DTO', () => {
    it('should create ErrorResponseDto with all fields', () => {
      const errorResponse = new ErrorResponseDto({
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An error occurred',
        details: 'Technical details',
        requestId: 'req-123',
        timestamp: '2024-01-15T10:30:00.000Z',
        metadata: { key: 'value' },
      });

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(errorResponse.message).toBe('An error occurred');
      expect(errorResponse.details).toBe('Technical details');
      expect(errorResponse.requestId).toBe('req-123');
      expect(errorResponse.metadata).toEqual({ key: 'value' });
    });

    it('should have default values', () => {
      const errorResponse = new ErrorResponseDto({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
      });

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.timestamp).toBeDefined();
    });
  });

  describe('Error Codes', () => {
    it('should have all error codes defined', () => {
      expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe('1000');
      expect(ErrorCode.VALIDATION_ERROR).toBe('2000');
      expect(ErrorCode.UNAUTHORIZED).toBe('3000');
      expect(ErrorCode.INSUFFICIENT_FUNDS).toBe('4008');
      expect(ErrorCode.PAYMENT_FAILED).toBe('7001');
    });

    it('should have metadata for all error codes', () => {
      const { ErrorCodeMetadata } = require('./error-codes.enum');
      const allCodes = Object.values(ErrorCode);

      for (const code of allCodes) {
        expect(ErrorCodeMetadata[code]).toBeDefined();
        expect(ErrorCodeMetadata[code].message).toBeDefined();
        expect(ErrorCodeMetadata[code].httpStatus).toBeDefined();
        expect(ErrorCodeMetadata[code].userMessage).toBeDefined();
      }
    });
  });
});
