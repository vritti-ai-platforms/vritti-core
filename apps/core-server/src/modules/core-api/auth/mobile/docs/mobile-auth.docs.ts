import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageResponseDto } from '../../root/dto/response/message-response.dto';
import { MobileLoginDto } from '../dto/request/mobile-login.dto';
import { MobileLookupDto } from '../dto/request/mobile-lookup.dto';
import { MobileRefreshDto } from '../dto/request/mobile-refresh.dto';
import { MobileAuthResponseDto } from '../dto/response/mobile-auth-response.dto';
import { MobileLookupResponseDto } from '../dto/response/mobile-lookup-response.dto';
import { MobileTokenResponseDto } from '../dto/response/mobile-token-response.dto';

export function ApiMobileLookup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lookup organizations by email',
      description:
        'Returns all organizations the user belongs to. Used by the mobile app to present an organization picker before login.',
    }),
    ApiBody({ type: MobileLookupDto }),
    ApiResponse({ status: 200, description: 'Organizations returned (may be empty).', type: MobileLookupResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid email format.' }),
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
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Mobile refresh tokens',
      description:
        'Rotates both access and refresh tokens. Requires the current refresh token in the request body. Returns new tokens in the response body.',
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
