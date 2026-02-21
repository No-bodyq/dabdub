import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class PaymentMetrics {
  constructor(
    @InjectMetric('payment_processed_total')
    public paymentProcessedTotal: Counter<string>,
    @InjectMetric('payment_failed_total')
    public paymentFailedTotal: Counter<string>,
  ) {}

  incrementPaymentProcessed(currency: string) {
    this.paymentProcessedTotal.labels(currency).inc();
  }

  incrementPaymentFailed(currency: string, reason: string) {
    this.paymentFailedTotal.labels(currency, reason).inc();
  }
}
