import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Logger, Post, Query, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import type { FastifyRequest } from 'fastify';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';

/**
 * Delivery receipts from Meta for the sign-in codes this deployment sent.
 *
 * Public by necessity — Meta authenticates with an HMAC of the raw body rather than a bearer, so
 * the signature check inside the service IS the authentication. The path is unprefixed and stable
 * because it is registered in the Meta app dashboard (or as a per-WABA override_callback_uri).
 */
@ApiExcludeController()
@Controller('communications/webhooks')
@SkipCsrf()
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly service: WhatsappWebhookService) {}

  // Answers the subscription handshake Meta fires when the callback URL is saved
  @Get('whatsapp')
  @Require(AuthType.Public)
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    this.logger.log('GET /communications/webhooks/whatsapp');
    return this.service.verifyChallenge(mode, token, challenge);
  }

  // Accepts delivery status callbacks. Always 200 once the signature checks out — Meta retries any
  // non-2xx, and a retry cannot fix a payload we simply had nothing to do with.
  @Post('whatsapp')
  @Require(AuthType.Public)
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: FastifyRequest,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: unknown,
  ): Promise<{ status: string }> {
    this.logger.log('POST /communications/webhooks/whatsapp');
    await this.service.handle(request, signature, payload);
    return { status: 'ok' };
  }
}
