import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WsModule } from '../ws/ws.module';
import { AdminAlertController } from './admin-alert.controller';
import { AdminAlert } from './admin-alert.entity';
import { AdminAlertService } from './admin-alert.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAlert]), WsModule],
  controllers: [AdminAlertController],
  providers: [AdminAlertService],
  exports: [AdminAlertService],
})
export class AdminAlertModule {}
