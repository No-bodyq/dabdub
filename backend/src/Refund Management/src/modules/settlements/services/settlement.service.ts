import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Settlement } from "../entities/settlement.entity";
import {
  TriggerSettlementDto,
  PutSettlementOnHoldDto,
  SettlementPendingDashboardDto,
  PendingMerchantSettlement,
} from "../dtos/settlement.dto";
import { SettlementStatus, AuditAction } from "../../../common/enums";
import { AuditService } from "../../audit/services/audit.service";

export interface SettlementMerchant {
  id: string;
  businessName: string;
  isActive: boolean;
}

export interface PendingTransaction {
  id: string;
  merchantId: string;
  usdAmount: string;
  createdAt: Date;
  status?: string;
}

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
    @InjectQueue("settlement-processing")
    private settlementQueue: Queue,
    private auditService: AuditService,
  ) {}

  async triggerSettlement(
    dto: TriggerSettlementDto,
    userId: string,
    userRole: string,
  ): Promise<Settlement> {
    // Validate merchant exists and is active
    const merchant = await this.getMerchant(dto.merchantId);
    if (!merchant) {
      throw new NotFoundException(`Merchant ${dto.merchantId} not found`);
    }

    if (!merchant.isActive) {
      throw new BadRequestException(`Merchant ${dto.merchantId} is not active`);
    }

    // Fetch target transactions
    let transactions: PendingTransaction[];
    if (dto.transactionIds && dto.transactionIds.length > 0) {
      // Validate specified transaction IDs
      transactions = await this.getTransactionsByIds(dto.transactionIds);

      // Verify all transactions belong to the specified merchant
      const invalidTransactions = transactions.filter(
        (t) => t.merchantId !== dto.merchantId,
      );
      if (invalidTransactions.length > 0) {
        throw new BadRequestException(
          `${invalidTransactions.length} transaction(s) do not belong to merchant ${dto.merchantId}`,
        );
      }
    } else {
      // Get all pending confirmed transactions for the merchant
      transactions = await this.getPendingTransactionsForMerchant(
        dto.merchantId,
      );
    }

    if (transactions.length === 0) {
      throw new BadRequestException(
        `No pending transactions found for merchant ${dto.merchantId}`,
      );
    }

    // Validate all transactions are in CONFIRMED or SETTLEMENT_PENDING status
    const invalidStatuses = transactions.filter(
      (t) =>
        !["CONFIRMED", "SETTLEMENT_PENDING"].includes(t.status || "CONFIRMED"),
    );
    if (invalidStatuses.length > 0) {
      throw new BadRequestException(
        `${invalidStatuses.length} transaction(s) have invalid status for settlement`,
      );
    }

    // Calculate settlement amounts (mock calculation)
    const grossAmountUsd = transactions
      .reduce((sum, t) => sum + parseFloat(t.usdAmount), 0)
      .toString();
    const totalFeesUsd = (parseFloat(grossAmountUsd) * 0.02).toString(); // 2% fee
    const netAmountFiat = (
      parseFloat(grossAmountUsd) - parseFloat(totalFeesUsd)
    ).toString();

    // Create Settlement record
    const settlement = this.settlementRepository.create({
      merchantId: dto.merchantId,
      transactionIds: transactions.map((t) => t.id),
      grossAmountUsd,
      totalFeesUsd,
      netAmountFiat,
      settlementCurrency: "USD",
      exchangeRateUsed: "1.00",
      status: SettlementStatus.PENDING,
      transactionCount: transactions.length,
      triggerReason: dto.reason,
      retryCount: 0,
    });

    const savedSettlement = await this.settlementRepository.save(settlement);

    // Enqueue SettlementProcessingJob
    await this.settlementQueue.add(
      "process-settlement",
      { settlementId: savedSettlement.id },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );

    // Audit log
    await this.auditService.log({
      action: AuditAction.SETTLEMENT_MANUALLY_TRIGGERED,
      actorId: userId,
      actorRole: userRole,
      resourceType: "Settlement",
      resourceId: savedSettlement.id,
      changes: {
        merchantId: dto.merchantId,
        transactionCount: transactions.length,
        grossAmountUsd,
        triggerReason: dto.reason,
      },
    });

    return savedSettlement;
  }

  async getSettlement(settlementId: string): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException(`Settlement ${settlementId} not found`);
    }

    return settlement;
  }

  async listSettlements(
    filters: {
      merchantId?: string;
      status?: SettlementStatus;
      currency?: string;
      createdAfter?: Date;
      createdBefore?: Date;
      minAmount?: number;
      maxAmount?: number;
    },
    page: number = 1,
    limit: number = 20,
    sortBy: string = "createdAt",
    sortOrder: "ASC" | "DESC" = "DESC",
  ): Promise<{
    data: Settlement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.settlementRepository.createQueryBuilder("settlement");

    if (filters.merchantId) {
      query.andWhere("settlement.merchantId = :merchantId", {
        merchantId: filters.merchantId,
      });
    }

    if (filters.status) {
      query.andWhere("settlement.status = :status", { status: filters.status });
    }

    if (filters.currency) {
      query.andWhere("settlement.settlementCurrency = :currency", {
        currency: filters.currency,
      });
    }

    if (filters.createdAfter) {
      query.andWhere("settlement.createdAt >= :createdAfter", {
        createdAfter: filters.createdAfter,
      });
    }

    if (filters.createdBefore) {
      query.andWhere("settlement.createdAt <= :createdBefore", {
        createdBefore: filters.createdBefore,
      });
    }

    if (filters.minAmount) {
      query.andWhere(
        "CAST(settlement.netAmountFiat AS DECIMAL) >= :minAmount",
        { minAmount: filters.minAmount },
      );
    }

    if (filters.maxAmount) {
      query.andWhere(
        "CAST(settlement.netAmountFiat AS DECIMAL) <= :maxAmount",
        { maxAmount: filters.maxAmount },
      );
    }

    const total = await query.getCount();
    const data = await query
      .orderBy(`settlement.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  async getPendingDashboard(): Promise<SettlementPendingDashboardDto> {
    // Mock implementation - in real app, aggregate from transactions table
    const pendingTransactions = await this.getPendingTransactionsAggregated();

    const pendingByMerchant: PendingMerchantSettlement[] = [];
    let totalTransactionCount = 0;
    let totalVolumeUsd = "0";

    for (const [merchantId, transactions] of Object.entries(
      pendingTransactions,
    )) {
      const merchant = await this.getMerchant(merchantId);
      const volumeUsd = transactions
        .reduce((sum: number, t: any) => sum + parseFloat(t.usdAmount), 0)
        .toString();

      if (merchant) {
        pendingByMerchant.push({
          merchant: {
            id: merchant.id,
            businessName: merchant.businessName,
          },
          pendingTransactionCount: transactions.length,
          pendingVolumeUsd: volumeUsd,
          oldestPendingAt: transactions.sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )[0]?.createdAt,
          settlementConfig: {
            currency: "USD",
            frequency: "DAILY",
          },
        });

        totalTransactionCount += transactions.length;
        totalVolumeUsd = (
          parseFloat(totalVolumeUsd) + parseFloat(volumeUsd)
        ).toString();
      }
    }

    return {
      pendingByMerchant,
      totals: {
        merchantCount: pendingByMerchant.length,
        transactionCount: totalTransactionCount,
        volumeUsd: totalVolumeUsd,
      },
    };
  }

  async retrySettlement(
    settlementId: string,
    userId: string,
    userRole: string,
  ): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);

    if (settlement.status !== SettlementStatus.FAILED) {
      throw new BadRequestException(
        `Cannot retry settlement with status ${settlement.status}. Only FAILED settlements can be retried.`,
      );
    }

    if (settlement.retryCount >= 3) {
      throw new BadRequestException(
        `Retry limit (3) exceeded for settlement ${settlementId}`,
      );
    }

    // Reset status and increment retry count
    settlement.status = SettlementStatus.PENDING;
    settlement.retryCount += 1;
    settlement.failureReason = null;

    const updatedSettlement = await this.settlementRepository.save(settlement);

    // Re-queue processing job
    await this.settlementQueue.add(
      "process-settlement",
      { settlementId: updatedSettlement.id },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );

    // Audit log
    await this.auditService.log({
      action: AuditAction.SETTLEMENT_RETRIED,
      actorId: userId,
      actorRole: userRole,
      resourceType: "Settlement",
      resourceId: settlementId,
      changes: {
        retryCount: updatedSettlement.retryCount,
        status: SettlementStatus.PENDING,
      },
      reason: `Retry attempt ${updatedSettlement.retryCount}`,
    });

    return updatedSettlement;
  }

  async putSettlementOnHold(
    settlementId: string,
    dto: PutSettlementOnHoldDto,
    userId: string,
    userRole: string,
  ): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);

    // Set status to ON_HOLD
    settlement.status = SettlementStatus.ON_HOLD;

    const updatedSettlement = await this.settlementRepository.save(settlement);

    // Cancel queued processing job (mock - in real app, use bull job management)
    // await this.settlementQueue.clean(0, 'active');

    // Audit log
    await this.auditService.log({
      action: AuditAction.SETTLEMENT_PUT_ON_HOLD,
      actorId: userId,
      actorRole: userRole,
      resourceType: "Settlement",
      resourceId: settlementId,
      changes: {
        status: SettlementStatus.ON_HOLD,
      },
      reason: dto.reason,
    });

    return updatedSettlement;
  }

  async updateSettlementStatus(
    settlementId: string,
    status: SettlementStatus,
    updates?: {
      bankTransferReference?: string;
      liquidityProviderRef?: string;
      failureReason?: string;
      processingStartedAt?: Date;
      completedAt?: Date;
    },
  ): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);
    settlement.status = status;

    if (updates) {
      if (updates.bankTransferReference) {
        settlement.bankTransferReference = updates.bankTransferReference;
      }
      if (updates.liquidityProviderRef) {
        settlement.liquidityProviderRef = updates.liquidityProviderRef;
      }
      if (updates.failureReason) {
        settlement.failureReason = updates.failureReason;
      }
      if (updates.processingStartedAt) {
        settlement.processingStartedAt = updates.processingStartedAt;
      }
      if (updates.completedAt) {
        settlement.completedAt = updates.completedAt;
      }
    }

    return this.settlementRepository.save(settlement);
  }

  private async getMerchant(id: string): Promise<SettlementMerchant | null> {
    // Mock implementation - replace with actual MerchantService call
    return {
      id,
      businessName: "Mock Business",
      isActive: true,
    };
  }

  private async getTransactionsByIds(
    ids: string[],
  ): Promise<PendingTransaction[]> {
    // Mock implementation - replace with actual TransactionService call
    return ids.map((id) => ({
      id,
      merchantId: "merchant-123",
      usdAmount: "100.00",
      createdAt: new Date(),
      status: "CONFIRMED",
    }));
  }

  private async getPendingTransactionsForMerchant(
    merchantId: string,
  ): Promise<PendingTransaction[]> {
    // Mock implementation
    return [
      {
        id: "tx-1",
        merchantId,
        usdAmount: "100.00",
        createdAt: new Date(),
        status: "CONFIRMED",
      },
      {
        id: "tx-2",
        merchantId,
        usdAmount: "200.00",
        createdAt: new Date(),
        status: "CONFIRMED",
      },
    ];
  }

  private async getPendingTransactionsAggregated(): Promise<
    Record<string, PendingTransaction[]>
  > {
    // Mock implementation
    return {
      "merchant-123": [
        {
          id: "tx-1",
          merchantId: "merchant-123",
          usdAmount: "100.00",
          createdAt: new Date(Date.now() - 86400000),
          status: "CONFIRMED",
        },
        {
          id: "tx-2",
          merchantId: "merchant-123",
          usdAmount: "200.00",
          createdAt: new Date(),
          status: "CONFIRMED",
        },
      ],
      "merchant-456": [
        {
          id: "tx-3",
          merchantId: "merchant-456",
          usdAmount: "150.00",
          createdAt: new Date(),
          status: "CONFIRMED",
        },
      ],
    };
  }
}
