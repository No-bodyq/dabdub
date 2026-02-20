import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'SecureAdminPass123!',
  })
  @IsString()
  password: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for admin authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 7200,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Admin user information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'user_123' },
      email: { type: 'string', example: 'admin@example.com' },
      role: { 
        type: 'string', 
        enum: [UserRole.ADMIN, UserRole.SUPPORT_ADMIN],
        example: UserRole.ADMIN 
      },
    },
  })
  admin: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export class AdminRefreshTokenDto {
  @ApiProperty({
    description: 'Admin refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token: string;
}