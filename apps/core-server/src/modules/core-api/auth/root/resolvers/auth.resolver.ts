import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessToken, ClientIp, Public, RequireSession, UserAgent } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { LookupOrganization } from '../graphql/lookup-organization.type';
import { MessageResponse } from '../graphql/message-response.type';
import { MobileAuthSession } from '../graphql/mobile-auth-session.type';
import { MobileLoginInput } from '../graphql/mobile-login.input';
import { MobileRefreshInput } from '../graphql/mobile-refresh.input';
import { MobileTokens } from '../graphql/mobile-tokens.type';
import { AuthService } from '../services/auth.service';

@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(private readonly authService: AuthService) {}

  // Lists organizations a user belongs to, by email — public mobile login pre-step
  @Public()
  @Query(() => [LookupOrganization], { name: 'organizationsByEmail' })
  async organizationsByEmail(@Args('email') email: string): Promise<LookupOrganization[]> {
    this.logger.log('QUERY organizationsByEmail');
    const result = await this.authService.lookupOrganizationsByEmail(email);
    return result.organizations;
  }

  // Authenticates credentials and creates a MOBILE session
  @Public()
  @Mutation(() => MobileAuthSession, { name: 'mobileLogin' })
  async mobileLogin(
    @Args('input') input: MobileLoginInput,
    @ClientIp() clientIp: string,
    @UserAgent() userAgent: string | undefined,
  ): Promise<MobileAuthSession> {
    this.logger.log('MUTATION mobileLogin');
    return this.authService.login(input, clientIp, SessionTypeValues.MOBILE, userAgent);
  }

  // Rotates the mobile session tokens using the body-provided refresh token
  @Public()
  @Mutation(() => MobileTokens, { name: 'mobileRefreshTokens' })
  async mobileRefreshTokens(@Args('input') input: MobileRefreshInput): Promise<MobileTokens> {
    this.logger.log('MUTATION mobileRefreshTokens');
    return this.authService.refreshMobileTokens(input.refreshToken);
  }

  // Invalidates the current mobile session
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MessageResponse, { name: 'mobileLogout' })
  async mobileLogout(@AccessToken() accessToken: string): Promise<MessageResponse> {
    this.logger.log('MUTATION mobileLogout');
    return this.authService.logout(accessToken);
  }
}
