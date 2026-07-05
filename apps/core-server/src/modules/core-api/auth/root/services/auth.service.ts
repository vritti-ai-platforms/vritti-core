import { OrganizationService } from '@domain/organization/services/organization.service';
import { SessionService } from '@domain/session/services/session.service';
import { UserService } from '@domain/user/services/user.service';
import { UserPermissionsService } from '@domain/user-permissions/services/user-permissions.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  PrimaryDatabaseService,
  TokenService,
  TokenType,
  UnauthorizedException,
} from '@vritti/api-sdk';
import * as argon2 from 'argon2';
import { type SessionType, SessionTypeValues, UserStatusValues } from '@/db/schema';
import { AcceptInviteDto } from '../dto/request/accept-invite.dto';
import { LoginDto } from '../dto/request/login.dto';
import { SetPasswordDto } from '../dto/request/set-password.dto';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { MessageResponseDto } from '../dto/response/message-response.dto';
import { MobileLookupResponseDto } from '../dto/response/mobile-lookup-response.dto';
import { TokenResponseDto } from '../dto/response/token-response.dto';
import { AUTH_STATUS_EVENTS, SessionRevokedEvent } from '../events/auth-status.events';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly organizationService: OrganizationService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly primaryDb: PrimaryDatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Resolves the user's BUs + per-BU features within an RLS context so the org_isolation
  // policy on business_units sees app.org_id. Used by both getStatus branches.
  private async resolvePermissionContext(
    userId: string,
    orgId: string,
    platform: 'web' | 'ios' | 'android',
  ): Promise<{
    businessUnits: Awaited<ReturnType<UserPermissionsService['getAssignedBusinessUnits']>>;
    featuresByBuId: Record<string, Awaited<ReturnType<UserPermissionsService['getPermissions']>>['features']>;
  }> {
    return this.primaryDb.runWithRlsContext({ orgId }, async () => {
      const businessUnits = await this.userPermissionsService.getAssignedBusinessUnits(userId, orgId);
      const featuresByBuId = Object.fromEntries(
        await Promise.all(
          businessUnits.map(async (bu) => {
            const { features } = await this.userPermissionsService.getPermissions(userId, bu.id, orgId, platform);
            return [bu.id, features];
          }),
        ),
      );
      return { businessUnits, featuresByBuId };
    });
  }

  // Looks up all organizations a user belongs to by email
  async lookupOrganizationsByEmail(email: string): Promise<MobileLookupResponseDto> {
    return this.userService.lookupOrganizationsByEmail(email);
  }

  // Validates credentials and creates a session for the given type
  async login(
    dto: LoginDto,
    ipAddress?: string,
    sessionType: SessionType = SessionTypeValues.WEB,
    userAgent?: string,
  ): Promise<AuthResponseDto & { refreshToken?: string }> {
    const user = dto.organizationId
      ? await this.userService.findByEmailAndOrg(dto.email, dto.organizationId)
      : await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException({
        label: 'Invalid Credentials',
        detail: 'The email or password you entered is incorrect. Please check your credentials and try again.',
        errors: [{ field: 'email', message: 'No account found for this email' }],
      });
    }

    if (!user.passwordHash) {
      throw new BadRequestException({
        label: 'Password Not Set',
        detail: 'Please set a password before logging in. Check your invitation email.',
        errors: [{ field: 'password', message: 'Password not set — check your invitation email' }],
      });
    }

    if (user.status !== UserStatusValues.ACTIVE) {
      throw new UnauthorizedException({
        label: 'Account Unavailable',
        detail: `Your account is ${user.status.toLowerCase()}. Please contact support for assistance.`,
      });
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      throw new BadRequestException({
        label: 'Invalid Credentials',
        detail: 'The email or password you entered is incorrect. Please check your credentials and try again.',
        errors: [{ field: 'password', message: 'Invalid credentials' }],
      });
    }

    const org = await this.organizationService.getById(user.organizationId);
    if (!org) {
      throw new BadRequestException({
        label: 'Organization Not Found',
        detail: 'Organization not found. Please contact support.',
      });
    }

    const { accessToken, refreshToken, expiresIn } = await this.sessionService.createSession(
      user.id,
      sessionType,
      { organizationId: user.organizationId, subdomain: org.subdomain },
      ipAddress,
      userAgent,
    );

    await this.userService.updateLastLogin(user.id);

    this.logger.log(`User logged in: ${user.email} (${user.id})`);

    return {
      ...new AuthResponseDto({ accessToken, expiresIn, isAuthenticated: true }),
      refreshToken,
    };
  }

  // Invalidates the session associated with the given access token
  async logout(accessToken: string): Promise<MessageResponseDto> {
    const session = await this.sessionService.validateAccessTokenSession(accessToken);
    await this.sessionService.invalidateByAccessToken(accessToken);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SESSION_REVOKED, new SessionRevokedEvent(session.userId, session.id));
    this.logger.log('User logged out');
    return { message: 'Successfully logged out' };
  }

  // Validates the set-password session token, hashes the password, and activates the user
  async setPassword(dto: SetPasswordDto, userId: string): Promise<MessageResponseDto> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        label: 'Password Mismatch',
        detail: 'The passwords you entered do not match. Please try again.',
        errors: [{ field: 'confirmPassword', message: 'Passwords do not match' }],
      });
    }

    const user = await this.userService.findByIdOrThrow(userId);

    if (user.passwordHash) {
      throw new BadRequestException({
        label: 'Password Already Set',
        detail: 'A password has already been set for this account. Use the login page instead.',
        errors: [{ field: 'password', message: 'Password already set' }],
      });
    }

    const passwordHash = await argon2.hash(dto.password);
    await this.userService.setPassword(user.id, passwordHash);

    // Invalidate set-password sessions — user must log in with NEXUS session next
    await this.sessionService.deleteAllUserSessions(user.id);

    this.logger.log(`Password set for user: ${user.id}`);

    return { message: 'Password set successfully. You can now log in.' };
  }

  // Accepts an invitation token, sets the user's password, and clears all sessions
  async acceptInvite(dto: AcceptInviteDto): Promise<MessageResponseDto> {
    let decoded: { userId: string; sessionId: string; sessionType: string };

    // Verify the JWT token and validate the session exists
    try {
      decoded = this.tokenService.verify(dto.token, TokenType.ACCESS);
      await this.sessionService.validateAccessTokenSession(dto.token);
    } catch {
      throw new UnauthorizedException({
        label: 'Invalid Invitation',
        detail:
          'This invitation link is invalid or has expired. Please request a new invitation from your administrator.',
      });
    }

    if (decoded.sessionType !== 'SET_PASSWORD') {
      throw new UnauthorizedException({
        label: 'Invalid Invitation',
        detail: 'This token is not a valid invitation token. Please use the link from your invitation email.',
      });
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        label: 'Password Mismatch',
        detail: 'The passwords you entered do not match. Please try again.',
        errors: [{ field: 'confirmPassword', message: 'Passwords do not match' }],
      });
    }

    const user = await this.userService.findByIdOrThrow(decoded.userId);

    if (user.passwordHash) {
      throw new BadRequestException({
        label: 'Password Already Set',
        detail: 'A password has already been set for this account. Use the login page instead.',
        errors: [{ field: 'password', message: 'Password already set' }],
      });
    }

    const passwordHash = await argon2.hash(dto.password);
    await this.userService.setPassword(user.id, passwordHash);

    // Invalidate all sessions — user must log in with NEXUS session next
    await this.sessionService.deleteAllUserSessions(decoded.userId);

    this.logger.log(`Password set via invitation for user: ${user.id}`);

    return { message: 'Password set successfully. You can now log in.' };
  }

  // Returns auth status without throwing 401 — resolves org from subdomain via Host header.
  // platform selects which microfrontend route (WEB/MOBILE) flows into featuresByBuId entries.
  async getStatus(
    refreshToken: string | undefined,
    subdomain?: string,
    bearerAccessToken?: string,
    allowRawIpOrgResolution = false,
    platform: 'web' | 'ios' | 'android' = 'web',
  ): Promise<AuthResponseDto> {
    // Resolve org regardless of auth state
    const org = subdomain ? await this.organizationService.getBySubdomain(subdomain) : null;
    const orgData = org ? { id: org.id, name: org.name, subdomain: org.subdomain, logoUrl: org.logoUrl } : undefined;

    if (!refreshToken && !bearerAccessToken) {
      return new AuthResponseDto({ isAuthenticated: false, org: orgData });
    }

    try {
      if (bearerAccessToken) {
        const decoded = this.tokenService.validateAccessToken(bearerAccessToken);
        const session = await this.sessionService.validateAccessTokenSession(bearerAccessToken);
        const user = await this.userService.findById(decoded.userId);
        const sessionMetadata = (session.metadata ?? {}) as Record<string, unknown>;

        const resolvedOrg =
          org ??
          (allowRawIpOrgResolution
            ? await this.resolveOrganizationFromSessionContext(
                sessionMetadata,
                decoded as unknown as Record<string, unknown>,
              )
            : null);
        const resolvedOrgData = resolvedOrg
          ? {
              id: resolvedOrg.id,
              name: resolvedOrg.name,
              subdomain: resolvedOrg.subdomain,
              logoUrl: resolvedOrg.logoUrl,
            }
          : orgData;

        let businessUnits: Awaited<ReturnType<UserPermissionsService['getAssignedBusinessUnits']>> = [];
        let featuresByBuId: Record<string, Awaited<ReturnType<UserPermissionsService['getPermissions']>>['features']> =
          {};

        if (resolvedOrg) {
          try {
            ({ businessUnits, featuresByBuId } = await this.resolvePermissionContext(
              decoded.userId,
              resolvedOrg.id,
              platform,
            ));
          } catch (error) {
            this.logger.error(
              `Failed to enrich auth status permissions for user ${decoded.userId} in org ${resolvedOrg.id}: ${error}`,
            );
          }
        }

        return new AuthResponseDto({
          isAuthenticated: true,
          sessionId: session.id,
          user: user
            ? {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                status: user.status,
                hasPassword: user.passwordHash !== null,
                locale: user.locale,
                timezone: user.timezone,
                createdAt: user.createdAt.toISOString(),
                lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
              }
            : undefined,
          org: resolvedOrgData,
          businessUnits,
          featuresByBuId,
        });
      }

      const { accessToken, expiresIn, userId, sessionId } = await this.sessionService.generateAccessToken(refreshToken);
      const user = await this.userService.findById(userId);

      // Web connects via refresh cookie (native EventSource can't send a bearer header), so enrich
      // BUs + features here too. Org comes from the subdomain-resolved entity.
      let businessUnits: Awaited<ReturnType<UserPermissionsService['getAssignedBusinessUnits']>> = [];
      let featuresByBuId: Record<string, Awaited<ReturnType<UserPermissionsService['getPermissions']>>['features']> =
        {};
      if (org) {
        try {
          ({ businessUnits, featuresByBuId } = await this.resolvePermissionContext(userId, org.id, platform));
        } catch (error) {
          this.logger.error(`Failed to enrich auth status permissions for user ${userId} in org ${org.id}: ${error}`);
        }
      }

      return new AuthResponseDto({
        isAuthenticated: true,
        accessToken,
        expiresIn,
        sessionId,
        user: user
          ? {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              status: user.status,
              hasPassword: user.passwordHash !== null,
              locale: user.locale,
              timezone: user.timezone,
              createdAt: user.createdAt.toISOString(),
              lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
            }
          : undefined,
        org: orgData,
        businessUnits,
        featuresByBuId,
      });
    } catch {
      return new AuthResponseDto({ isAuthenticated: false, org: orgData });
    }
  }

  // Builds a state-only auth payload for an SSE re-push — no accessToken, never rotates tokens
  async buildAuthStateForUser(
    userId: string,
    orgId: string,
    platform: 'web' | 'ios' | 'android',
  ): Promise<AuthResponseDto> {
    const user = await this.userService.findById(userId);
    const org = await this.organizationService.getById(orgId);
    const orgData = org ? { id: org.id, name: org.name, subdomain: org.subdomain, logoUrl: org.logoUrl } : undefined;
    const { businessUnits, featuresByBuId } = await this.resolvePermissionContext(userId, orgId, platform);

    return new AuthResponseDto({
      isAuthenticated: true,
      user: user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            hasPassword: user.passwordHash !== null,
            locale: user.locale,
            timezone: user.timezone,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          }
        : undefined,
      org: orgData,
      businessUnits,
      featuresByBuId,
    });
  }

  private async resolveOrganizationFromSessionContext(
    sessionMetadata: Record<string, unknown>,
    decodedToken: Record<string, unknown>,
  ) {
    const organizationId =
      this.getStringValue(sessionMetadata.organizationId) ?? this.getStringValue(decodedToken.organizationId);
    if (organizationId) {
      return this.organizationService.getById(organizationId);
    }

    const organizationSubdomain =
      this.getStringValue(sessionMetadata.subdomain) ?? this.getStringValue(decodedToken.subdomain);
    if (organizationSubdomain) {
      return this.organizationService.getBySubdomain(organizationSubdomain);
    }

    return null;
  }

  private getStringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  // Rotates both tokens and returns new access token — sets new refresh cookie in controller
  async refreshTokens(
    refreshToken: string | undefined,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    return this.sessionService.refreshTokens(refreshToken);
  }

  // Rotates tokens for mobile restore/login flows using the body-provided refresh token.
  async refreshMobileTokens(
    refreshToken: string | undefined,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const session = await this.sessionService.validateRefreshToken(refreshToken);

    if (session.type !== SessionTypeValues.MOBILE) {
      throw new UnauthorizedException({
        label: 'Invalid Session',
        detail: 'This refresh token does not belong to a mobile session. Please log in again.',
      });
    }

    return this.sessionService.refreshTokens(refreshToken);
  }

  // Recovers session from httpOnly cookie without rotating the refresh token
  async getAccessToken(refreshToken: string | undefined): Promise<TokenResponseDto> {
    const { accessToken, expiresIn } = await this.sessionService.generateAccessToken(refreshToken);
    return { accessToken, expiresIn };
  }
}
