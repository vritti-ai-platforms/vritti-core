import { SessionService } from '@domain/session/services/session.service';
import { UserRepository } from '@domain/user/repositories/user.repository';
import { UserService } from '@domain/user/services/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { hashToken } from '@vritti/api-sdk/auth';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import * as argon2 from 'argon2';
import { AUTH_STATUS_EVENTS, SessionRevokedEvent } from '../../../core-api/auth/root/events/auth-status.events';
import { SessionResponseDto } from '../dto/response/session-response.dto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly sessionService: SessionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Verifies the current password and replaces it with a new hashed password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<SuccessResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);

    if (!user.passwordHash) {
      throw new BadRequestException({
        label: 'No Password Set',
        detail: 'Your account does not have a password. Please contact support.',
        errors: [{ field: 'currentPassword', message: 'No password set' }],
      });
    }

    const isCurrentValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isCurrentValid) {
      throw new BadRequestException({
        label: 'Incorrect Password',
        detail: 'The current password you entered is wrong. Please try again.',
        errors: [{ field: 'currentPassword', message: 'Incorrect password' }],
      });
    }

    const isSamePassword = await argon2.verify(user.passwordHash, newPassword);
    if (isSamePassword) {
      throw new BadRequestException({
        label: 'Password Already In Use',
        detail: 'Your new password must be different from your current password.',
        errors: [{ field: 'newPassword', message: 'Password already in use' }],
      });
    }

    const newPasswordHash = await argon2.hash(newPassword);
    await this.userRepository.setPassword(userId, newPasswordHash);

    this.logger.log(`Password changed for user: ${userId}`);

    return { success: true, message: 'Password changed successfully.' };
  }

  // Returns all active sessions for the user, marking the current one by access token hash
  async getSessions(userId: string, authorizationHeader: string | undefined): Promise<SessionResponseDto[]> {
    const rawToken = this.extractBearerToken(authorizationHeader);
    const currentAccessTokenHash = hashToken(rawToken);
    const sessions = await this.sessionService.getUserSessions(userId);

    const dtos = sessions.map((session) => SessionResponseDto.from(session, currentAccessTokenHash));

    // Current session first
    return dtos.sort((a, b) => (a.isCurrent ? -1 : b.isCurrent ? 1 : 0));
  }

  // Revokes a specific session, preventing revocation of the current one
  async revokeSession(
    userId: string,
    sessionId: string,
    authorizationHeader: string | undefined,
  ): Promise<SuccessResponseDto> {
    const rawToken = this.extractBearerToken(authorizationHeader);
    const currentAccessTokenHash = hashToken(rawToken);

    const sessions = await this.sessionService.getUserSessions(userId);
    const currentSession = sessions.find((s) => s.accessTokenHash === currentAccessTokenHash);

    if (currentSession?.id === sessionId) {
      throw new BadRequestException({
        label: 'Cannot Revoke',
        detail: 'You cannot revoke your current session. Use logout instead.',
      });
    }

    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      throw new NotFoundException('The session you are trying to revoke does not exist or has already been revoked.');
    }

    await this.sessionService.deleteSessionById(sessionId);

    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SESSION_REVOKED, new SessionRevokedEvent(userId, sessionId));

    this.logger.log(`Session ${sessionId} revoked for user: ${userId}`);

    return { success: true, message: 'Session revoked successfully.' };
  }

  // Revokes all sessions except the current one, emitting a broadcast logout event
  async revokeAllSessions(userId: string, authorizationHeader: string | undefined): Promise<SuccessResponseDto> {
    const rawToken = this.extractBearerToken(authorizationHeader);
    const currentAccessTokenHash = hashToken(rawToken);

    const sessions = await this.sessionService.getUserSessions(userId);
    const currentSession = sessions.find((s) => s.accessTokenHash === currentAccessTokenHash);

    if (!currentSession) {
      throw new BadRequestException('Could not identify the current session. Please log in again.');
    }

    const count = await this.sessionService.deleteAllSessionsExcept(userId, currentSession.id);

    // Emit with no sessionId so SSE pushes logout to all other connections for this user
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SESSION_REVOKED, new SessionRevokedEvent(userId));

    this.logger.log(`Revoked ${count} other session(s) for user: ${userId}`);

    return { success: true, message: `Successfully signed out ${count} other device(s).` };
  }

  // Extracts the raw token from the Authorization: Bearer header
  private extractBearerToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization header is missing or malformed.');
    }
    return authorizationHeader.slice(7);
  }
}
