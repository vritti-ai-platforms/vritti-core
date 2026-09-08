import { Controller, Get, Logger, Query, Redirect, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import type { FastifyRequest } from 'fastify';
import {
  EmbeddedSignupBrokerService,
  type EmbeddedSignupCallbackQuery,
} from './services/embedded-signup-broker.service';

// Nest requires a literal on @Redirect; every route here computes its own target and overrides both
const REDIRECT_STATUS = 302;

/**
 * The single fixed origin that runs WhatsApp Embedded Signup.
 *
 * `organizations.subdomain` gains an entry with every signup and Meta rejects wildcards in its
 * redirect-URI list, so the flow cannot be run from a tenant console. Both routes here are served
 * from one hostname — `api.<BASE_DOMAIN>` — registered with Meta once.
 *
 * Public by necessity, exactly like the delivery webhook: the origin is not a tenant subdomain and
 * holds no session, so the signed state is the authentication. Unprefixed, because these are
 * browser-facing navigation targets rather than part of the `communications-api` surface.
 *
 * Neither route renders anything. Both are pure redirects — into Meta on the way in, back to the
 * console on the way out — so the operator sees their own console and Meta's screens, nothing else.
 */
@ApiExcludeController()
@Controller('communications/whatsapp')
@SkipCsrf()
export class WhatsappEmbeddedSignupBrokerController {
  private readonly logger = new Logger(WhatsappEmbeddedSignupBrokerController.name);

  constructor(private readonly service: EmbeddedSignupBrokerService) {}

  /**
   * Sends the operator into Meta's dialog.
   *
   * A same-tab redirect rather than an SDK popup: it needs no user gesture, so there is no extra
   * click and no second window, and it keeps the Facebook SDK — and therefore Meta's "Allowed
   * Domains for the JavaScript SDK" list — out of the flow entirely.
   */
  @Get('connect')
  @Require(AuthType.Public)
  @Redirect('', REDIRECT_STATUS)
  start(@Query('state') state?: string): { url: string; statusCode: number } {
    this.logger.log('GET /communications/whatsapp/connect');
    return { url: this.service.resolveDialogUrl(state), statusCode: REDIRECT_STATUS };
  }

  /**
   * Where Meta returns the operator, carrying the authorization code.
   *
   * A GET that writes, which is what an OAuth callback is. The connect runs to completion here,
   * server-side, and then the operator is redirected to their console with the outcome on the URL.
   */
  @Get('connect/callback')
  @Require(AuthType.Public)
  @Redirect('', REDIRECT_STATUS)
  async callback(
    @Req() request: FastifyRequest,
    @Query() query: EmbeddedSignupCallbackQuery,
  ): Promise<{ url: string; statusCode: number }> {
    this.logger.log('GET /communications/whatsapp/connect/callback');
    return { url: await this.service.handleCallback(request, query), statusCode: REDIRECT_STATUS };
  }
}
