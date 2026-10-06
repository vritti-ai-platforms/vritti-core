import { BankAccountDto } from '@domain/bank-account/dto/entity/bank-account.dto';
import { CreateBankAccountDto } from '@domain/bank-account/dto/request/create-bank-account.dto';
import { UpdateBankAccountDto } from '@domain/bank-account/dto/request/update-bank-account.dto';
import { BankAccountsPageResponseDto } from '@domain/bank-account/dto/response/bank-accounts-page-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

const ID = { name: 'id', description: 'Bank account ID' };

const SIGNATURE_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
  ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
];

export function ApiFindForTableBankAccountsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bank accounts table',
      description:
        "Resolves one page of the organization's bank accounts from a serialized view state (filters, search, sort, pagination) that cloud holds. Requires Ed25519 signature headers (x-timestamp, x-signature).",
    }),
    ...SIGNATURE_HEADERS,
    ApiResponse({
      status: 200,
      description: 'Bank accounts page retrieved successfully.',
      type: BankAccountsPageResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListBankAccountsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'List bank accounts of a legal entity',
      description: 'Returns every bank account held by the legal entity, newest first.',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam({ name: 'legalEntityId', description: 'Legal entity ID' }),
    ApiResponse({ status: 200, description: 'Bank accounts retrieved successfully.', type: [BankAccountDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiCreateBankAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create bank account',
      description:
        'Adds a bank account to a legal entity of the organization. The account number is unique per legal entity and IFSC.',
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: CreateBankAccountDto }),
    ApiResponse({ status: 201, description: 'Bank account created successfully.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or legal entity outside the organization.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 409, description: 'The legal entity already holds this account.' }),
  );
}

export function ApiGetBankAccountInternal() {
  return applyDecorators(
    ApiOperation({ summary: 'Get bank account', description: 'Returns a single bank account by ID.' }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Bank account retrieved successfully.', type: BankAccountDto }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Bank account not found.' }),
  );
}

export function ApiUpdateBankAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update bank account',
      description: 'Updates the label, holder, number, IFSC, bank or branch of a bank account.',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiBody({ type: UpdateBankAccountDto }),
    ApiResponse({ status: 200, description: 'Bank account updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Bank account not found.' }),
    ApiResponse({ status: 409, description: 'The legal entity already holds this account.' }),
  );
}

export function ApiDeleteBankAccountInternal() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete bank account', description: 'Deletes a bank account.' }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Bank account deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Bank account not found.' }),
  );
}
