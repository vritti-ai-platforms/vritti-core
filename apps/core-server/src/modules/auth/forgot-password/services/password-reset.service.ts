import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@vritti/api-sdk';
import * as argon2 from 'argon2';
import type { FastifyReply } from 'fastify';
import { SessionTypeValues } from '@/db/schema';
import { EmailService } from '@vritti/api-sdk';
import { UserService } from '../../../user/services/user.service';
import { getRefreshCookieName, getRefreshCookieOptionsFromConfig, SessionService } from '../../root/services/session.service';
import { VerificationRepository } from '../../../verification/repositories/verification.repository';
import { ForgotPasswordResponseDto } from '../dto/response/forgot-password-response.dto';
import { MessageResponseDto } from '../../root/dto/response/message-response.dto';
import { ResetPasswordResponseDto } from '../dto/response/reset-password-response.dto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  // Max time (in minutes) after OTP verification to complete the password reset
  private readonly RESET_WINDOW_MINUTES = 10;

  // Security message — identical for found and not-found cases to prevent email enumeration
  private readonly RESET_MESSAGE = 'If an account exists, a reset code has been sent.';

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly verificationRepository: VerificationRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Parses an OTP expiry string like '5m' or '10m' into a future Date
  private parseOtpExpiry(): Date {
    const expiry = this.configService.get<string>('OTP_EXPIRY', '5m');
    const match = expiry.match(/^(\d+)([smh])$/);

    if (!match) {
      // Default to 5 minutes if unparseable
      const date = new Date();
      date.setMinutes(date.getMinutes() + 5);
      return date;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const date = new Date();

    if (unit === 's') date.setSeconds(date.getSeconds() + value);
    else if (unit === 'm') date.setMinutes(date.getMinutes() + value);
    else if (unit === 'h') date.setHours(date.getHours() + value);

    return date;
  }

  // Sends OTP and creates a RESET session — returns generic message if user not found (no email enumeration)
  async requestPasswordReset(email: string, reply: FastifyReply): Promise<ForgotPasswordResponseDto> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { success: true, message: this.RESET_MESSAGE };
    }

    if (!user.passwordHash) {
      this.logger.log(`Password reset requested for passwordless user: ${user.id}`);
      return { success: true, message: this.RESET_MESSAGE };
    }

    // Generate 6-digit OTP and hash it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await argon2.hash(otp);
    const expiresAt = this.parseOtpExpiry();

    // Upsert verification record (delete old, insert new)
    await this.verificationRepository.upsert({
      userId: user.id,
      otpHash,
      expiresAt,
    });

    // Fire and forget email
    this.emailService
      .sendPasswordResetEmail(email, otp, expiresAt, user.fullName || undefined)
      .then(() => {
        this.logger.log(`Sent password reset email to ${email} for user ${user.id}`);
      })
      .catch((error: Error) => {
        this.logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
      });

    // Create RESET session so subsequent endpoints can identify the user
    const { accessToken, refreshToken, expiresIn } = await this.sessionService.createSession(
      user.id,
      SessionTypeValues.RESET,
    );

    // Set refresh cookie for the RESET session
    reply.setCookie(getRefreshCookieName(), refreshToken, getRefreshCookieOptionsFromConfig());

    this.logger.log(`Created RESET session for user: ${user.id}`);

    return { success: true, message: this.RESET_MESSAGE, accessToken, expiresIn };
  }

  // Verifies the submitted OTP against the stored hash and marks the record as verified
  async verifyResetOtp(otp: string, userId: string): Promise<MessageResponseDto> {
    const maxAttempts = this.configService.get<number>('OTP_MAX_ATTEMPTS', 5);

    const verification = await this.verificationRepository.findByUserId(userId);

    if (!verification) {
      throw new BadRequestException({
        label: 'No Reset Code Found',
        detail: 'No active password reset was found. Please request a new reset code.',
      });
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException({
        label: 'Code Expired',
        detail: 'Your reset code has expired. Please request a new password reset.',
        errors: [{ field: 'otp', message: 'Code expired' }],
      });
    }

    if (verification.attempts >= maxAttempts) {
      throw new BadRequestException({
        label: 'Too Many Attempts',
        detail: 'You have exceeded the maximum number of attempts. Please request a new password reset.',
        errors: [{ field: 'otp', message: 'Too many attempts' }],
      });
    }

    const isValid = await argon2.verify(verification.otpHash, otp);

    if (!isValid) {
      // Increment attempts on invalid OTP
      await this.verificationRepository.update(verification.id, {
        attempts: verification.attempts + 1,
      });

      throw new BadRequestException({
        label: 'Invalid Code',
        detail: 'The code you entered is incorrect. Please check and try again.',
        errors: [{ field: 'otp', message: 'Invalid code' }],
      });
    }

    // Mark as verified
    await this.verificationRepository.update(verification.id, {
      isVerified: true,
      verifiedAt: new Date(),
    });

    this.logger.log(`Password reset OTP verified for user: ${userId}`);

    return { message: 'Code verified successfully.' };
  }

  // Generates a new OTP and resends the reset email using the RESET session userId
  async resendResetOtp(userId: string): Promise<MessageResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await argon2.hash(otp);
    const expiresAt = this.parseOtpExpiry();

    await this.verificationRepository.upsert({
      userId: user.id,
      otpHash,
      expiresAt,
    });

    this.emailService
      .sendPasswordResetEmail(user.email, otp, expiresAt, user.fullName || undefined)
      .then(() => {
        this.logger.log(`Resent password reset email for user: ${userId}`);
      })
      .catch((error: Error) => {
        this.logger.error(`Failed to resend password reset email for user ${userId}: ${error.message}`);
      });

    return { message: 'Verification code sent successfully.' };
  }

  // Validates verified OTP window, resets password, and creates a new NEXUS session
  async resetPassword(newPassword: string, userId: string, reply: FastifyReply): Promise<ResetPasswordResponseDto> {
    const verification = await this.verificationRepository.findByUserId(userId);

    if (!verification?.isVerified || !verification.verifiedAt) {
      throw new BadRequestException({
        label: 'OTP Not Verified',
        detail: 'Please verify the reset code before setting a new password.',
      });
    }

    // Check that password reset is being completed within the allowed window
    const expiryTime = new Date(verification.verifiedAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + this.RESET_WINDOW_MINUTES);

    if (new Date() > expiryTime) {
      throw new BadRequestException({
        label: 'Session Expired',
        detail: 'Your password reset session has expired. Please request a new password reset.',
      });
    }

    // Hash and store new password
    const passwordHash = await argon2.hash(newPassword);
    await this.userService.setPassword(userId, passwordHash);

    // Invalidate all sessions for security, then create a fresh NEXUS session
    await this.sessionService.deleteAllUserSessions(userId);

    const { accessToken, refreshToken, expiresIn } = await this.sessionService.createSession(
      userId,
      SessionTypeValues.NEXUS,
    );

    // Clear old cookie, set new NEXUS refresh cookie
    reply.clearCookie(getRefreshCookieName(), { path: '/' });
    reply.setCookie(getRefreshCookieName(), refreshToken, getRefreshCookieOptionsFromConfig());

    this.logger.log(`Password reset completed for user: ${userId}`);

    return {
      success: true,
      message: 'Password has been reset successfully.',
      accessToken,
      expiresIn,
    };
  }
}
