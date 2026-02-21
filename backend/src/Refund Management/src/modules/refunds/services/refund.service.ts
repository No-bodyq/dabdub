import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Refund } from "../entities/refund.entity";
import { InitiateRefundDto, RetryRefundDto } from "../dtos/refund.dto";
import { RefundStatus, RefundMethod, AuditAction } from "../../../common/enums";
import { AuditService } from "../../audit/services/audit.service";

export interface Transaction {
  id: string;
  usdAmount: string;
  status: string;
  merchantId: string;
}

export interface Merchant {
  id: string;
  balance: string;
}

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectQueue("refund-processing")
    private refundQueue: Queue,
    private auditService: AuditService,
  ) {}

  async initiateRefund(
    transactionId: string,
    dto: InitiateRefundDto,
    userId: string,
    userRole: string,
  ): Promise<Refund> {
    // Fetch transaction (mock implementation - in real app, use TransactionService)
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    // Validate transaction status
    if (!["SETTLED", "CONFIRMED"].includes(transaction.status)) {
      throw new BadRequestException(
        `Cannot refund transaction with status ${transaction.status}. Only SETTLED or CONFIRMED transactions can be refunded.`,
      );
    }

    // Calculate already refunded amount
    const alreadyRefunded =
      await this.calculateAlreadyRefundedAmount(transactionId);
    const transactionAmount = parseFloat(transaction.usdAmount);
    const alreadyRefundedAmount = parseFloat(alreadyRefunded);
    const refundAmount = parseFloat(dto.refundAmountUsd);

    // Validate no over-refunding
    if (alreadyRefundedAmount + refundAmount > transactionAmount) {
      throw new BadRequestException(
        `Refund amount exceeds available balance. Transaction: ${transactionAmount}, Already refunded: ${alreadyRefundedAmount}, Requested: ${refundAmount}`,
      );
    }

    // Check merchant balance for FIAT_DEDUCTION
    if (dto.method === RefundMethod.FIAT_DEDUCTION) {
      const merchant = await this.getMerchant(transaction.merchantId);
      if (!merchant) {
        throw new NotFoundException(
          `Merchant ${transaction.merchantId} not found`,
        );
      }

      const merchantBalance = parseFloat(merchant.balance);
      if (merchantBalance < refundAmount) {
        throw new ForbiddenException(
          `Merchant has insufficient balance. Available: ${merchantBalance}, Requested: ${refundAmount}`,
        );
      }
    }

    // Create refund record
    const refund = this.refundRepository.create({
      transactionId,
      merchantId: transaction.merchantId,
      initiatedById: userId,
      refundAmountUsd: dto.refundAmountUsd,
      refundAmountToken: null,
      method: dto.method,
      status: RefundStatus.INITIATED,
      reason: dto.reason,
      internalNote: dto.internalNote,
      failureReason: null,
      retryCount: 0,
    });

    const savedRefund = await this.refundRepository.save(refund);

    // Queue refund processing job
    await this.refundQueue.add(
      "process-refund",
      { refundId: savedRefund.id },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );

    // Audit log
    await this.auditService.log({
      action: AuditAction.REFUND_INITIATED,
      actorId: userId,
      actorRole: userRole,
      resourceType: "Refund",
      resourceId: savedRefund.id,
      changes: {
        transactionId,
        amount: dto.refundAmountUsd,
        method: dto.method,
        reason: dto.reason,
      },
    });

    return savedRefund;
  }

  async getRefund(refundId: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException(`Refund ${refundId} not found`);
    }

    return refund;
  }

  async listRefunds(
    filters: {
      merchantId?: string;
      status?: RefundStatus;
      method?: RefundMethod;
      reason?: string;
      createdAfter?: Date;
      createdBefore?: Date;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Refund[]; total: number; page: number; limit: number }> {
    const query = this.refundRepository.createQueryBuilder("refund");

    if (filters.merchantId) {
      query.andWhere("refund.merchantId = :merchantId", {
        merchantId: filters.merchantId,
      });
    }

    if (filters.status) {
      query.andWhere("refund.status = :status", { status: filters.status });
    }

    if (filters.method) {
      query.andWhere("refund.method = :method", { method: filters.method });
    }

    if (filters.reason) {
      query.andWhere("refund.reason = :reason", { reason: filters.reason });
    }

    if (filters.createdAfter) {
      query.andWhere("refund.createdAt >= :createdAfter", {
        createdAfter: filters.createdAfter,
      });
    }

    if (filters.createdBefore) {
      query.andWhere("refund.createdAt <= :createdBefore", {
        createdBefore: filters.createdBefore,
      });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy("refund.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  async retryRefund(
    refundId: string,
    userId: string,
    userRole: string,
  ): Promise<Refund> {
    const refund = await this.getRefund(refundId);

    if (refund.status !== RefundStatus.FAILED) {
      throw new BadRequestException(
        `Cannot retry refund with status ${refund.status}. Only FAILED refunds can be retried.`,
      );
    }

    if (refund.retryCount >= 3) {
      throw new BadRequestException(
        `Retry limit (3) exceeded for refund ${refundId}`,
      );
    }

    // Reset status and increment retry count
    refund.status = RefundStatus.INITIATED;
    refund.retryCount += 1;
    refund.failureReason = null;

    const updatedRefund = await this.refundRepository.save(refund);

    // Re-queue processing job
    await this.refundQueue.add(
      "process-refund",
      { refundId: updatedRefund.id },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );

    // Audit log
    await this.auditService.log({
      action: AuditAction.REFUND_RETRIED,
      actorId: userId,
      actorRole: userRole,
      resourceType: "Refund",
      resourceId: refundId,
      changes: {
        retryCount: updatedRefund.retryCount,
        status: RefundStatus.INITIATED,
      },
      reason: `Retry attempt ${updatedRefund.retryCount}`,
    });

    return updatedRefund;
  }

  async updateRefundStatus(
    refundId: string,
    status: RefundStatus,
    updates?: {
      onChainTxHash?: string;
      completedAt?: Date;
      failureReason?: string;
    },
  ): Promise<Refund> {
    const refund = await this.getRefund(refundId);
    refund.status = status;

    if (updates) {
      if (updates.onChainTxHash) {
        refund.onChainTxHash = updates.onChainTxHash;
      }
      if (updates.completedAt) {
        refund.completedAt = updates.completedAt;
      }
      if (updates.failureReason) {
        refund.failureReason = updates.failureReason;
      }
    }

    return this.refundRepository.save(refund);
  }

  private async calculateAlreadyRefundedAmount(
    transactionId: string,
  ): Promise<string> {
    const result = await this.refundRepository
      .createQueryBuilder("refund")
      .select("SUM(CAST(refund.refundAmountUsd AS DECIMAL))", "total")
      .where("refund.transactionId = :transactionId", { transactionId })
      .andWhere("refund.status = :status", { status: RefundStatus.COMPLETED })
      .getRawOne();

    return (result?.total || 0).toString();
  }

  private async getTransaction(id: string): Promise<Transaction | null> {
    // Mock implementation - replace with actual TransactionService call
    // For now, return a mock transaction for testing
    return {
      id,
      usdAmount: "1000.00",
      status: "SETTLED",
      merchantId: "merchant-123",
    };
  }

  private async getMerchant(id: string): Promise<Merchant | null> {
    // Mock implementation - replace with actual MerchantService call
    return {
      id,
      balance: "5000.00",
    };
  }
}
