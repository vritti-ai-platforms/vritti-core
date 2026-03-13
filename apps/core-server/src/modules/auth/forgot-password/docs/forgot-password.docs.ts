import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForgotPasswordDto } from '../dto/request/forgot-password.dto';
import { ResetPasswordDto } from '../dto/request/reset-password.dto';
import { VerifyResetOtpDto } from '../dto/request/verify-reset-otp.dto';
import { ForgotPasswordResponseDto } from '../dto/response/forgot-password-response.dto';
import { ResetPasswordResponseDto } from '../dto/response/reset-password-response.dto';
import { MessageResponseDto } from '../../root/dto/response/message-response.dto';

export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Request password reset',
      description:
        'Sends a 6-digit OTP to the email address if an account exists. Creates a RESET session and sets the refresh cookie. Always returns the same generic message to prevent email enumeration.',
    }),
    ApiBody({ type: ForgotPasswordDto }),
    ApiResponse({ status: 201, description: 'Reset email sent (or silently ignored).', type: ForgotPasswordResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
  );
}

export function ApiResendResetOtp() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Resend password reset OTP',
      description:
        'Generates a new OTP and resends the reset email. Requires an active RESET session token. Rotates the refresh cookie.',
    }),
    ApiResponse({ status: 200, description: 'OTP resent successfully.', type: MessageResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or expired RESET session.' }),
  );
}

export function ApiVerifyResetOtp() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Verify password reset OTP',
      description:
        'Verifies the 6-digit OTP submitted by the user. Requires an active RESET session. Marks the verification as complete, enabling the reset-password endpoint.',
    }),
    ApiBody({ type: VerifyResetOtpDto }),
    ApiResponse({ status: 200, description: 'OTP verified successfully.', type: MessageResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid, expired, or too many attempts on OTP.' }),
    ApiResponse({ status: 401, description: 'Invalid or expired RESET session.' }),
  );
}

export function ApiResetPassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Reset password',
      description:
        'Sets a new password after OTP has been verified. Requires an active RESET session. Invalidates all existing sessions, creates a new NEXUS session, and rotates the refresh cookie.',
    }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({ status: 200, description: 'Password reset successfully.', type: ResetPasswordResponseDto }),
    ApiResponse({ status: 400, description: 'OTP not verified, reset window expired, or weak password.' }),
    ApiResponse({ status: 401, description: 'Invalid or expired RESET session.' }),
  );
}
