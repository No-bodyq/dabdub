import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsArray, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateMaintenanceWindowDto {
  @ApiProperty({ example: 'Scheduled System Upgrade', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({ 
    example: 'We will be upgrading our payment processing system to improve performance and reliability.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '2024-03-30T02:00:00Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2024-03-30T06:00:00Z' })
  @IsDateString()
  endAt!: string;

  @ApiProperty({ 
    example: ['transfers', 'withdrawals'],
    description: 'Services affected during maintenance. Use "all" to affect all services.',
  })
  @IsArray()
  @IsString({ each: true })
  affectedServices!: string[];
}