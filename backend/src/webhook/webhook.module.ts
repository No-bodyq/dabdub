import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './controllers/webhook.controller';
import { WebhookMonitoringController } from './controllers/webhook-monitoring.controller';
import { WebhookDashboardController } from './controllers/webhook-dashboard.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookConfigurationEntity } from '../database/entities/webhook-configuration.entity';
import { WebhookDeliveryLogEntity } from '../database/entities/webhook-delivery-log.entity';
import { WebhookDeliveryLogMaintenanceService } from './services/webhook-delivery-log-maintenance.service';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import { WebhookHealthMonitorService } from './services/webhook-health-monitor.service';
import { WebhookMonitoringService } from './services/webhook-monitoring.service';
import { WebhookRetryService } from './services/webhook-retry.service';
import { WebhookTestingService } from './services/webhook-testing.service';
import { WebhookDashboardService } from './services/webhook-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookConfigurationEntity,
      WebhookDeliveryLogEntity,
    ]),
  ],
  controllers: [
    WebhookController,
    WebhookMonitoringController,
    WebhookDashboardController,
  ],
  providers: [
    WebhookService,
    WebhookDeliveryLogMaintenanceService,
    WebhookDeliveryService,
    WebhookHealthMonitorService,
    WebhookMonitoringService,
    WebhookRetryService,
    WebhookTestingService,
    WebhookDashboardService,
  ],
  exports: [
    WebhookService,
    WebhookDeliveryService,
    WebhookMonitoringService,
    WebhookRetryService,
    WebhookTestingService,
    WebhookDashboardService,
  ],
})
export class WebhookModule {}
