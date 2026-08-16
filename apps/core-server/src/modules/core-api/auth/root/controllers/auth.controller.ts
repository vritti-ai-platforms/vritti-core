import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Logger,
  type MessageEvent,
  Post,
  Res,
  Sse,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import {
  AccessToken,
  CookieName,
  type CookieSerializeOptions,
  Hostname,
  Public,
  RefreshCookieOptions,
  RefreshTokenCookie,
  SkipCsrf,
  Subdomain,
  UserId,
} from '@vritti/api-sdk/auth';
import type { FastifyReply } from 'fastify';
import type { Observable } from 'rxjs';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiAcceptInvite,
  ApiGetAccessToken,
  ApiGetAuthStatus,
  ApiLogin,
  ApiLogout,
  ApiMobileLogin,
  ApiMobileLogout,
  ApiMobileLookup,
  ApiMobileRefreshTokens,
  ApiRefreshTokens,
  ApiSetPassword,
} from '../docs/auth.docs';
import { AcceptInviteDto } from '../dto/request/accept-invite.dto';
import { LoginDto } from '../dto/request/login.dto';
import { MobileLoginDto } from '../dto/request/mobile-login.dto';
import { MobileLookupDto } from '../dto/request/mobile-lookup.dto';
import { MobileRefreshDto } from '../dto/request/mobile-refresh.dto';
import { SetPasswordDto } from '../dto/request/set-password.dto';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { MessageResponseDto } from '../dto/response/message-response.dto';
import { MobileLookupResponseDto } from '../dto/response/mobile-lookup-response.dto';
import { MobileTokenResponseDto } from '../dto/response/mobile-token-response.dto';
import { TokenResponseDto } from '../dto/response/token-response.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // Authenticates user credentials and creates a NEXUS session
  @Post('login')
  @Public()
  @ApiLogin()
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
    @RefreshCookieOptions() cookieOptions: CookieSerializeOptions,
    @CookieName() cookieName: string,
    @Subdomain() subdomain: string | undefined,
  ): Promise<AuthResponseDto> {
    this.logger.log(`POST /auth/login - Email: ${dto.email}, subdomain: ${subdomain ?? 'none'}`);

    const { refreshToken, ...response } = await this.authService.login(
      dto,
      ipAddress,
      SessionTypeValues.WEB,
      userAgent,
      subdomain,
    );

    if (refreshToken) {
      reply.setCookie(cookieName, refreshToken, cookieOptions);
    }

    return response;
  }

  // Looks up all organizations associated with the given email
  @Post('mobile/lookup')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiMobileLookup()
  async lookup(@Body() dto: MobileLookupDto): Promise<MobileLookupResponseDto> {
    this.logger.log(`POST /auth/mobile/lookup - Email: ${dto.email}`);
    return this.authService.lookupOrganizationsByEmail(dto.email);
  }

  // Authenticates user credentials and creates a MOBILE session
  @Post('mobile/login')
  @Public()
  @SkipCsrf()
  @ApiMobileLogin()
  async mobileLogin(
    @Body() dto: MobileLoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    this.logger.log(`POST /auth/mobile/login - Email: ${dto.email}`);
    const result = await this.authService.login(
      { email: dto.email, password: dto.password, organizationId: dto.organizationId },
      ipAddress,
      SessionTypeValues.MOBILE,
      userAgent,
    );
    return result;
  }

  // Rotates tokens using refresh token from request body
  @Post('mobile/refresh-tokens')
  @HttpCode(HttpStatus.OK)
  @Public()
  @SkipCsrf()
  @ApiMobileRefreshTokens()
  async refreshMobileTokens(@Body() dto: MobileRefreshDto): Promise<MobileTokenResponseDto> {
    this.logger.log('POST /auth/mobile/refresh-tokens');
    return this.authService.refreshMobileTokens(dto.refreshToken);
  }

  // Invalidates the current mobile session
  @Post('mobile/logout')
  @HttpCode(HttpStatus.OK)
  @ApiMobileLogout()
  async mobileLogout(@AccessToken() accessToken: string): Promise<MessageResponseDto> {
    this.logger.log('POST /auth/mobile/logout');
    return this.authService.logout(accessToken);
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
    @Hostname() host: string,
    @Headers('x-platform') platformHeader?: string,
  ): Promise<Observable<MessageEvent>> {
    const baseDomain = this.config.getOrThrow<string>('BASE_DOMAIN');
    const subdomain = host.endsWith(`.${baseDomain}`) ? host.replace(`.${baseDomain}`, '') : undefined;
    const platform = normalizeClientPlatform(platformHeader);

    this.logger.log(`SSE /auth/status — subdomain: ${subdomain ?? 'none'}, platform: ${platform}`);

    return this.authService.getStatusStream(refreshToken, subdomain, accessToken, platform);
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

// Normalises X-Platform header into the ClientPlatform union; unknown/missing → 'web'.
function normalizeClientPlatform(raw: string | undefined): 'web' | 'ios' | 'android' {
  const v = raw?.toLowerCase();
  if (v === 'ios' || v === 'android') return v;
  return 'web';
}
