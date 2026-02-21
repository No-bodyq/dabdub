import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentRequestRepository } from '../repositories/payment-request.repository';
import { PaymentRequestStatus } from '../../database/entities/payment-request.entity';

@Injectable()
export class ExpirationSchedulerService {
  private readonly logger = new Logger(ExpirationSchedulerService.name);

  constructor(
    private readonly paymentRequestRepository: PaymentRequestRepository,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredRequests(): Promise<void> {
    this.logger.debug('Checking for expired payment requests...');

    const now = new Date();
    const expiredRequests =
      await this.paymentRequestRepository.findExpired(now);

    if (expiredRequests.length === 0) {
      this.logger.debug('No expired payment requests found.');
      return;
    }

    this.logger.log(
      `Found ${expiredRequests.length} expired payment requests.`,
    );

    const ids = expiredRequests.map((r) => r.id);

    await this.paymentRequestRepository.updateBatchStatus(
      ids,
      PaymentRequestStatus.EXPIRED,
    );

    // Update status history for each expired request
    for (const request of expiredRequests) {
      const statusHistory = request.statusHistory || [];
      statusHistory.push({
        status: PaymentRequestStatus.EXPIRED,
        timestamp: now.toISOString(),
        reason: 'Expired by scheduler',
      });

      await this.paymentRequestRepository.update(request.id, {
        statusHistory,
      });
    }

    this.logger.log(`Marked ${ids.length} payment requests as expired.`);
  }
}
