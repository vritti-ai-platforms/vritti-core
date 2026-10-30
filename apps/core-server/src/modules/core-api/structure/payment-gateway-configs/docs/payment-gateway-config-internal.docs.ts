import { PaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/entity/payment-gateway-config.dto';
import { CreatePaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-payment-gateway-config.dto';
import { CreatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/create-platform-payment-gateway-config.dto';
import { UpdatePlatformPaymentGatewayConfigDto } from '@domain/payment-gateway-config/dto/request/update-platform-payment-gateway-config.dto';
import { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import { PaymentGatewayConfigsPageResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-configs-page-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PaymentGatewayOptionDto } from '@/modules/payments-gateway/gateways/dto/response/payment-gateway-option.dto';
import {
  WebhookCheckStartedResponseDto,
  WebhookCheckStatusResponseDto,
} from '../dto/response/webhook-check-response.dto';

const ID = ApiParam({ name: 'id', description: 'Payment gateway config ID' });

const SIGNATURE_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
];
const ORG_HEADERS = [
  ...SIGNATURE_HEADERS,
  ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
];

const UNAUTHORIZED = ApiResponse({ status: 401, description: 'Invalid or missing request signature.' });
const NOT_FOUND = ApiResponse({ status: 404, description: 'Payment gateway config not found.' });
const MANAGED = ApiResponse({ status: 403, description: "Vritti's gateways cannot be changed from here." });
const IN_USE = ApiResponse({ status: 409, description: 'Payout accounts pay out through this gateway.' });

const PLATFORM_NOTE =
  "Vritti's own gateways on this deployment — rows with no organization, visible to every organization and managed only by cloud admin. Called with the deployment signing key and no x-org-id header.";

export function ApiListPaymentGatewayConfigsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: "List the organization's payment gateway configs",
      description:
        "The organization's own gateways (ORG) followed by Vritti's (PLATFORM) with the key id withheld. Secrets are never included.",
    }),
    ...ORG_HEADERS,
    ApiResponse({
      status: 200,
      description: 'Payment gateway configs retrieved successfully.',
      type: [PaymentGatewayConfigDto],
    }),
    UNAUTHORIZED,
  );
}

export function ApiFindForTablePaymentGatewayConfigsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Payment gateway configs table',
      description:
        "Resolves one page of the organization's own gateways (ORG) and Vritti's (PLATFORM, key id withheld) from a serialized view state (filters, search, sort, pagination) that cloud holds. Secrets are never included.",
    }),
    ...ORG_HEADERS,
    ApiResponse({
      status: 200,
      description: 'Payment gateway configs page retrieved.',
      type: PaymentGatewayConfigsPageResponseDto,
    }),
    UNAUTHORIZED,
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
    UNAUTHORIZED,
  );
}

export function ApiCreatePaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: "Connect one of the organization's own payment gateways",
      description:
        "Credentials are validated against the gateway field list, encrypted at rest and never returned. An organization has one gateway of each code; Vritti's may share a code with it.",
    }),
    ...ORG_HEADERS,
    ApiBody({ type: CreatePaymentGatewayConfigDto }),
    ApiResponse({ status: 201, description: 'Payment gateway config created successfully.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input, unsupported gateway or incomplete credentials.' }),
    UNAUTHORIZED,
    ApiResponse({ status: 409, description: 'The organization already has a gateway of this code.' }),
  );
}

export function ApiGetPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get payment gateway config',
      description: 'Returns a single payment gateway config by ID, without its secrets.',
    }),
    ...ORG_HEADERS,
    ID,
    ApiResponse({
      status: 200,
      description: 'Payment gateway config retrieved successfully.',
      type: PaymentGatewayConfigDto,
    }),
    UNAUTHORIZED,
    NOT_FOUND,
  );
}

export function ApiVerifyPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify payment gateway config',
      description:
        'Has the provider check the stored credentials. A pass records verifiedAt and the merchant id the provider reports; a rejection names the credential field at fault.',
    }),
    ...ORG_HEADERS,
    ID,
    ApiResponse({
      status: 200,
      description: 'Payment gateway config verified successfully.',
      type: PaymentGatewayConfigVerificationResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'The provider rejected the credentials, or the gateway is not supported.',
    }),
    UNAUTHORIZED,
    MANAGED,
    NOT_FOUND,
  );
}

