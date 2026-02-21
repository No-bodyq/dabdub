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
  refreshToken: string;
}

export class AdminSessionDto {
  @ApiProperty({ description: 'Session ID', example: 'session_uuid' })
  sessionId: string;

  @ApiProperty({ description: 'IP Address', example: '192.168.1.1' })
  ip: string;

  @ApiProperty({ description: 'User Agent', example: 'Mozilla/5.0...' })
  userAgent: string;

  @ApiProperty({ description: 'Creation time', example: '2026-02-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last used time', example: '2026-02-18T15:30:00Z' })
  lastUsedAt: string;

  @ApiProperty({ description: 'Is current session', example: true })
  isCurrent: boolean;
}

export class AdminSessionListResponseDto {
  @ApiProperty({ type: [AdminSessionDto] })
  sessions: AdminSessionDto[];
}