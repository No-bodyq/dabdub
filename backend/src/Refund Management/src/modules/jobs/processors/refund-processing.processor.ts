import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Refund } from "../../refunds/entities/refund.entity";
import { RefundStatus } from "../../../common/enums";

@Processor("refund-processing")
export class RefundProcessingProcessor {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
  ) {}

  @Process("process-refund")
  async processRefund(job: Job) {
    const { refundId } = job.data;

    try {
      const refund = await this.refundRepository.findOne({
        where: { id: refundId },
      });

      if (!refund) {
        throw new Error(`Refund ${refundId} not found`);
      }

      // Update status to PROCESSING
      refund.status = RefundStatus.PROCESSING;
      await this.refundRepository.save(refund);

      // Simulate refund processing
      // In a real implementation, this would:
      // 1. For CRYPTO_ONCHAIN: Call blockchain service to transfer tokens
      // 2. For FIAT_DEDUCTION: Deduct from merchant's next settlement

      await this.simulateProcessing();

      // Update status to COMPLETED
      refund.status = RefundStatus.COMPLETED;
      refund.completedAt = new Date();

      if (refund.method === "CRYPTO_ONCHAIN") {
        refund.onChainTxHash = `0x${Math.random().toString(16).slice(2)}`; // Mock tx hash
      }

      await this.refundRepository.save(refund);

      return {
        success: true,
        refundId,
        completedAt: refund.completedAt,
      };
    } catch (error) {
      const refund = await this.refundRepository.findOne({
        where: { id: refundId },
      });

      if (refund) {
        refund.status = RefundStatus.FAILED;
        refund.failureReason =
          error instanceof Error ? error.message : "Unknown error";
        await this.refundRepository.save(refund);
      }

      throw error;
    }
  }

  private async simulateProcessing(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
  }
}
