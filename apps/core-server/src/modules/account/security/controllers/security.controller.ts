import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { ApiChangePassword, ApiGetSessions, ApiRevokeAllSessions, ApiRevokeSession } from '../docs/security.docs';
import { ChangePasswordDto } from '../dto/request/change-password.dto';
import { SessionResponseDto } from '../dto/response/session-response.dto';
import { SecurityService } from '../services/security.service';

@ApiTags('Account - Security')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
@Controller('security')
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(private readonly securityService: SecurityService) {}

  // Changes the authenticated user's password after verifying the current one
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiChangePassword()
  async changePassword(@UserId() userId: string, @Body() dto: ChangePasswordDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /account/security/change-password - userId: ${userId}`);
    return this.securityService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  // Returns all active sessions for the authenticated user
  @Get('sessions')
  @ApiGetSessions()
  async getSessions(
    @UserId() userId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<SessionResponseDto[]> {
    this.logger.log(`GET /account/security/sessions - userId: ${userId}`);
    return this.securityService.getSessions(userId, authorization);
  }

  // Revokes a specific session by ID — cannot revoke the current session
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiRevokeSession()
  async revokeSession(
    @UserId() userId: string,
    @Param('id') sessionId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /account/security/sessions/${sessionId} - userId: ${userId}`);
    return this.securityService.revokeSession(userId, sessionId, authorization);
  }

  // Revokes all sessions except the current one and broadcasts logout via SSE
  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiRevokeAllSessions()
  async revokeAllSessions(
    @UserId() userId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /account/security/sessions/revoke-all - userId: ${userId}`);
    return this.securityService.revokeAllSessions(userId, authorization);
  }
}
