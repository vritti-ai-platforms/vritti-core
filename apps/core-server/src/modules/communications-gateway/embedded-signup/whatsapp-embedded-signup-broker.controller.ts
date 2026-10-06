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

@ApiExcludeController()
@Controller('communications/whatsapp')
@SkipCsrf()
export class WhatsappEmbeddedSignupBrokerController {
  private readonly logger = new Logger(WhatsappEmbeddedSignupBrokerController.name);

  constructor(private readonly service: EmbeddedSignupBrokerService) {}

  // Sends the operator into Meta's dialog
  @Get('connect')
  @Require(AuthType.Public)
  @Redirect('', REDIRECT_STATUS)
  start(@Query('state') state?: string): { url: string; statusCode: number } {
    this.logger.log('GET /communications/whatsapp/connect');
    return { url: this.service.resolveDialogUrl(state), statusCode: REDIRECT_STATUS };
  }

  // Where Meta returns the operator, carrying the authorization code
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
