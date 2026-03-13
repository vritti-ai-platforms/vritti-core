import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Logger, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccessToken, Public, RefreshTokenCookie, UserId } from '@vritti/api-sdk';
import type { FastifyReply } from 'fastify';
import {
  ApiGetAccessToken,
  ApiGetAuthStatus,
  ApiLogin,
  ApiLogout,
  ApiRefreshTokens,
  ApiSetPassword,
} from '../docs/auth.docs';
import { LoginDto } from '../dto/request/login.dto';
import { SetPasswordDto } from '../dto/request/set-password.dto';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { MessageResponseDto } from '../dto/response/message-response.dto';
import { TokenResponseDto } from '../dto/response/token-response.dto';
import { AuthService } from '../services/auth.service';
import { getRefreshCookieName, getRefreshCookieOptionsFromConfig } from '../services/session.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // Authenticates user credentials and creates a NEXUS session
  @Post('login')
  @Public()
  @ApiLogin()
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Ip() ipAddress: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`POST /api/auth/login - Email: ${dto.email}`);

    const { refreshToken, ...response } = await this.authService.login(dto, ipAddress);

    if (refreshToken) {
      reply.setCookie(getRefreshCookieName(), refreshToken, getRefreshCookieOptionsFromConfig());
    }

    return response;
  }

  // Invalidates the current session and clears the refresh cookie
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiLogout()
  async logout(
    @AccessToken() accessToken: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MessageResponseDto> {
    this.logger.log('POST /api/auth/logout');
    const result = await this.authService.logout(accessToken);
    reply.clearCookie(getRefreshCookieName(), { path: '/' });
    return result;
  }

  // Sets password using a SET_PASSWORD session token — clears session on success
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiSetPassword()
  async setPassword(
    @UserId() userId: string,
    @Body() dto: SetPasswordDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MessageResponseDto> {
    this.logger.log(`POST /api/auth/set-password - User: ${userId}`);
    const result = await this.authService.setPassword(dto, userId);
    reply.clearCookie(getRefreshCookieName(), { path: '/' });
    return result;
  }

  // Returns auth status without throwing 401 — safe for client-side polling
  @Get('status')
  @Public()
  @ApiGetAuthStatus()
  async getStatus(@RefreshTokenCookie() refreshToken: string | undefined): Promise<AuthResponseDto> {
    this.logger.log('GET /api/auth/status');
    return this.authService.getStatus(refreshToken);
  }

  // Rotates refresh token and issues a new access token
  @Post('refresh-tokens')
  @Public()
  @ApiRefreshTokens()
  async refreshTokens(
    @RefreshTokenCookie() refreshToken: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<TokenResponseDto> {
    this.logger.log('POST /api/auth/refresh-tokens');

    const result = await this.authService.refreshTokens(refreshToken);

    reply.setCookie(getRefreshCookieName(), result.refreshToken, getRefreshCookieOptionsFromConfig());

    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  // Recovers session from httpOnly cookie without rotating the refresh token
  @Get('access-token')
  @Public()
  @ApiGetAccessToken()
  async getAccessToken(@RefreshTokenCookie() refreshToken: string | undefined): Promise<TokenResponseDto> {
    this.logger.log('GET /api/auth/access-token');
    return this.authService.getAccessToken(refreshToken);
  }
}