export function ApiDeletePaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete payment gateway config',
      description: "Removes one of the organization's own gateways, unless payout accounts still depend on it.",
    }),
    ...ORG_HEADERS,
    ID,
    ApiResponse({ status: 200, description: 'Payment gateway config deleted successfully.', type: SuccessResponseDto }),
    UNAUTHORIZED,
    MANAGED,
    NOT_FOUND,
    IN_USE,
  );
}

export function ApiListPlatformPaymentGatewayConfigsInternal() {
  return applyDecorators(
    ApiOperation({ summary: 'List the platform payment gateways', description: PLATFORM_NOTE }),
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Platform gateways retrieved.', type: [PaymentGatewayConfigDto] }),
    UNAUTHORIZED,
  );
}

export function ApiFindForTablePlatformPaymentGatewayConfigsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Platform payment gateways table',
      description: `${PLATFORM_NOTE} Resolves one page from a serialized view state that cloud holds.`,
    }),
    ...SIGNATURE_HEADERS,
    ApiResponse({
      status: 200,
      description: 'Platform gateways page retrieved.',
      type: PaymentGatewayConfigsPageResponseDto,
    }),
    UNAUTHORIZED,
  );
}

export function ApiCreatePlatformPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set up a platform payment gateway',
      description: PLATFORM_NOTE,
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: CreatePlatformPaymentGatewayConfigDto }),
    ApiResponse({ status: 201, description: 'Platform gateway set up successfully.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input, unsupported gateway or incomplete credentials.' }),
    UNAUTHORIZED,
    ApiResponse({ status: 409, description: 'This deployment already has a platform gateway of this code.' }),
  );
}

export function ApiUpdatePlatformPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a platform payment gateway',
      description: `${PLATFORM_NOTE} Credentials and fee; the gateway itself cannot change once set up.`,
    }),
    ...SIGNATURE_HEADERS,
    ID,
    ApiBody({ type: UpdatePlatformPaymentGatewayConfigDto }),
    ApiResponse({ status: 200, description: 'Platform gateway updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input or incomplete credentials.' }),
    UNAUTHORIZED,
    NOT_FOUND,
    ApiResponse({ status: 409, description: 'The gateway cannot change once set up.' }),
  );
}

export function ApiVerifyPlatformPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({ summary: 'Verify a platform payment gateway', description: PLATFORM_NOTE }),
    ...SIGNATURE_HEADERS,
    ID,
    ApiResponse({
      status: 200,
      description: 'Platform gateway verified successfully.',
      type: PaymentGatewayConfigVerificationResponseDto,
    }),
    ApiResponse({ status: 400, description: 'The provider rejected the credentials.' }),
    UNAUTHORIZED,
    NOT_FOUND,
  );
}

export function ApiDeletePlatformPaymentGatewayConfigInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a platform payment gateway',
      description: `${PLATFORM_NOTE} Refused while any organization's payout accounts reference it.`,
    }),
    ...SIGNATURE_HEADERS,
    ID,
    ApiResponse({ status: 200, description: 'Platform gateway removed successfully.', type: SuccessResponseDto }),
    UNAUTHORIZED,
    NOT_FOUND,
    IN_USE,
  );
}

export function ApiStartWebhookCheckInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Start the webhook check',
      description:
        "Opens a ₹10 verification payment on an own gateway that signs webhooks with its own secret, for the gateway's embedded checkout in a new tab. Core's hosted callback settles it, which refunds it; its signed webhook proves the URL and secret registered in the gateway dashboard and makes the config ACTIVE.",
    }),
    ...ORG_HEADERS,
    ID,
    ApiResponse({ status: 201, description: 'Verification payment opened.', type: WebhookCheckStartedResponseDto }),
    ApiResponse({ status: 400, description: 'The gateway needs no webhook check, or its keys are not verified.' }),
    ApiResponse({ status: 409, description: 'The webhook is already verified.' }),
  );
}

export function ApiGetWebhookCheckInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a webhook check payment',
      description: "Where one of this config's verification payments stands, for the dialog waiting on its outcome.",
    }),
    ...ORG_HEADERS,
    ID,
    ApiParam({ name: 'paymentIntentId', type: String, description: 'The verification payment' }),
    ApiResponse({ status: 200, description: 'Verification payment status.', type: WebhookCheckStatusResponseDto }),
    ApiResponse({ status: 400, description: "Not this config's verification payment." }),
  );
}
