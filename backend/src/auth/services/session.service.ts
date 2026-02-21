import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../../database/entities/session.entity';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async createSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<SessionEntity> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = this.sessionRepository.create({
      id: `session_${uuidv4()}`,
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
      isActive: true,
    });

    return this.sessionRepository.save(session);
  }

  async validateRefreshToken(
    refreshToken: string,
  ): Promise<SessionEntity | null> {
    const session = await this.sessionRepository.findOne({
      where: {
        refreshToken,
        isActive: true,
      },
      relations: ['user'],
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      session.isActive = false;
      await this.sessionRepository.save(session);
      return null;
    }

    return session;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      {
        isActive: false,
        revokedAt: new Date(),
      },
    );
  }

  async getUserSessions(userId: string): Promise<SessionEntity[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.update(
      { userId, isActive: true },
      {
        isActive: false,
        revokedAt: new Date(),
      },
    );
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository.update(
      { isActive: true },
      {
        isActive: false,
      },
    );
  }
}
