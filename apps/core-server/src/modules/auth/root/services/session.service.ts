import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { getConfig, getRefreshCookieOptions, hashToken, JwtAuthService, TokenType, UnauthorizedException } from '@vritti/api-sdk';
import { type Session, type SessionType } from '@/db/schema';
import { SessionRepository } from '../repositories/session.repository';

// Returns the configured refresh cookie name from api-sdk settings
export function getRefreshCookieName(): string {
  return getConfig().cookie.refreshCookieName;
}

// Returns the configured refresh cookie options from api-sdk settings
export function getRefreshCookieOptionsFromConfig() {
  return getRefreshCookieOptions();
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly jwtService: JwtAuthService,
  ) {}

  // Creates a session with both access and refresh tokens for the given session type
  async createSession(
    userId: string,
    sessionType: SessionType,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    session: Session;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const sessionId = randomUUID();
    const refreshToken = this.jwtService.generateRefreshToken(userId, sessionId, sessionType);
    const accessToken = this.jwtService.generateAccessToken(userId, sessionId, sessionType, refreshToken);
    const expiresAt = this.jwtService.getExpiryTime(TokenType.REFRESH);

    const session = await this.sessionRepository.create({
      id: sessionId,
      userId,
      type: sessionType,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      ipAddress,
      userAgent,
      expiresAt,
    });

    const expiresIn = this.jwtService.getExpiryInSeconds(TokenType.ACCESS);

    this.logger.log(`Created ${sessionType} session for user: ${userId}`);

    return { session, accessToken, refreshToken, expiresIn };
  }

  // Rotates both access and refresh tokens for a session
  async refreshTokens(refreshToken: string | undefined): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const session = await this.validateRefreshToken(refreshToken);
    const newRefreshToken = this.jwtService.generateRefreshToken(session.userId, session.id, session.type);
    const newAccessToken = this.jwtService.generateAccessToken(
      session.userId,
      session.id,
      session.type,
      newRefreshToken,
    );
    const expiresAt = this.jwtService.getExpiryTime(TokenType.REFRESH);

    await this.sessionRepository.rotateTokens(
      session.id,
      hashToken(newAccessToken),
      hashToken(newRefreshToken),
      expiresAt,
    );

    const expiresIn = this.jwtService.getExpiryInSeconds(TokenType.ACCESS);

    this.logger.log(`Rotated tokens for session: ${session.id}`);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn };
  }

  // Generates a new access token without rotating the refresh token
  async generateAccessToken(refreshToken: string | undefined): Promise<{
    accessToken: string;
    expiresIn: number;
    userId: string;
    sessionType: string;
  }> {
    const session = await this.validateRefreshToken(refreshToken);
    const newAccessToken = this.jwtService.generateAccessToken(
      session.userId,
      session.id,
      session.type,
      refreshToken as string,
    );

    await this.sessionRepository.updateAccessTokenHash(session.id, hashToken(newAccessToken));

    const expiresIn = this.jwtService.getExpiryInSeconds(TokenType.ACCESS);

    this.logger.log(`Generated access token for user: ${session.userId}`);

    return { accessToken: newAccessToken, expiresIn, userId: session.userId, sessionType: session.type };
  }

  // Validates refresh token and returns the active non-expired session
  private async validateRefreshToken(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken) {
      throw new UnauthorizedException({
        label: 'No Session Found',
        detail: 'No active session found. Please log in again.',
      });
    }
    const session = await this.sessionRepository.findByRefreshTokenHash(hashToken(refreshToken));
    return this.ensureSessionValid(session);
  }

  // Invalidates the session matching the given access token
  async invalidateByAccessToken(accessToken: string): Promise<void> {
    const session = await this.sessionRepository.findByAccessTokenHash(hashToken(accessToken));
    if (session) {
      await this.sessionRepository.delete(session.id);
      this.logger.log(`Invalidated session: ${session.id}`);
    }
  }

  // Deletes all sessions for a user across all devices, returning count deleted
  async deleteAllUserSessions(userId: string): Promise<number> {
    const count = await this.sessionRepository.deleteAllByUserId(userId);
    this.logger.log(`Deleted ${count} sessions for user: ${userId}`);
    return count;
  }

  // Returns all sessions for a user ordered by most recent
  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.findAllByUserId(userId);
  }

  // Validates a session by access token hash and ensures it is not expired
  async validateAccessTokenSession(accessToken: string): Promise<Session> {
    const session = await this.sessionRepository.findByAccessTokenHash(hashToken(accessToken));
    return this.ensureSessionValid(session);
  }

  // Ensures a session exists and has not expired; throws if invalid
  private async ensureSessionValid(session: Session | undefined): Promise<Session> {
    if (!session) {
      throw new UnauthorizedException({
        label: 'Invalid Session',
        detail: 'Your session is invalid or has expired. Please log in again.',
      });
    }

    if (new Date() > session.expiresAt) {
      await this.sessionRepository.delete(session.id);
      throw new UnauthorizedException({
        label: 'Session Expired',
        detail: 'Your session has expired. Please log in again.',
      });
    }

    return session;
  }
}
