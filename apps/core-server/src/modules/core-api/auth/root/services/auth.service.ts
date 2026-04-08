import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, TokenService, TokenType, UnauthorizedException } from '@vritti/api-sdk';
import * as argon2 from 'argon2';
import { type SessionType, SessionTypeValues, UserStatusValues } from '@/db/schema';
import { OrganizationService } from '@domain/organization/services/organization.service';
import { SessionService } from '@domain/session/services/session.service';
import { UserService } from '@domain/user/services/user.service';
import { MobileLookupResponseDto } from '../../mobile/dto/response/mobile-lookup-response.dto';
import { AcceptInviteDto } from '../dto/request/accept-invite.dto';
import { LoginDto } from '../dto/request/login.dto';
import { SetPasswordDto } from '../dto/request/set-password.dto';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { MessageResponseDto } from '../dto/response/message-response.dto';
import { TokenResponseDto } from '../dto/response/token-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly organizationService: OrganizationService,
  ) {}

  // Looks up all organizations a user belongs to by email
  async lookupOrganizationsByEmail(email: string): Promise<MobileLookupResponseDto> {
    const usersWithOrg = await this.userService.findAllByEmailWithOrg(email);

    return {
      organizations: usersWithOrg.map((u) => ({
        id: u.organization.id,
        name: u.organization.name,
        subdomain: u.organization.subdomain,
        logoUrl: u.organization.logoUrl,
      })),
    };
  }

  // Validates credentials and creates a session for the given type
  async login(
    dto: LoginDto,
    ipAddress?: string,
    sessionType: SessionType = SessionTypeValues.NEXUS,
  ): Promise<AuthResponseDto & { refreshToken?: string }> {
    const user = dto.organizationId
      ? await this.userService.findByEmailAndOrg(dto.email, dto.organizationId)
      : await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException({
        label: 'Invalid Credentials',
        detail: 'The email or password you entered is incorrect. Please check your credentials and try again.',
      });
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException({
        label: 'Password Not Set',
        detail: 'Please set a password before logging in. Check your invitation email.',
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
      throw new UnauthorizedException({
        label: 'Invalid Credentials',
        detail: 'The email or password you entered is incorrect. Please check your credentials and try again.',
      });
    }

    const org = await this.organizationService.getById(user.organizationId);
    if (!org) {
      throw new UnauthorizedException('Organization not found. Please contact support.');
    }

    const { accessToken, refreshToken, expiresIn } = await this.sessionService.createSession(
      user.id,
      sessionType,
      { organizationId: user.organizationId, subdomain: org.subdomain },
      ipAddress,
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
    await this.sessionService.invalidateByAccessToken(accessToken);
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

  // Returns auth status without throwing 401 — resolves org from subdomain via Host header
  async getStatus(refreshToken: string | undefined, subdomain?: string): Promise<AuthResponseDto> {
    // Resolve org regardless of auth state
    const org = subdomain ? await this.organizationService.getBySubdomain(subdomain) : null;
    const orgData = org ? { id: org.id, name: org.name, subdomain: org.subdomain, logoUrl: org.logoUrl } : undefined;

    if (!refreshToken) {
      return new AuthResponseDto({ isAuthenticated: false, org: orgData });
    }

    try {
      const { accessToken, expiresIn, userId, sessionId } = await this.sessionService.generateAccessToken(refreshToken);
      const user = await this.userService.findById(userId);
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
              createdAt: user.createdAt.toISOString(),
              lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
            }
          : undefined,
        org: orgData,
      });
    } catch {
      return new AuthResponseDto({ isAuthenticated: false, org: orgData });
    }
  }

  // Rotates both tokens and returns new access token — sets new refresh cookie in controller
  async refreshTokens(
    refreshToken: string | undefined,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    return this.sessionService.refreshTokens(refreshToken);
  }



  // Recovers session from httpOnly cookie without rotating the refresh token
  async getAccessToken(refreshToken: string | undefined): Promise<TokenResponseDto> {
    const { accessToken, expiresIn } = await this.sessionService.generateAccessToken(refreshToken);
    return { accessToken, expiresIn };
  }
}
