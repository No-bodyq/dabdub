import { HttpException } from '@nestjs/common';
import {
  ErrorCode,
  ErrorCodeMetadata,
} from '../../common/errors/error-codes.enum';

export class PaymentRequestException extends HttpException {
  public readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, detail?: string) {
    const metadata = ErrorCodeMetadata[errorCode];
    super(
      {
        errorCode,
        message: metadata.message,
        userMessage: metadata.userMessage,
        detail,
      },
      metadata.httpStatus,
    );
    this.errorCode = errorCode;
  }
}

export class PaymentRequestNotFoundException extends PaymentRequestException {
  constructor(id?: string) {
    super(
      ErrorCode.PAYMENT_REQUEST_NOT_FOUND,
      id ? `Payment request ${id} not found` : undefined,
    );
  }
}

export class PaymentRequestExpiredException extends PaymentRequestException {
  constructor(id?: string) {
    super(
      ErrorCode.PAYMENT_REQUEST_EXPIRED,
      id ? `Payment request ${id} has expired` : undefined,
    );
  }
}

export class PaymentRequestInvalidStatusException extends PaymentRequestException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      ErrorCode.PAYMENT_REQUEST_INVALID_STATUS,
      `Cannot transition from ${currentStatus} to ${targetStatus}`,
    );
  }
}

export class PaymentRequestDuplicateException extends PaymentRequestException {
  constructor(idempotencyKey: string) {
    super(
      ErrorCode.PAYMENT_REQUEST_DUPLICATE,
      `Duplicate idempotency key: ${idempotencyKey}`,
    );
  }
}

export class PaymentRequestAmountTooLowException extends PaymentRequestException {
  constructor(amount: number, min: number) {
    super(
      ErrorCode.PAYMENT_REQUEST_AMOUNT_TOO_LOW,
      `Amount ${amount} is below minimum ${min}`,
    );
  }
}

export class PaymentRequestAmountTooHighException extends PaymentRequestException {
  constructor(amount: number, max: number) {
    super(
      ErrorCode.PAYMENT_REQUEST_AMOUNT_TOO_HIGH,
      `Amount ${amount} exceeds maximum ${max}`,
    );
  }
}

export class PaymentRequestCannotCancelException extends PaymentRequestException {
  constructor(status: string) {
    super(
      ErrorCode.PAYMENT_REQUEST_CANNOT_CANCEL,
      `Cannot cancel payment request in status: ${status}`,
    );
  }
}

export class PaymentRequestQrFailedException extends PaymentRequestException {
  constructor(detail?: string) {
    super(ErrorCode.PAYMENT_REQUEST_QR_FAILED, detail);
  }
}

export class StellarContractException extends PaymentRequestException {
  constructor(detail?: string) {
    super(ErrorCode.STELLAR_CONTRACT_ERROR, detail);
  }
}

export class StellarNetworkException extends PaymentRequestException {
  constructor(detail?: string) {
    super(ErrorCode.STELLAR_NETWORK_ERROR, detail);
  }
}
