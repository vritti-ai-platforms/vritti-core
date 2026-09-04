import { ConnectEmbeddedSignupDto } from '@communications/whatsapp-accounts/dto/request/connect-embedded-signup.dto';
import { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import { EmbeddedSignupConfigResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-config-response.dto';
import { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

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
        'Returns the public Meta app id and Facebook Login for Business configuration id the browser needs to open the signup popup.',
    }),
    ApiResponse({
      status: 200,
      description: 'Embedded Signup configuration retrieved.',
      type: EmbeddedSignupConfigResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiConnectWhatsappAccountEmbedded() {
  return applyDecorators(
    ApiOperation({
      summary: 'Connect a WhatsApp Business Account via Embedded Signup',
      description:
        "Exchanges the popup's authorization code for a business integration token, verifies the token actually grants whatsapp_business_management on the reported WABA, then stores the account with its name and business portfolio read from Meta. The first account connected becomes the default sender.",
    }),
    ApiBody({ type: ConnectEmbeddedSignupDto }),
    ApiResponse({ status: 201, description: 'WhatsApp account connected successfully.', type: CreateResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The signup code was rejected, or the token does not grant access to that WABA.',
    }),
    ApiResponse({ status: 409, description: 'This WABA is already connected to the organization.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiReconnectWhatsappAccount() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reconnect a WhatsApp account via Embedded Signup',
      description:
        'Replaces the stored credential from a fresh signup result, keeping the same account row so an app OTP configuration pointing at it survives. The selected WABA must match the one this connection already holds.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiBody({ type: ConnectEmbeddedSignupDto }),
    ApiResponse({ status: 200, description: 'WhatsApp account reconnected.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: 'A different WABA was selected, the signup code was rejected, or access was not granted.',
    }),
    ApiResponse({ status: 404, description: 'WhatsApp account not found.' }),
  );
}
