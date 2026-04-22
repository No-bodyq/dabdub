import { registerAs } from '@nestjs/config';

export interface AdminAlertConfig {
  cooldownMinutes: number;
  emailRecipient: string | null;
  slackWebhookUrl: string | null;
  redisFailureThreshold: number;
  stellarFailureThreshold: number;
}

export const adminAlertConfig = registerAs(
  'adminAlert',
  (): AdminAlertConfig => ({
    cooldownMinutes: parseInt(
      process.env['ADMIN_ALERT_COOLDOWN_MINUTES'] ?? '30',
      10,
    ),
    emailRecipient: process.env['ADMIN_ALERT_EMAIL'] ?? null,
    slackWebhookUrl: process.env['ADMIN_ALERT_SLACK_WEBHOOK_URL'] ?? null,
    redisFailureThreshold: parseInt(
      process.env['ADMIN_ALERT_REDIS_FAILURE_THRESHOLD'] ?? '1',
      10,
    ),
    stellarFailureThreshold: parseInt(
      process.env['ADMIN_ALERT_STELLAR_FAILURE_THRESHOLD'] ?? '1',
      10,
    ),
  }),
);
