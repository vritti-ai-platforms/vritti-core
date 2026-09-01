import { CreateSmsProviderDto } from '@communications/sms-providers/dto/request/create-sms-provider.dto';
import { UpdateSmsProviderDto } from '@communications/sms-providers/dto/request/update-sms-provider.dto';
import { SmsProviderResponseDto } from '@communications/sms-providers/dto/response/sms-provider-response.dto';
import { SmsProviderTableResponseDto } from '@communications/sms-providers/dto/response/sms-provider-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

export function ApiGetSmsProvidersTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the SMS providers table',
      description: "The organization's own provider accounts plus the Vritti-managed platform rows.",
    }),
    ApiResponse({ status: 200, description: 'Providers retrieved.', type: SmsProviderTableResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetSmsProvider() {
  return applyDecorators(
    ApiOperation({ summary: 'Get an SMS provider' }),
    ApiParam({ name: 'id', description: 'SMS provider ID' }),
    ApiResponse({ status: 200, description: 'Provider retrieved.', type: SmsProviderResponseDto }),
    ApiResponse({ status: 404, description: 'SMS provider not found.' }),
  );
}

export function ApiCreateSmsProvider() {
  return applyDecorators(
    ApiOperation({
      summary: 'Connect an SMS provider',
      description: 'Creates an organization-owned (CLIENT) provider account with its credentials.',
    }),
    ApiBody({ type: CreateSmsProviderDto }),
    ApiResponse({ status: 201, description: 'Provider connected.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid provider payload.' }),
  );
}

export function ApiUpdateSmsProvider() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an SMS provider',
      description: 'Platform-managed rows are rejected — they can only change from the cloud admin panel.',
    }),
    ApiParam({ name: 'id', description: 'SMS provider ID' }),
    ApiBody({ type: UpdateSmsProviderDto }),
    ApiResponse({ status: 200, description: 'Provider updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Platform providers cannot be changed here.' }),
    ApiResponse({ status: 404, description: 'SMS provider not found.' }),
  );
}

export function ApiDeleteSmsProvider() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove an SMS provider',
      description: 'Platform-managed rows are rejected — they can only change from the cloud admin panel.',
    }),
    ApiParam({ name: 'id', description: 'SMS provider ID' }),
    ApiResponse({ status: 200, description: 'Provider removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Platform providers cannot be changed here.' }),
    ApiResponse({ status: 404, description: 'SMS provider not found.' }),
  );
}
