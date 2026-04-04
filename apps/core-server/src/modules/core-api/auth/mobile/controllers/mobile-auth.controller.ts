import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccessToken, Public, RequireSession, SkipCsrf, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { MessageResponseDto } from '../../root/dto/response/message-response.dto';
import { AuthService } from '../../root/services/auth.service';
import { ApiMobileGetStatus, ApiMobileLogin, ApiMobileLookup, ApiMobileLogout, ApiMobileRefreshTokens } from '../docs/mobile-auth.docs';
import { MobileLoginDto } from '../dto/request/mobile-login.dto';
import { MobileLookupDto } from '../dto/request/mobile-lookup.dto';
import { MobileRefreshDto } from '../dto/request/mobile-refresh.dto';
import { MobileAuthResponseDto } from '../dto/response/mobile-auth-response.dto';
import { MobileLookupResponseDto } from '../dto/response/mobile-lookup-response.dto';
import { MobileTokenResponseDto } from '../dto/response/mobile-token-response.dto';

@ApiTags('Auth - Mobile')
@Controller('auth/mobile')
@SkipCsrf()
export class MobileAuthController {
  private readonly logger = new Logger(MobileAuthController.name);

  constructor(private readonly authService: AuthService) {}

  // Looks up all organizations associated with the given email
  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiMobileLookup()
  async lookup(@Body() dto: MobileLookupDto): Promise<MobileLookupResponseDto> {
    this.logger.log(`POST /api/auth/mobile/lookup - Email: ${dto.email}`);
    return this.authService.lookupOrganizationsByEmail(dto.email);
  }

  // Authenticates user credentials and creates a MOBILE session
  @Post('login')
  @Public()
  @ApiMobileLogin()
  async login(@Body() dto: MobileLoginDto, @Ip() ipAddress: string): Promise<MobileAuthResponseDto> {
    this.logger.log(`POST /api/auth/mobile/login - Email: ${dto.email}`);
    const result = await this.authService.login(
      { email: dto.email, password: dto.password, organizationId: dto.organizationId },
      ipAddress,
      SessionTypeValues.MOBILE,
    );
    return new MobileAuthResponseDto({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      isAuthenticated: true,
    });
  }

  // Rotates tokens using refresh token from request body
  @Post('refresh-tokens')
  @HttpCode(HttpStatus.OK)
  @RequireSession(SessionTypeValues.MOBILE)
  @ApiMobileRefreshTokens()
  async refreshTokens(@Body() dto: MobileRefreshDto): Promise<MobileTokenResponseDto> {
    this.logger.log('POST /api/auth/mobile/refresh-tokens');
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // Invalidates the current mobile session
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RequireSession(SessionTypeValues.MOBILE)
  @ApiMobileLogout()
  async logout(@AccessToken() accessToken: string): Promise<MessageResponseDto> {
    this.logger.log('POST /api/auth/mobile/logout');
    return this.authService.logout(accessToken);
  }


}
