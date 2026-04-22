import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ConfigType } from '@nestjs/config';
import { Repository } from 'typeorm';
import { zeptoConfig } from '../config';
import { adminAlertConfig } from '../config/admin-alert.config';
import { CheeseGateway, WS_EVENTS } from '../ws/cheese.gateway';
import {
  AdminAlert,
  AdminAlertStatus,
  AdminAlertType,
} from './admin-alert.entity';

interface RaiseAlertInput {
  type: AdminAlertType;
  dedupeKey: string;
  message: string;
  metadata?: Record<string, unknown>;
  thresholdValue: number;
}

@Injectable()
export class AdminAlertService {
  private readonly logger = new Logger(AdminAlertService.name);

  constructor(
    @InjectRepository(AdminAlert)
    private readonly adminAlertRepo: Repository<AdminAlert>,
    @Inject(adminAlertConfig.KEY)
    private readonly config: ConfigType<typeof adminAlertConfig>,
    @Inject(zeptoConfig.KEY)
    private readonly zepto: ConfigType<typeof zeptoConfig>,
    private readonly cheeseGateway: CheeseGateway,
  ) {}

  async raise(input: RaiseAlertInput): Promise<AdminAlert | null> {
    if (!this.meetsThreshold(input.type, input.thresholdValue)) {
      return null;
    }

    const now = new Date();
    const existing = await this.adminAlertRepo.findOne({
      where: {
        type: input.type,
        dedupeKey: input.dedupeKey,
      },
    });

    if (existing) {
      existing.message = input.message;
      existing.metadata = input.metadata ?? null;
      existing.thresholdValue = input.thresholdValue;
      existing.occurrenceCount += 1;

      if (this.isCoolingDown(existing, now)) {
        return this.adminAlertRepo.save(existing);
      }

      existing.status = AdminAlertStatus.OPEN;
      existing.acknowledgedAt = null;
      existing.acknowledgedBy = null;
      existing.lastNotifiedAt = now;

      const saved = await this.adminAlertRepo.save(existing);
      await this.notify(saved);
      return saved;
    }

    const created = this.adminAlertRepo.create({
      type: input.type,
      dedupeKey: input.dedupeKey,
      message: input.message,
      metadata: input.metadata ?? null,
      thresholdValue: input.thresholdValue,
      occurrenceCount: 1,
      lastNotifiedAt: now,
      status: AdminAlertStatus.OPEN,
      acknowledgedAt: null,
      acknowledgedBy: null,
    });

    const saved = await this.adminAlertRepo.save(created);
    await this.notify(saved);
    return saved;
  }

  async list(): Promise<AdminAlert[]> {
    return this.adminAlertRepo.find({
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async acknowledge(id: string, adminId: string): Promise<AdminAlert> {
    const alert = await this.adminAlertRepo.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException(`AdminAlert ${id} not found`);
    }

    alert.status = AdminAlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = adminId;
    return this.adminAlertRepo.save(alert);
  }

  private meetsThreshold(type: AdminAlertType, value: number): boolean {
    if (type === AdminAlertType.REDIS_HEALTH) {
      return value >= this.config.redisFailureThreshold;
    }

    return value >= this.config.stellarFailureThreshold;
  }

  private isCoolingDown(alert: AdminAlert, now: Date): boolean {
    if (!alert.lastNotifiedAt) {
      return false;
    }

    const cooldownMs = this.config.cooldownMinutes * 60_000;
    return now.getTime() - alert.lastNotifiedAt.getTime() < cooldownMs;
  }

  private async notify(alert: AdminAlert): Promise<void> {
    await Promise.allSettled([
      this.notifySlack(alert),
      this.notifyEmail(alert),
      Promise.resolve(
        this.cheeseGateway.emitToAdmins(WS_EVENTS.NOTIFICATION_NEW, {
          type: alert.type,
          message: alert.message,
          occurrenceCount: alert.occurrenceCount,
        }),
      ),
    ]);
  }

  private async notifySlack(alert: AdminAlert): Promise<void> {
    if (!this.config.slackWebhookUrl) {
      return;
    }

    const response = await fetch(this.config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[${alert.type}] ${alert.message}`,
      }),
    });

    if (!response.ok) {
      this.logger.warn(
        `Slack alert delivery failed with HTTP ${response.status}`,
      );
    }
  }

  private async notifyEmail(alert: AdminAlert): Promise<void> {
    if (!this.config.emailRecipient) {
      return;
    }

    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: this.zepto.apiKey,
      },
      body: JSON.stringify({
        from: {
          address: this.zepto.fromEmail,
        },
        to: [
          {
            email_address: {
              address: this.config.emailRecipient,
            },
          },
        ],
        subject: `[Admin Alert] ${alert.type}`,
        htmlbody: `<p>${alert.message}</p><pre>${JSON.stringify(alert.metadata ?? {}, null, 2)}</pre>`,
      }),
    });

    if (!response.ok) {
      this.logger.warn(
        `Email alert delivery failed with HTTP ${response.status}`,
      );
    }
  }
}
