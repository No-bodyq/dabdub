import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { ConfigType } from '@nestjs/config';
import { jwtConfig } from '../config/jwt.config';
import { User } from '../users/entities/user.entity';
import { Admin } from '../admin/entities/admin.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Session } from './entities/session.entity';
import { BiometricToken } from './entities/biometric-token.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BiometricAuthController } from './biometric-auth.controller';
import { BiometricAuthService } from './biometric-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKeyOrJwtAuthGuard } from './guards/api-key-or-jwt-auth.guard';
import { GeoModule } from '../geo/geo.module';
import { TrustedDevice } from '../security/entities/trusted-device.entity';
import { CustomThrottlerGuard } from '../common/guards/custom-throttler.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Admin,
      RefreshToken,
      Session,
      BiometricToken,
      TrustedDevice,
    ]),
    PassportModule,
    GeoModule,
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (jwt: ConfigType<typeof jwtConfig>) => ({
        secret: jwt.accessSecret,
        signOptions: { expiresIn: jwt.accessExpiry as unknown as number },
      }),
    }),
  ],
  controllers: [AuthController, BiometricAuthController],
  providers: [
    AuthService,
    BiometricAuthService,
    JwtStrategy,
    JwtAuthGuard,
    ApiKeyGuard,
    ApiKeyOrJwtAuthGuard,
    CustomThrottlerGuard,
  ],
  exports: [JwtAuthGuard, AuthService, BiometricAuthService, JwtStrategy],
})
export class AuthModule {}
