import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'User password with minimum 8 characters, uppercase, lowercase, numbers, and special characters',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain uppercase, lowercase, number, and special character',
    },
  )
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Two-factor authentication code (required if 2FA enabled)',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token received from login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({
    description: 'Email address for password reset',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;
}

export class PasswordResetDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'reset-token-uuid',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePass456!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class TwoFactorEnableDto {
  @ApiProperty({
    description: 'Six-digit code from authenticator app',
    example: '123456',
  })
  @IsString()
  code: string;
}

export class ApiKeyCreateDto {
  @ApiProperty({
    description: 'Friendly name for the API key',
    example: 'Production Integration',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'List of permissions for this key',
    example: ['settlements:read', 'webhooks:write'],
    isArray: true,
  })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'ISO date when API key expires',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  expiresAt?: Date;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'user_123456',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User role',
    example: 'merchant',
    enum: ['admin', 'merchant', 'user'],
  })
  role: string;

  @ApiProperty({
    description: 'Whether user account is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether email is verified',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Whether two-factor authentication is enabled',
    example: false,
  })
  twoFactorEnabled: boolean;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for API requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiPropertyOptional({
    description: 'Indicates 2FA is required',
    example: false,
  })
  requiresTwoFactor?: boolean;
}
