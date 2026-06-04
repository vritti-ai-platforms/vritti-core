import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CookieName, type CookieSerializeOptions, Public, RefreshCookieOptions, RequireSession, UserId } from '@vritti/api-sdk';
import type { FastifyReply } from 'fastify';
import { SessionTypeValues } from '@/db/schema';
import { MessageResponseDto } from '../../root/dto/response/message-response.dto';
import {
  ApiForgotPassword,
  ApiResendResetOtp,
  ApiResetPassword,
  ApiVerifyResetOtp,
} from '../docs/forgot-password.docs';
import { ForgotPasswordDto } from '../dto/request/forgot-password.dto';
import { ResetPasswordDto } from '../dto/request/reset-password.dto';
import { VerifyResetOtpDto } from '../dto/request/verify-reset-otp.dto';
import { ForgotPasswordResponseDto } from '../dto/response/forgot-password-response.dto';
import { ResetPasswordResponseDto } from '../dto/response/reset-password-response.dto';
import { PasswordResetService } from '../services/password-reset.service';

@ApiTags('Auth')
@Controller('auth')
export class ForgotPasswordController {
  private readonly logger = new Logger(ForgotPasswordController.name);

  constructor(private readonly passwordResetService: PasswordResetService) {}

  // Sends a reset OTP to the email if an account exists and creates a RESET session
  @Post('forgot-password')
  @Public()
  @ApiForgotPassword()
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Res({ passthrough: true }) reply: FastifyReply,
    @RefreshCookieOptions() cookieOptions: CookieSerializeOptions,
    @CookieName() cookieName: string,
  ): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`POST /auth/forgot-password - Email: ${dto.email}`);
    const { refreshToken, ...response } = await this.passwordResetService.requestPasswordReset(dto.email);
    if (refreshToken) {
      reply.setCookie(cookieName, refreshToken, cookieOptions);
    }
    return response;
  }

  // Resends the reset OTP using the active RESET session
  @Post('resend-reset-otp')
  @HttpCode(HttpStatus.OK)
  @RequireSession(SessionTypeValues.RESET)
  @ApiResendResetOtp()
  async resendResetOtp(@UserId() userId: string): Promise<MessageResponseDto> {
    this.logger.log(`POST /auth/resend-reset-otp - User: ${userId}`);
    return this.passwordResetService.resendResetOtp(userId);
  }

  // Verifies the submitted OTP against the active RESET session
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @RequireSession(SessionTypeValues.RESET)
  @ApiVerifyResetOtp()
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto, @UserId() userId: string): Promise<MessageResponseDto> {
    this.logger.log(`POST /auth/verify-reset-otp - User: ${userId}`);
    return this.passwordResetService.verifyResetOtp(dto.otp, userId);
  }

  // Resets the password, invalidates all sessions, and issues a new NEXUS session
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RequireSession(SessionTypeValues.RESET)
  @ApiResetPassword()
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @UserId() userId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
    @RefreshCookieOptions() cookieOptions: CookieSerializeOptions,
    @CookieName() cookieName: string,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log(`POST /auth/reset-password - User: ${userId}`);
    const { refreshToken, ...response } = await this.passwordResetService.resetPassword(dto.newPassword, userId);
    reply.clearCookie(cookieName, { path: cookieOptions.path, domain: cookieOptions.domain });
    reply.setCookie(cookieName, refreshToken, cookieOptions);
    return response;
  }
}
