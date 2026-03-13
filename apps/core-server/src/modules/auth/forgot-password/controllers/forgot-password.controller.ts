import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, Reset, UserId } from '@vritti/api-sdk';
import type { FastifyReply } from 'fastify';
import { ApiForgotPassword, ApiResendResetOtp, ApiResetPassword, ApiVerifyResetOtp } from '../docs/forgot-password.docs';
import { ForgotPasswordDto } from '../dto/request/forgot-password.dto';
import { ResetPasswordDto } from '../dto/request/reset-password.dto';
import { VerifyResetOtpDto } from '../dto/request/verify-reset-otp.dto';
import { ForgotPasswordResponseDto } from '../dto/response/forgot-password-response.dto';
import { ResetPasswordResponseDto } from '../dto/response/reset-password-response.dto';
import { MessageResponseDto } from '../../root/dto/response/message-response.dto';
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
  ): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`POST /auth/forgot-password - Email: ${dto.email}`);
    return this.passwordResetService.requestPasswordReset(dto.email, reply);
  }

  // Resends the reset OTP using the active RESET session
  @Post('resend-reset-otp')
  @HttpCode(HttpStatus.OK)
  @Reset()
  @ApiResendResetOtp()
  async resendResetOtp(@UserId() userId: string): Promise<MessageResponseDto> {
    this.logger.log(`POST /auth/resend-reset-otp - User: ${userId}`);
    return this.passwordResetService.resendResetOtp(userId);
  }

  // Verifies the submitted OTP against the active RESET session
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @Reset()
  @ApiVerifyResetOtp()
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto, @UserId() userId: string): Promise<MessageResponseDto> {
    this.logger.log(`POST /auth/verify-reset-otp - User: ${userId}`);
    return this.passwordResetService.verifyResetOtp(dto.otp, userId);
  }

  // Resets the password, invalidates all sessions, and issues a new NEXUS session
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Reset()
  @ApiResetPassword()
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @UserId() userId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log(`POST /auth/reset-password - User: ${userId}`);
    return this.passwordResetService.resetPassword(dto.newPassword, userId, reply);
  }
}
