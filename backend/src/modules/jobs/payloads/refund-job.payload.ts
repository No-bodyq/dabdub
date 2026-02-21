export interface RefundJobPayload {
  refundId: string;
  paymentRequestId: string;
  merchantId: string;
  amount: string;
  currency: string;
  reason?: string;
  correlationId?: string;
}
