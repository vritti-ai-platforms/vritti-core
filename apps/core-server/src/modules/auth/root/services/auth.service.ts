import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { BadRequestException, UnauthorizedException } from '@vritti/api-sdk';
import { SessionTypeValues, UserStatusValues } from '@/db/schema';
import { UserService } from '../../../user/services/user.service';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { LoginDto } from '../dto/request/login.dto';
import { SetPasswordDto } from '../dto/request/set-password.dto';
import { TokenResponseDto } from '../dto/response/token-response.dto';
import { MessageResponseDto } from '../dto/response/message-response.dto';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  // Validates credentials and creates a NEXUS session, returning access token in response
  async login(dto: LoginDto, ipAddress?: string): Promise<AuthResponseDto & { refreshToken?: string }> {
    const user = await this.userService.findByEmail(dto.email);

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

    const { accessToken, refreshToken, expiresIn } = await this.sessionService.createSession(
      user.id,
      SessionTypeValues.NEXUS,
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

  // Returns auth status without throwing 401 — used for client-side session checks
  async getStatus(refreshToken: string | undefined): Promise<AuthResponseDto> {
    if (!refreshToken) {
      return new AuthResponseDto({ isAuthenticated: false });
    }

    try {
      const { accessToken, expiresIn, userId } = await this.sessionService.generateAccessToken(refreshToken);
      const user = await this.userService.findById(userId);
      return new AuthResponseDto({
        isAuthenticated: true,
        accessToken,
        expiresIn,
        user: user ? {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          hasPassword: user.passwordHash !== null,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        } : undefined,
      });
    } catch {
      return new AuthResponseDto({ isAuthenticated: false });
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
