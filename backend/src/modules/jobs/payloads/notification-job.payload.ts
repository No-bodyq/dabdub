export interface NotificationJobPayload {
  notificationId: string;
  channel: 'email' | 'sms' | 'push';
  recipient: string;
  templateId?: string;
  data?: Record<string, unknown>;
  correlationId?: string;
}
