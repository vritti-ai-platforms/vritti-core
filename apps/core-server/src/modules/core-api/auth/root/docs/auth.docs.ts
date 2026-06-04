import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcceptInviteDto } from '../dto/request/accept-invite.dto';
import { LoginDto } from '../dto/request/login.dto';
import { MobileLoginDto } from '../dto/request/mobile-login.dto';
import { MobileLookupDto } from '../dto/request/mobile-lookup.dto';
import { MobileRefreshDto } from '../dto/request/mobile-refresh.dto';
import { SetPasswordDto } from '../dto/request/set-password.dto';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { MessageResponseDto } from '../dto/response/message-response.dto';
import { MobileAuthResponseDto } from '../dto/response/mobile-auth-response.dto';
import { MobileLookupResponseDto } from '../dto/response/mobile-lookup-response.dto';
import { MobileTokenResponseDto } from '../dto/response/mobile-token-response.dto';
import { TokenResponseDto } from '../dto/response/token-response.dto';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description:
        'Authenticates a nexus user with email and password. Returns an access token and sets a refresh token in an httpOnly cookie.',
    }),
    ApiBody({ type: LoginDto }),
    ApiResponse({ status: 201, description: 'Login successful.', type: AuthResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid credentials or account not active.' }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Logout current session',
      description: 'Invalidates the current session and clears the refresh token cookie.',
    }),
    ApiResponse({ status: 200, description: 'Successfully logged out.', type: MessageResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSetPassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Set password for first login',
      description:
        'Sets a password for a nexus user who was created via webhook. Requires a SET_PASSWORD session token. Invalidates the session on success — user must log in again.',
    }),
    ApiBody({ type: SetPasswordDto }),
    ApiResponse({ status: 200, description: 'Password set successfully.', type: MessageResponseDto }),
    ApiResponse({ status: 400, description: 'Password mismatch or password already set.' }),
    ApiResponse({ status: 401, description: 'Invalid or expired set-password session.' }),
  );
}

export function ApiAcceptInvite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Accept organization invitation',
      description:
        'Validates a SET_PASSWORD invitation token, sets the user password, and invalidates all sessions. The user must log in again after setting their password.',
    }),
    ApiBody({ type: AcceptInviteDto }),
    ApiResponse({ status: 200, description: 'Password set successfully.', type: MessageResponseDto }),
    ApiResponse({ status: 400, description: 'Password mismatch or password already set.' }),
    ApiResponse({ status: 401, description: 'Invalid or expired invitation token.' }),
  );
}

export function ApiGetAuthStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get authentication status',
      description:
        'Checks whether the user has an active session using the httpOnly refresh cookie. Never returns 401 — returns isAuthenticated: false instead.',
    }),
    ApiResponse({ status: 200, description: 'Authentication status returned.', type: AuthResponseDto }),
  );
}

export function ApiRefreshTokens() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Generates a new access token and rotates the refresh token using the httpOnly cookie. Sets the new refresh token in the cookie.',
    }),
    ApiResponse({ status: 201, description: 'Token refreshed successfully.', type: TokenResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' }),
  );
}

export function ApiGetAccessToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Recover session token',
      description:
        'Recovers the session by reading the refresh token from the httpOnly cookie and returns a new access token. Does not rotate the refresh token.',
    }),
    ApiResponse({ status: 200, description: 'Session recovered successfully.', type: TokenResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' }),
  );
}

export function ApiMobileLookup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lookup organizations by email',
      description:
        'Returns all organizations the user belongs to. Used by the mobile app to present an organization picker before login.',
    }),
    ApiBody({ type: MobileLookupDto }),
    ApiResponse({ status: 200, description: 'Organizations retrieved successfully.', type: MobileLookupResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid email format or no account found for the given email.' }),
  );
}

export function ApiMobileLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Mobile login',
      description:
        'Authenticates a user with email and password. Returns access token and refresh token in the response body. No cookies are used.',
    }),
    ApiBody({ type: MobileLoginDto }),
    ApiResponse({ status: 201, description: 'Login successful.', type: MobileAuthResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid credentials or account not active.' }),
  );
}

export function ApiMobileRefreshTokens() {
  return applyDecorators(
    ApiOperation({
      summary: 'Mobile refresh tokens',
      description:
        'Rotates both access and refresh tokens using the current mobile refresh token in the request body. No access token or cookie is required.',
    }),
    ApiBody({ type: MobileRefreshDto }),
    ApiResponse({ status: 200, description: 'Tokens refreshed successfully.', type: MobileTokenResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' }),
  );
}

export function ApiMobileLogout() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Mobile logout',
      description: 'Invalidates the current session. The client should clear stored tokens.',
    }),
    ApiResponse({ status: 200, description: 'Successfully logged out.', type: MessageResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiMobileGetStatus() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Mobile auth status',
      description: 'Returns the authenticated user profile. Requires a valid MOBILE session access token.',
    }),
    ApiResponse({ status: 200, description: 'User profile returned.', type: MobileAuthResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
