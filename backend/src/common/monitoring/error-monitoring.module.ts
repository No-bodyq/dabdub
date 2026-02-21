import { Module, Global } from '@nestjs/common';
import { ErrorMonitoringService } from './error-monitoring.service';

@Global()
@Module({
  providers: [ErrorMonitoringService],
  exports: [ErrorMonitoringService],
})
export class ErrorMonitoringModule {}
