import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsObject } from 'class-validator';

export class ValidateSignatureDto {
  @ApiProperty({
    description: 'The webhook secret',
    example: 'whsec_...',
  })
  @IsString()
  @IsNotEmpty()
  secret!: string;

  @ApiProperty({
    description: 'The payload received in the webhook',
    example: { event: 'payment_request.completed', data: { id: '...' } },
  })
  @IsObject()
  @IsNotEmpty()
  payload: any;

  @ApiProperty({
    description: 'The signature from the x-dabdub-signature header',
    example: 'd2cc63f2...',
  })
  @IsString()
  @IsNotEmpty()
  signature!: string;

  @ApiProperty({
    description: 'The timestamp from the x-dabdub-timestamp header',
    example: 1737893233,
  })
  @IsNumber()
  @IsNotEmpty()
  timestamp!: number;
}
