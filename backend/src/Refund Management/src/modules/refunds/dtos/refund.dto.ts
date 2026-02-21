import {
  IsDecimal,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  Min,
} from "class-validator";
import { RefundMethod, RefundReason } from "../../../common/enums";

export class InitiateRefundDto {
  @IsDecimal()
  @Min(0.01)
  refundAmountUsd: string;

  @IsEnum(RefundMethod)
  method: RefundMethod;

  @IsEnum(RefundReason)
  reason: RefundReason;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  internalNote: string;
}

export class RetryRefundDto {
  // No additional fields needed for retry
}

export class RefundResponseDto {
  id: string;
  transactionId: string;
  merchantId: string;
  refundAmountUsd: string;
  refundAmountToken: string | null;
  method: string;
  status: string;
  reason: string;
  internalNote: string;
  onChainTxHash: string | null;
  completedAt: Date | null;
  failureReason: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class RefundListResponseDto {
  data: RefundResponseDto[];
  total: number;
  page: number;
  limit: number;
}
