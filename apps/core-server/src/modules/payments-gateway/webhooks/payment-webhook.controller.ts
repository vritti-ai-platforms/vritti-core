import { Controller, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import type { FastifyRequest } from 'fastify';
import { type PaymentWebhookIngestResult, PaymentWebhookService } from './services/payment-webhook.service';

// Public by necessity: a provider authenticates with a signature over the raw body rather than a bearer, and
// payments-service checks it against the config's own secret. The path is unprefixed and stable because it is
// the literal URL an operator registers in the provider's dashboard, and it names the organization because a
// public call has nothing else to pick the row-level context the config is read under.
@ApiExcludeController()
@Controller('payments/webhooks')
@SkipCsrf()
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(private readonly service: PaymentWebhookService) {}

  // Accepts a provider event; a signature rejection surfaces as the 401 payments-service raised
  @Post(':orgId/:gatewayCode/:configId')
  @Require(AuthType.Public)
  @HttpCode(HttpStatus.OK)
  receive(
    @Req() request: FastifyRequest,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('gatewayCode') gatewayCode: string,
    @Param('configId', ParseUUIDPipe) configId: string,
  ): Promise<PaymentWebhookIngestResult> {
    this.logger.log(`POST /payments/webhooks/${orgId}/${gatewayCode}/${configId}`);
    return this.service.ingest(request, orgId, gatewayCode, configId);
  }
}
