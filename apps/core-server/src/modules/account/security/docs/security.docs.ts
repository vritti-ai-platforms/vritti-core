import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { ChangePasswordDto } from '../dto/request/change-password.dto';
import { SessionResponseDto } from '../dto/response/session-response.dto';

export function ApiChangePassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Change password',
      description: 'Verifies the current password and replaces it with a new one. Rejects if the new password is identical to the current one.',
    }),
    ApiBody({ type: ChangePasswordDto }),
    ApiResponse({ status: 200, description: 'Password changed successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Current password incorrect or new password is the same.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetSessions() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List active sessions',
      description: 'Returns all active sessions for the authenticated user. The current session is flagged with isCurrent: true.',
    }),
    ApiResponse({ status: 200, description: 'Session list returned.', type: [SessionResponseDto] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiRevokeSession() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Revoke a session',
      description: 'Deletes the specified session. Cannot be used to revoke the current session — use logout instead.',
    }),
    ApiParam({ name: 'id', description: 'Session ID to revoke' }),
    ApiResponse({ status: 200, description: 'Session revoked successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Cannot revoke the current session.' }),
    ApiResponse({ status: 404, description: 'Session not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiRevokeAllSessions() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Revoke all other sessions',
      description: 'Deletes all sessions for the user except the current one. Pushes a logout event to all affected sessions via SSE.',
    }),
    ApiResponse({ status: 200, description: 'All other sessions revoked.', type: SuccessResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
