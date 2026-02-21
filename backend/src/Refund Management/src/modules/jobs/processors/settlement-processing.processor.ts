import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Settlement } from "../../settlements/entities/settlement.entity";
import { SettlementStatus } from "../../../common/enums";

@Processor("settlement-processing")
export class SettlementProcessingProcessor {
  constructor(
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
  ) {}

  @Process("process-settlement")
  async processSettlement(job: Job) {
    const { settlementId } = job.data;

    try {
      const settlement = await this.settlementRepository.findOne({
        where: { id: settlementId },
      });

      if (!settlement) {
        throw new Error(`Settlement ${settlementId} not found`);
      }

      // Skip processing if settlement is ON_HOLD
      if (settlement.status === SettlementStatus.ON_HOLD) {
        return {
          success: false,
          reason: "Settlement is on hold",
        };
      }

      // Update status to PROCESSING
      settlement.status = SettlementStatus.PROCESSING;
      settlement.processingStartedAt = new Date();
      await this.settlementRepository.save(settlement);

      // Simulate settlement processing
      // In a real implementation, this would:
      // 1. Call liquidity provider or bank API
      // 2. Initiate bank transfer
      // 3. Handle crypto to fiat conversion

      await this.simulateProcessing();

      // Update status to COMPLETED
      settlement.status = SettlementStatus.COMPLETED;
      settlement.completedAt = new Date();
      settlement.bankTransferReference = `BT-${Date.now()}`; // Mock reference
      settlement.liquidityProviderRef = `LP-${Date.now()}`; // Mock reference

      await this.settlementRepository.save(settlement);

      return {
        success: true,
        settlementId,
        completedAt: settlement.completedAt,
        transactionCount: settlement.transactionCount,
        amount: settlement.netAmountFiat,
      };
    } catch (error) {
      const settlement = await this.settlementRepository.findOne({
        where: { id: settlementId },
      });

      if (settlement) {
        settlement.status = SettlementStatus.FAILED;
        settlement.failureReason =
          error instanceof Error ? error.message : "Unknown error";
        await this.settlementRepository.save(settlement);
      }

      throw error;
    }
  }

  private async simulateProcessing(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.random() * 3000));
  }
}
