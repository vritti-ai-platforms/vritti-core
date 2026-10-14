import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { type CheckoutCallbackOutcome, CheckoutCallbackService } from './services/checkout-callback.service';

// Core's hosted end of an embedded gateway checkout. Public by necessity: the gateway's page posts the shopper's
// browser here as a top-level form submission, with no bearer and no CSRF token. The path names the organization
// because a public call has nothing else to pick the row-level context the intent is read under. Every answer is a
// 303 to a storefront page whose origin the intent's app allows, or a static page — never an open redirect, never a 500
@ApiExcludeController()
@Controller('payments/checkout')
@SkipCsrf()
export class CheckoutCallbackController {
  private readonly logger = new Logger(CheckoutCallbackController.name);

  constructor(private readonly service: CheckoutCallbackService) {}

  // The gateway's form post with the payment's result
  @Post(':orgId/:paymentIntentId/callback')
  @Require(AuthType.Public)
  async callback(
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('paymentIntentId', ParseUUIDPipe) paymentIntentId: string,
    @Body() body: unknown,
  ): Promise<void> {
    this.logger.log(`POST /payments/checkout/${orgId}/${paymentIntentId}/callback`);
    send(reply, await this.service.handleCallback(request, orgId, paymentIntentId, body));
  }

  // A browser revisiting the callback by GET
  @Get(':orgId/:paymentIntentId/callback')
  @Require(AuthType.Public)
  async revisit(
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('paymentIntentId', ParseUUIDPipe) paymentIntentId: string,
  ): Promise<void> {
    this.logger.log(`GET /payments/checkout/${orgId}/${paymentIntentId}/callback`);
    send(reply, await this.service.handleRevisit(request, orgId, paymentIntentId));
  }

  // The gateway's cancel url, when the shopper abandons its checkout
  @Get(':orgId/:paymentIntentId/cancel')
  @Require(AuthType.Public)
  async cancel(
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('paymentIntentId', ParseUUIDPipe) paymentIntentId: string,
  ): Promise<void> {
    this.logger.log(`GET /payments/checkout/${orgId}/${paymentIntentId}/cancel`);
    send(reply, await this.service.handleCancel(request, orgId, paymentIntentId));
  }
}

// Writes the outcome: a 303 See Other so the browser follows a form post with a GET, or the static page
function send(reply: FastifyReply, outcome: CheckoutCallbackOutcome): void {
  reply.header('Cache-Control', 'no-store').header('Referrer-Policy', 'no-referrer');
  if (outcome.kind === 'redirect') {
    reply.code(303).header('Location', outcome.location).send();
    return;
  }
  reply.code(200).header('Content-Type', 'text/html; charset=utf-8').send(outcome.html);
}
