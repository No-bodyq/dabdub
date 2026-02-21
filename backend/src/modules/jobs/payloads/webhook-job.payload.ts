export interface WebhookJobPayload {
  webhookId: string;
  deliveryId: string;
  url: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  correlationId?: string;
}
