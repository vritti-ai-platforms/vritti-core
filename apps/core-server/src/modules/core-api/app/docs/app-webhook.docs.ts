import { AppWebhookEndpointDto } from '@domain/app-webhook/dto/entity/app-webhook-endpoint.dto';
import { UpsertAppWebhookEndpointInternalDto } from '@domain/app-webhook/dto/request/upsert-app-webhook-endpoint-internal.dto';
import { WebhookDeliveriesPageResponseDto } from '@domain/app-webhook/dto/response/webhook-deliveries-page-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { WebhookDeliveryRefResponseDto } from '../dto/response/webhook-delivery-ref-response.dto';
import { WebhookPublicKeyResponseDto } from '../dto/response/webhook-public-key-response.dto';

const APP_ID = ApiParam({ name: 'appId', description: 'App ID' });

const SIGNATURE_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
  ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
];

const UNAUTHORIZED = ApiResponse({ status: 401, description: 'Invalid or missing request signature.' });
const APP_NOT_FOUND = ApiResponse({ status: 404, description: 'App not found in this organization.' });

export function ApiGetAppWebhookEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the app webhook endpoint',
      description: 'Returns the endpoint payment events are delivered to, or null when the app has none.',
    }),
    APP_ID,
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Endpoint retrieved successfully.', type: AppWebhookEndpointDto }),
    UNAUTHORIZED,
    APP_NOT_FOUND,
  );
}

export function ApiUpsertAppWebhookEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register or replace the app webhook endpoint',
      description: 'One endpoint per app. The URL must be a public https address.',
    }),
    APP_ID,
    ...SIGNATURE_HEADERS,
    ApiBody({ type: UpsertAppWebhookEndpointInternalDto }),
    ApiResponse({ status: 200, description: 'Endpoint saved successfully.', type: AppWebhookEndpointDto }),
    ApiResponse({ status: 400, description: 'Invalid URL or event list.' }),
    UNAUTHORIZED,
    APP_NOT_FOUND,
  );
}

export function ApiDeleteAppWebhookEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete the app webhook endpoint',
      description: 'Removes the endpoint together with its delivery history.',
    }),
    APP_ID,
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Endpoint deleted successfully.', type: SuccessResponseDto }),
    UNAUTHORIZED,
    ApiResponse({ status: 404, description: 'App or endpoint not found.' }),
  );
}

export function ApiSendAppWebhookTest() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send a test webhook',
      description: 'Queues a webhook.test event to the endpoint regardless of its event subscription.',
    }),
    APP_ID,
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Test event queued.', type: WebhookDeliveryRefResponseDto }),
    UNAUTHORIZED,
    ApiResponse({ status: 404, description: 'App or endpoint not found.' }),
  );
}

export function ApiFindForTableWebhookDeliveries() {
  return applyDecorators(
    ApiOperation({
      summary: 'Webhook deliveries table',
      description:
        "Resolves one page of the app's deliveries from a serialized view state (filters, search, sort, pagination) that cloud holds. Payloads are never included.",
    }),
    APP_ID,
    ...SIGNATURE_HEADERS,
    ApiResponse({
      status: 200,
      description: 'Deliveries page retrieved successfully.',
      type: WebhookDeliveriesPageResponseDto,
    }),
    UNAUTHORIZED,
    APP_NOT_FOUND,
  );
}

export function ApiRedeliverWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Redeliver a webhook',
      description: 'Puts a delivery back in the queue for an immediate attempt with a fresh retry budget.',
    }),
    APP_ID,
    ApiParam({ name: 'deliveryId', description: 'Webhook delivery ID' }),
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Delivery requeued.', type: WebhookDeliveryRefResponseDto }),
    UNAUTHORIZED,
    ApiResponse({ status: 404, description: 'App or delivery not found.' }),
    ApiResponse({ status: 409, description: 'The delivery is being sent or is waiting on its next retry.' }),
  );
}

export function ApiGetWebhookPublicKey() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the webhook verification key',
      description: 'The Ed25519 public key (base64 spki DER) that verifies x-vap-signature on deliveries.',
    }),
    APP_ID,
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Public key retrieved successfully.', type: WebhookPublicKeyResponseDto }),
    UNAUTHORIZED,
    APP_NOT_FOUND,
  );
}
