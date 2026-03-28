import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceStatus } from '../entities/maintenance-window.entity';

export class MaintenanceWindowResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  startAt!: Date;

  @ApiProperty()
  endAt!: Date;

  @ApiProperty()
  affectedServices!: string[];

  @ApiProperty({ enum: MaintenanceStatus })
  status!: MaintenanceStatus;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class MaintenanceErrorResponseDto {
  @ApiProperty({ example: 'MAINTENANCE' })
  code!: string;

  @ApiProperty({ example: 'Scheduled System Upgrade' })
  message!: string;

  @ApiProperty({ example: 'We will be upgrading our payment processing system...' })
  description!: string;

  @ApiProperty({ example: '2024-03-30T06:00:00Z' })
  estimatedRestoration!: Date;

  @ApiProperty({ example: ['transfers', 'withdrawals'] })
  affectedServices!: string[];
}