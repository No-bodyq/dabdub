import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '../cache/cache.module';
import { WsModule } from '../ws/ws.module';
import { EmailModule } from '../email/email.module';
import { PushModule } from '../push/push.module';
import { UsersModule } from '../users/users.module';
import { MaintenanceWindow } from './entities/maintenance-window.entity';
import { MaintenanceService, MAINTENANCE_QUEUE } from './maintenance.service';
import { MaintenanceProcessor } from './maintenance.processor';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceAdminController } from './maintenance-admin.controller';
import { MaintenanceWindowMiddleware } from './middleware/maintenance-window.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceWindow]),
    BullModule.registerQueue({ name: MAINTENANCE_QUEUE }),
    CacheModule,
    WsModule,
    EmailModule,
    PushModule,
    UsersModule,
  ],
  providers: [
    MaintenanceService,
    MaintenanceProcessor,
    MaintenanceWindowMiddleware,
  ],
  controllers: [
    MaintenanceController,
    MaintenanceAdminController,
  ],
  exports: [
    MaintenanceService,
    MaintenanceWindowMiddleware,
  ],
})
export class MaintenanceModule {}