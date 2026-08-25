import { CreateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
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

export function ApiCreateWhatsappAccount() {
  return applyDecorators(
    ApiOperation({
      summary: 'Connect a WhatsApp Business Account',
      description: 'Stores the WABA and its access token. The first account connected becomes the default sender.',
    }),
    ApiBody({ type: CreateWhatsappAccountDto }),
    ApiResponse({ status: 201, description: 'WhatsApp account connected successfully.', type: CreateResponseDto }),
    ApiResponse({ status: 409, description: 'This WABA is already connected to the organization.' }),
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
      description: 'Omitting accessToken leaves the stored credential untouched.',
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
