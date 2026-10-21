import { PayoutAccountDto } from '@domain/payout-account/dto/entity/payout-account.dto';
import { CreatePayoutAccountDto } from '@domain/payout-account/dto/request/create-payout-account.dto';
import { UpdatePayoutAccountDto } from '@domain/payout-account/dto/request/update-payout-account.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

const ID = ApiParam({ name: 'id', description: 'Payout account ID' });
const ORG_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
  ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
];
const UNAUTHORIZED = ApiResponse({ status: 401, description: 'Invalid or missing request signature.' });
const NOT_FOUND = ApiResponse({ status: 404, description: 'Payout account not found.' });

export function ApiListPayoutAccountsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'List payout accounts',
      description:
        'The payout accounts of a bank account, or every one of a legal entity, with the gateway and bank each names. Only the last four digits of an account number are returned.',
    }),
    ...ORG_HEADERS,
    ApiQuery({ name: 'bankAccountId', required: false }),
    ApiQuery({ name: 'legalEntityId', required: false }),
    ApiResponse({ status: 200, description: 'Payout accounts retrieved.', type: [PayoutAccountDto] }),
    UNAUTHORIZED,
    ApiResponse({ status: 404, description: 'Legal entity not found.' }),
  );
}

export function ApiCreatePayoutAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a payout account',
      description:
        "Adds a gateway account to a bank account. The id is stored as entered; it is marked as the gateway's main account when it equals the gateway's own id. A gateway account is one payout account.",
    }),
    ...ORG_HEADERS,
    ApiBody({ type: CreatePayoutAccountDto }),
    ApiResponse({ status: 201, description: 'Payout account added.', type: CreateResponseDto }),
    ApiResponse({
      status: 400,
      description: 'Invalid gateway, or an account a gateway without split payments cannot pay into.',
    }),
    UNAUTHORIZED,
    ApiResponse({ status: 404, description: 'Bank account not found.' }),
    ApiResponse({ status: 409, description: 'The gateway account is already a payout account.' }),
  );
}

export function ApiUpdatePayoutAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change a payout account',
      description: 'Changes the gateway account id; the bank account and gateway are fixed.',
    }),
    ...ORG_HEADERS,
    ID,
    ApiBody({ type: UpdatePayoutAccountDto }),
    ApiResponse({ status: 200, description: 'Payout account updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'An account the gateway cannot pay into.' }),
    UNAUTHORIZED,
    NOT_FOUND,
    ApiResponse({ status: 409, description: 'Payout channels use this payout account.' }),
  );
}

export function ApiDeletePayoutAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a payout account',
      description: 'Refused while payout channels use it.',
    }),
    ...ORG_HEADERS,
    ID,
    ApiResponse({ status: 200, description: 'Payout account removed.', type: SuccessResponseDto }),
    UNAUTHORIZED,
    NOT_FOUND,
    ApiResponse({ status: 409, description: 'Payout channels use this payout account.' }),
  );
}
