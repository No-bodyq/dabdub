import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookConfigurationEntity } from '../../database/entities/webhook-configuration.entity';
import { CreateWebhookDto } from '../dto/webhook.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(WebhookConfigurationEntity)
    private readonly webhookRepository: Repository<WebhookConfigurationEntity>,
  ) {}

  async create(createWebhookDto: CreateWebhookDto): Promise<any> {
    // Validate webhook URL is reachable
    try {
      const response = await fetch(createWebhookDto.url, { method: 'HEAD', timeout: 5000 });
      if (!response.ok && response.status !== 404) {
        throw new BadRequestException('Webhook URL is not reachable');
      }
    } catch (error) {
      throw new BadRequestException('Webhook URL validation failed: ' + error.message);
    }

    const webhook = this.webhookRepository.create({
      id: `wh_${uuidv4()}`,
      url: createWebhookDto.url,
      events: createWebhookDto.events,
      secret: createWebhookDto.secret,
      isActive: createWebhookDto.isActive ?? true,
      failureCount: 0,
    });

    return this.webhookRepository.save(webhook);
  }

  async findAll(): Promise<WebhookConfigurationEntity[]> {
    return this.webhookRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<WebhookConfigurationEntity> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }
    return webhook;
  }

  async update(id: string, updateWebhookDto: CreateWebhookDto): Promise<WebhookConfigurationEntity> {
    const webhook = await this.findOne(id);

    if (updateWebhookDto.url) {
      webhook.url = updateWebhookDto.url;
    }
    if (updateWebhookDto.events) {
      webhook.events = updateWebhookDto.events;
    }
    if (updateWebhookDto.secret !== undefined) {
      webhook.secret = updateWebhookDto.secret;
    }
    if (updateWebhookDto.isActive !== undefined) {
      webhook.isActive = updateWebhookDto.isActive;
    }

    webhook.updatedAt = new Date();
    return this.webhookRepository.save(webhook);
  }

  async delete(id: string): Promise<void> {
    const webhook = await this.findOne(id);
    await this.webhookRepository.remove(webhook);
  }

  async incrementFailureCount(id: string): Promise<void> {
    await this.webhookRepository.increment({ id }, 'failureCount', 1);
  }

  async resetFailureCount(id: string): Promise<void> {
    await this.webhookRepository.update({ id }, { failureCount: 0, lastDeliveredAt: new Date() });
  }
}
