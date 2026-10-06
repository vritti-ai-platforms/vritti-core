import { BankAccountDto } from '@domain/bank-account/dto/entity/bank-account.dto';
import { UpdateBankAccountDto } from '@domain/bank-account/dto/request/update-bank-account.dto';
import { BankAccountsTableResponseDto } from '@domain/bank-account/dto/response/bank-accounts-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { CreateLeBankAccountDto } from '../dto/request/create-le-bank-account.dto';

const ID = { name: 'id', description: 'Bank account ID' };

export function ApiFindForTableBankAccounts() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bank accounts table',
      description: "The user's saved view of the bank accounts held by the legal entity in context (x-le-id).",
    }),
    ApiResponse({ status: 200, type: BankAccountsTableResponseDto }),
    ApiResponse({ status: 400, description: 'A legal entity context is required.' }),
  );
}

export function ApiListBankAccounts() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bank accounts of the legal entity in context',
      description: 'Every bank account held by the legal entity named by x-le-id, newest first.',
    }),
    ApiResponse({ status: 200, type: [BankAccountDto] }),
    ApiResponse({ status: 400, description: 'A legal entity context is required.' }),
  );
}

export function ApiCreateBankAccount() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a bank account',
      description:
        'Adds a bank account to the legal entity in context. The account number is unique per legal entity and IFSC.',
    }),
    ApiBody({ type: CreateLeBankAccountDto }),
    ApiResponse({ status: 201, description: 'Bank account added.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input or no legal entity context.' }),
    ApiResponse({ status: 409, description: 'The legal entity already holds this account.' }),
  );
}

export function ApiGetBankAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a bank account' }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: BankAccountDto }),
    ApiResponse({ status: 404, description: 'Bank account not found.' }),
  );
}

export function ApiUpdateBankAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a bank account' }),
    ApiParam(ID),
    ApiBody({ type: UpdateBankAccountDto }),
    ApiResponse({ status: 200, description: 'Bank account updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Bank account not found.' }),
    ApiResponse({ status: 409, description: 'The legal entity already holds this account.' }),
  );
}

export function ApiDeleteBankAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a bank account' }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Bank account removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Bank account not found.' }),
  );
}
