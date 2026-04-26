import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { RetryModule } from '../retry/retry.module';

@Module({
  imports: [RetryModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
