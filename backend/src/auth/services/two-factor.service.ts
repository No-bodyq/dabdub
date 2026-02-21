import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async generateSecret(
    userId: string,
  ): Promise<{ secret: string; qrCode: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `Settlement API (${user.email})`,
      issuer: 'Settlement API',
      length: 32,
    });

    const otpauthUrl = secret.otpauth_url;
    if (!otpauthUrl) {
      throw new Error('Failed to generate OTP URL');
    }

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async enableTwoFactor(
    userId: string,
    secret: string,
    code: string,
  ): Promise<boolean> {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return false;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;

    await this.userRepository.save(user);
    return true;
  }

  async disableTwoFactor(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null as any; // Force null for DB clearing

    await this.userRepository.save(user);
  }

  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });
  }
}
