import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../errors/error-response.dto';
import { ErrorCode, ErrorCodeMetadata } from '../errors/error-codes.enum';
import * as Sentry from '@sentry/node';

/**
 * Global Exception Filter
 * Catches all exceptions (including non-HTTP exceptions) and formats them
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Extract request ID from request (set by middleware)
    const requestId = (request as any).requestId;

    // Handle HTTP exceptions (delegate to HttpExceptionFilter)
    if (exception instanceof HttpException) {
      // This will be caught by HttpExceptionFilter, but we handle it here as fallback
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const errorCode = this.determineErrorCode(status);
      const metadata = ErrorCodeMetadata[errorCode];

      const errorResponse = new ErrorResponseDto({
        errorCode,
        message: metadata?.userMessage || 'An error occurred',
        details:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any)?.message || exception.message,
        requestId,
        timestamp: new Date().toISOString(),
        stack: isDevelopment ? (exception as Error).stack : undefined,
      });

      this.logError(exception, request, errorResponse);
      this.sendToSentry(exception, request, errorResponse, status);

      return response.status(status).json(errorResponse);
    }

    // Handle non-HTTP exceptions (unexpected errors)
    const error = exception as Error;
    const errorResponse = new ErrorResponseDto({
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      message: ErrorCodeMetadata[ErrorCode.INTERNAL_SERVER_ERROR].userMessage,
      details: isDevelopment ? error.message : undefined,
      requestId,
      timestamp: new Date().toISOString(),
      stack: isDevelopment ? error.stack : undefined,
    });

    // Log error with full context
    this.logger.error(
      {
        message: error.message,
        stack: error.stack,
        errorCode: errorResponse.errorCode,
        requestId: errorResponse.requestId,
        method: request.method,
        url: request.url,
        userAgent: request.get('user-agent'),
        ip: request.ip,
      },
      'Unhandled Exception',
    );

    // Send to Sentry
    this.sendToSentry(
      exception,
      request,
      errorResponse,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    // Send response
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }

  /**
   * Determine error code based on HTTP status
   */
  private determineErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.DUPLICATE_ENTRY;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCode.INTERNAL_SERVER_ERROR;
      case HttpStatus.BAD_GATEWAY:
        return ErrorCode.EXTERNAL_SERVICE_ERROR;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      case HttpStatus.GATEWAY_TIMEOUT:
        return ErrorCode.TIMEOUT;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Log error with context
   */
  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponseDto,
  ): void {
    const error = exception as Error;
    const logContext = {
      errorCode: errorResponse.errorCode,
      requestId: errorResponse.requestId,
      method: request.method,
      url: request.url,
      userAgent: request.get('user-agent'),
      ip: request.ip,
    };

    this.logger.error(
      {
        message: error.message || 'Unknown error',
        stack: error.stack,
        ...logContext,
      },
      'Exception',
    );
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponseDto,
    status: number,
  ): void {
    // Only send server errors to Sentry
    if (status >= 500) {
      Sentry.captureException(exception, {
        tags: {
          errorCode: errorResponse.errorCode,
          requestId: errorResponse.requestId,
          statusCode: status.toString(),
        },
        extra: {
          request: {
            method: request.method,
            url: request.url,
            headers: this.sanitizeHeaders(request.headers),
            body: this.sanitizeBody(request.body),
          },
          errorResponse: errorResponse,
        },
        level: 'error',
      });
    }
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];
    const sanitized = { ...headers };
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '********';
      }
    });
    return sanitized;
  }

  /**
   * Sanitize request body for logging (remove sensitive data)
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }
    const sensitiveFields = [
      'password',
      'passwordConfirm',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'creditCard',
      'cvv',
    ];
    const sanitized = { ...body };
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '********';
      }
    });
    return sanitized;
  }
}
