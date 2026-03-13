import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@vritti/api-sdk';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class WebhookSecretGuard implements CanActivate {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.getOrThrow<string>('NEXUS_WEBHOOK_SECRET');
  }

  // Validates X-Webhook-Secret header against the configured secret
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const headerSecret = request.headers['x-webhook-secret'];

    if (!headerSecret || headerSecret !== this.secret) {
      throw new UnauthorizedException('Invalid or missing webhook secret.');
    }

    return true;
  }
}
