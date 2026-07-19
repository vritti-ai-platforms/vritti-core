import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { hashToken, TokenService, TokenType } from '@vritti/api-sdk/auth';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { type Session, type SessionType } from '@/db/schema';
import { SessionDomainRepository } from '../repositories/session.repository';

@Injectable()
export class SessionDomainService {
  private readonly logger = new Logger(SessionDomainService.name);

  constructor(
    private readonly sessionRepository: SessionDomainRepository,
    private readonly tokenService: TokenService,
  ) {}

  // Creates a session with both access and refresh tokens for the given session type
  async createSession(
    userId: string,
    sessionType: SessionType,
    metadata: { organizationId: string; subdomain: string } & Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    session: Session;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const sessionId = randomUUID();
    const sessionInfo = { userId, sessionId, sessionType, ...metadata };
    const refreshToken = this.tokenService.generateRefreshToken(sessionInfo);
    const accessToken = this.tokenService.generateAccessToken(sessionInfo, refreshToken);
    const expiresAt = this.tokenService.getExpiryTime(TokenType.REFRESH);

    const session = await this.sessionRepository.create({
      id: sessionId,
      userId,
      type: sessionType,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      metadata,
      ipAddress,
      userAgent,
      expiresAt,
    });

    const expiresIn = this.tokenService.getExpiryInSeconds(TokenType.ACCESS);

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
    const sessionInfo = {
      userId: session.userId,
      sessionId: session.id,
      sessionType: session.type,
      ...(session.metadata as { organizationId: string; subdomain: string } & Record<string, unknown>),
    };
    const newRefreshToken = this.tokenService.generateRefreshToken(sessionInfo);
    const newAccessToken = this.tokenService.generateAccessToken(sessionInfo, newRefreshToken);
    const expiresAt = this.tokenService.getExpiryTime(TokenType.REFRESH);

    await this.sessionRepository.rotateTokens(
      session.id,
      hashToken(newAccessToken),
      hashToken(newRefreshToken),
      expiresAt,
    );

    const expiresIn = this.tokenService.getExpiryInSeconds(TokenType.ACCESS);

    this.logger.log(`Rotated tokens for session: ${session.id}`);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn };
  }

  // Generates a new access token without rotating the refresh token
  async generateAccessToken(refreshToken: string | undefined): Promise<{
    accessToken: string;
    expiresIn: number;
    userId: string;
    sessionType: string;
    sessionId: string;
  }> {
    const session = await this.validateRefreshToken(refreshToken);
    const sessionInfo = {
      userId: session.userId,
      sessionId: session.id,
      sessionType: session.type,
      ...(session.metadata as { organizationId: string; subdomain: string } & Record<string, unknown>),
    };
    const newAccessToken = this.tokenService.generateAccessToken(sessionInfo, refreshToken as string);

    await this.sessionRepository.updateAccessTokenHash(session.id, hashToken(newAccessToken));

    const expiresIn = this.tokenService.getExpiryInSeconds(TokenType.ACCESS);

    this.logger.log(`Generated access token for user: ${session.userId}`);

    return {
      accessToken: newAccessToken,
      expiresIn,
      userId: session.userId,
      sessionType: session.type,
      sessionId: session.id,
    };
  }

  // Validates refresh token and returns the active non-expired session
  async validateRefreshToken(refreshToken: string | undefined): Promise<Session> {
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

  // Deletes a single session by its ID
  async deleteSessionById(sessionId: string): Promise<void> {
    await this.sessionRepository.deleteById(sessionId);
    this.logger.log(`Deleted session: ${sessionId}`);
  }

  // Deletes all sessions for a user except the current one, returning count deleted
  async deleteAllSessionsExcept(userId: string, currentSessionId: string): Promise<number> {
    const count = await this.sessionRepository.deleteAllExcept(userId, currentSessionId);
    this.logger.log(`Deleted ${count} sessions for user: ${userId} (kept session ${currentSessionId})`);
    return count;
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
