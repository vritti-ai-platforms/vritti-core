import { CreateEmbeddedSignupStateDto } from '@communications/whatsapp-accounts/dto/request/create-embedded-signup-state.dto';
import { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import { EmbeddedSignupConfigResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-config-response.dto';
import { EmbeddedSignupStateResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-state-response.dto';
import { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';

export function ApiGetWhatsappAccountsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get WhatsApp accounts table',
      description: 'Returns paginated, filtered, and sorted WhatsApp accounts using server-stored table state.',
    }),
    ApiResponse({
      status: 200,
      description: 'WhatsApp accounts table retrieved successfully.',
      type: WhatsappAccountTableResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetWhatsappAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a WhatsApp account by ID' }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiResponse({ status: 200, description: 'WhatsApp account retrieved.', type: WhatsappAccountResponseDto }),
    ApiResponse({ status: 404, description: 'WhatsApp account not found.' }),
  );
}

export function ApiUpdateWhatsappAccount() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a WhatsApp account',
      description:
        "Updates the account's own settings. Credentials cannot be written here — use reconnect, which verifies the grant with Meta first.",
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiBody({ type: UpdateWhatsappAccountDto }),
    ApiResponse({ status: 200, description: 'WhatsApp account updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'WhatsApp account not found.' }),
  );
}

export function ApiDeleteWhatsappAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Disconnect a WhatsApp account' }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiResponse({ status: 200, description: 'WhatsApp account disconnected.', type: SuccessResponseDto }),
    ApiResponse({ status: 409, description: 'Cannot disconnect the default account while others exist.' }),
    ApiResponse({ status: 404, description: 'WhatsApp account not found.' }),
  );
}

export function ApiGetEmbeddedSignupConfig() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Embedded Signup configuration',
      description:
        'Reports whether this deployment can run Embedded Signup, which requires a Facebook Login for Business configuration. The ids are informational; the popup is spawned by the broker page, which reads them server-side.',
    }),
    ApiResponse({
      status: 200,
      description: 'Embedded Signup configuration retrieved.',
      type: EmbeddedSignupConfigResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateWhatsappConnectState() {
  return applyDecorators(
    ApiOperation({
      summary: 'Start an Embedded Signup connect',
      description:
        "Mints a single-use, short-lived state and returns the broker URL to open. Meta enforces the signup SDK's host against a fixed allowed-domain list, so the popup runs on one shared origin rather than the tenant subdomain — this state is what carries the organization across to it. The account itself is created when the broker reports the popup's result.",
    }),
    ApiBody({ type: CreateEmbeddedSignupStateDto }),
    ApiResponse({ status: 201, description: 'Connect started.', type: EmbeddedSignupStateResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The return URL is outside this deployment.',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateWhatsappReconnectState() {
  return applyDecorators(
    ApiOperation({
      summary: 'Start an Embedded Signup reconnect',
      description:
        'Mints a single-use state bound to this account and returns the broker URL to open. Completing it replaces the stored credential while keeping the same account row, so an app OTP configuration pointing at it survives. The selected WABA must match the one this connection already holds.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiBody({ type: CreateEmbeddedSignupStateDto }),
    ApiResponse({ status: 201, description: 'Reconnect started.', type: EmbeddedSignupStateResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The return URL is outside this deployment.',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
