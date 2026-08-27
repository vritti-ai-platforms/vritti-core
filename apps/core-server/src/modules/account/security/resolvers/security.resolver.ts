import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { MessageResponse } from '../../../core-api/auth/root/graphql/message-response.type';
import { AuthHeader } from '../graphql/auth-header.decorator';
import { ChangePasswordInput } from '../graphql/change-password.input';
import { UserSession } from '../graphql/user-session.type';
import { SecurityService } from '../services/security.service';

@Resolver()
export class SecurityResolver {
  private readonly logger = new Logger(SecurityResolver.name);

  constructor(private readonly securityService: SecurityService) {}

  // Verifies the current password and replaces it with a new one
  @Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Mutation(() => MessageResponse, { name: 'changePassword' })
  async changePassword(@UserId() userId: string, @Args('input') input: ChangePasswordInput): Promise<MessageResponse> {
    this.logger.log('MUTATION changePassword');
    return this.securityService.changePassword(userId, input.currentPassword, input.newPassword);
  }

  // Lists all active sessions for the user, marking the current one
  @Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => [UserSession], { name: 'sessions' })
  async sessions(@UserId() userId: string, @AuthHeader() authHeader: string | undefined): Promise<UserSession[]> {
    this.logger.log('QUERY sessions');
    return this.securityService.getSessions(userId, authHeader);
  }

  // Revokes a specific session
  @Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Mutation(() => MessageResponse, { name: 'revokeSession' })
  async revokeSession(
    @UserId() userId: string,
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @AuthHeader() authHeader: string | undefined,
  ): Promise<MessageResponse> {
    this.logger.log('MUTATION revokeSession');
    return this.securityService.revokeSession(userId, sessionId, authHeader);
  }

  // Revokes all sessions except the current one
  @Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Mutation(() => MessageResponse, { name: 'revokeAllSessions' })
  async revokeAllSessions(
    @UserId() userId: string,
    @AuthHeader() authHeader: string | undefined,
  ): Promise<MessageResponse> {
    this.logger.log('MUTATION revokeAllSessions');
    return this.securityService.revokeAllSessions(userId, authHeader);
  }
}
