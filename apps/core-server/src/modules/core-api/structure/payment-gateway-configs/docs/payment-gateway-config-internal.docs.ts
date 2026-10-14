import { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import { UpdatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-payment-gateway-config.dto';
import { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import { PaymentGatewayConfigsPageResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-configs-page-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PaymentGatewayOptionDto } from '@/modules/payments-gateway/gateways/dto/response/payment-gateway-option.dto';

const ID = { name: 'id', description: 'Payment gateway config ID' };

const SIGNATURE_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
  ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
];

export function ApiFindForTablePaymentGatewayConfigsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Payment gateway configs table',
      description:
        "Resolves one page of the organization's payment gateway configs from a serialized view state (filters, search, sort, pagination) that cloud holds. Secrets are never included. Requires Ed25519 signature headers (x-timestamp, x-signature).",
    }),
    ...SIGNATURE_HEADERS,
    ApiResponse({
      status: 200,
      description: 'Payment gateway configs page retrieved successfully.',
      type: PaymentGatewayConfigsPageResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListPaymentGatewaysInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'List supported payment gateways',
      description:
        'The gateways payments-service can charge through, with the credential fields each one takes. Intersect with the catalog to offer only what the deployment is entitled to.',
    }),
    ...SIGNATURE_HEADERS,
    ApiResponse({
      status: 200,
      description: 'Payment gateways retrieved successfully.',
      type: [PaymentGatewayOptionDto],
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListPaymentGatewayConfigsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'List payment gateway configs of a legal entity',
      description: 'Returns every payment gateway config of the legal entity, newest first.',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam({ name: 'legalEntityId', description: 'Legal entity ID' }),
    ApiResponse({
      status: 200,
      description: 'Payment gateway configs retrieved successfully.',
      type: [PaymentGatewayConfigDto],
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListPaymentGatewayConfigsByBankAccountInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'List payment gateway configs settling into a bank account',
      description: 'Returns every payment gateway config that settles into the bank account, newest first.',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam({ name: 'bankAccountId', description: 'Bank account ID' }),
    ApiResponse({
      status: 200,
      description: 'Payment gateway configs retrieved successfully.',
      type: [PaymentGatewayConfigDto],
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiCreatePaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create payment gateway config',
      description:
        'Adds a payment gateway config to a legal entity of the organization. Credentials are validated against the gateway field list, encrypted at rest and never returned. One config per legal entity, type, gateway, site and app.',
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: CreatePaymentGatewayConfigDto }),
    ApiResponse({ status: 201, description: 'Payment gateway config created successfully.', type: CreateResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'Invalid input, unsupported gateway, incomplete credentials, or a reference outside the legal entity.',
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 409, description: 'A config already occupies this scope.' }),
  );
}

export function ApiGetPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get payment gateway config',
      description: 'Returns a single payment gateway config by ID, without its secrets.',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiResponse({
      status: 200,
      description: 'Payment gateway config retrieved successfully.',
      type: PaymentGatewayConfigDto,
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Payment gateway config not found.' }),
  );
}

export function ApiUpdatePaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update payment gateway config',
      description:
        'Updates a payment gateway config. Sending credentials rotates the stored set; omitting them keeps the existing ciphertext.',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiBody({ type: UpdatePaymentGatewayConfigDto }),
    ApiResponse({ status: 200, description: 'Payment gateway config updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input, unsupported gateway or incomplete credentials.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Payment gateway config not found.' }),
    ApiResponse({ status: 409, description: 'A config already occupies this scope.' }),
  );
}

export function ApiVerifyPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify payment gateway config',
      description:
        'Has the provider check the stored credentials. A pass records verifiedAt and the merchant id the provider reports; a rejection names the credential field at fault.',
    }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiResponse({
      status: 200,
      description: 'Payment gateway config verified successfully.',
      type: PaymentGatewayConfigVerificationResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'The provider rejected the credentials, or the gateway is not supported.',
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Payment gateway config not found.' }),
  );
}

export function ApiDeletePaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete payment gateway config', description: 'Deletes a payment gateway config.' }),
    ...SIGNATURE_HEADERS,
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Payment gateway config deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 404, description: 'Payment gateway config not found.' }),
  );
}
