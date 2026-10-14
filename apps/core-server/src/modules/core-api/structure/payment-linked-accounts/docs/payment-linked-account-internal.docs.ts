import { PaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/entity/payment-linked-account.dto';
import { RegisterPaymentLinkedAccountDto } from '@domain/payment-linked-account/dto/request/register-payment-linked-account.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

const ID = { name: 'id', description: 'Payment linked account ID' };

const SIGNATURE_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
  ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
];

export function ApiListPaymentLinkedAccountsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Linked accounts of a collector',
      description:
        'Every linked account registered against a split-enabled gateway config, newest first. Pass legalEntityId to require the collector to belong to that legal entity. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, type: [PaymentLinkedAccountDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Payment gateway config not found.' }),
  );
}

export function ApiRegisterPaymentLinkedAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a linked account',
      description:
        "Opens a linked account at the collector's gateway for a bank account of the organization (any legal entity). Business details are forwarded to the gateway and not stored. Transfers open 24 hours after registration. Requires Ed25519 signature headers (x-timestamp, x-signature).",
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: RegisterPaymentLinkedAccountDto }),
    ApiResponse({ status: 201, description: 'Linked account registered.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input, split payments off, or an unknown bank account.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Payment gateway config not found.' }),
    ApiResponse({ status: 409, description: 'The bank account is already linked to this collector.' }),
  );
}

export function ApiRefreshPaymentLinkedAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh a linked account status',
      description:
        "Pulls the linked account's activation status from the gateway and records it. Requires Ed25519 signature headers (x-timestamp, x-signature).",
    }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiResponse({
      status: 200,
      description: 'Status refreshed; data carries the linked account.',
      type: CreateResponseDto,
    }),
    ApiResponse({ status: 400, description: 'The account was never created at the gateway.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Linked account not found.' }),
  );
}

export function ApiDeletePaymentLinkedAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a linked account',
      description:
        'Removes the local linked-account record; the account at the gateway is left in place. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Linked account removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Linked account not found.' }),
  );
}
