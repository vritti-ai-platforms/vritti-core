import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Logger,
  type MessageEvent,
  Post,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import {
  AccessToken,
  CookieName,
  type CookieSerializeOptions,
  Public,
  RefreshCookieOptions,
  RefreshTokenCookie,
  SkipCsrf,
  UserId,
} from '@vritti/api-sdk';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { concat, merge, NEVER, type Observable, of } from 'rxjs';
import {
  ApiAcceptInvite,
  ApiGetAccessToken,
  ApiGetAuthStatus,
  ApiLogin,
  ApiLogout,
  ApiRefreshTokens,
  ApiSetPassword,
} from '../docs/auth.docs';
import { AcceptInviteDto } from '../dto/request/accept-invite.dto';
import { LoginDto } from '../dto/request/login.dto';
import { SetPasswordDto } from '../dto/request/set-password.dto';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { MessageResponseDto } from '../dto/response/message-response.dto';
import { TokenResponseDto } from '../dto/response/token-response.dto';
import { AuthService } from '../services/auth.service';
import { AuthStatusSseService } from '../services/auth-status-sse.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly sseService: AuthStatusSseService,
  ) {}

  // Authenticates user credentials and creates a NEXUS session
  @Post('login')
  @Public()
  @ApiLogin()
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Ip() ipAddress: string,
    @RefreshCookieOptions() cookieOptions: CookieSerializeOptions,
    @CookieName() cookieName: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`POST /auth/login - Email: ${dto.email}`);

    const { refreshToken, ...response } = await this.authService.login(dto, ipAddress);

    if (refreshToken) {
      reply.setCookie(cookieName, refreshToken, cookieOptions);
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
    @CookieName() cookieName: string,
    @RefreshCookieOptions() cookieOptions: CookieSerializeOptions,
  ): Promise<MessageResponseDto> {
    this.logger.log('POST /auth/logout');
    const result = await this.authService.logout(accessToken);
    reply.clearCookie(cookieName, { path: cookieOptions.path, domain: cookieOptions.domain });
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
    @CookieName() cookieName: string,
    @RefreshCookieOptions() cookieOptions: CookieSerializeOptions,
  ): Promise<MessageResponseDto> {
    this.logger.log(`POST /auth/set-password - User: ${userId}`);
    const result = await this.authService.setPassword(dto, userId);
    reply.clearCookie(cookieName, { path: cookieOptions.path, domain: cookieOptions.domain });
    return result;
  }

  // Accepts an invitation token and sets the user's password
  @Post('accept-invite')
  @Public()
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @ApiAcceptInvite()
  async acceptInvite(@Body() dto: AcceptInviteDto): Promise<MessageResponseDto> {
    this.logger.log('POST /auth/accept-invite');
    return this.authService.acceptInvite(dto);
  }

  // Streams auth status and real-time session-revocation events via SSE
  @Sse('status')
  @Public()
  @ApiGetAuthStatus()
  async getStatus(
    @RefreshTokenCookie() refreshToken: string | undefined,
    @AccessToken() accessToken: string,
    @Req()
    request: FastifyRequest,
  ): Promise<Observable<MessageEvent>> {
    const host = request.hostname ?? '';
    const baseDomain = this.config.getOrThrow<string>('BASE_DOMAIN');
    const subdomain = host.endsWith(`.${baseDomain}`) ? host.replace(`.${baseDomain}`, '') : undefined;

    this.logger.log(`SSE /auth/status — subdomain: ${subdomain ?? 'none'}`);

    const authResponse = await this.authService.getStatus(refreshToken, subdomain, accessToken);
    const initial$ = of({ type: 'auth-state', data: JSON.stringify(authResponse) } as MessageEvent);

    // Not authenticated — send initial state and hold open to prevent rapid reconnect loop
    if (!authResponse.isAuthenticated || !authResponse.sessionId || !authResponse.user) {
      return concat(initial$, NEVER);
    }

    // Register SSE connection for real-time updates, keyed by sessionId
    const connection$ = this.sseService.addConnection(authResponse.user.id, authResponse.sessionId);
    return merge(initial$, connection$.asObservable());
  }

  // Rotates refresh token and issues a new access token
  @Post('refresh-tokens')
  @Public()
  @ApiRefreshTokens()
  async refreshTokens(
    @RefreshTokenCookie() refreshToken: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
    @RefreshCookieOptions() cookieOptions: CookieSerializeOptions,
    @CookieName() cookieName: string,
  ): Promise<TokenResponseDto> {
    this.logger.log('POST /auth/refresh-tokens');

    const result = await this.authService.refreshTokens(refreshToken);

    reply.setCookie(cookieName, result.refreshToken, cookieOptions);

    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  // Recovers session from httpOnly cookie without rotating the refresh token
  @Get('access-token')
  @Public()
  @ApiGetAccessToken()
  async getAccessToken(@RefreshTokenCookie() refreshToken: string | undefined): Promise<TokenResponseDto> {
    this.logger.log('GET /auth/access-token');
    return this.authService.getAccessToken(refreshToken);
  }
}
