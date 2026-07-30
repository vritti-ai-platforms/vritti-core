import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { verifySignedRequest } from '@vritti/api-sdk/signing';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class CloudSignatureGuard implements CanActivate {
  private readonly publicKey: string;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.getOrThrow<string>('LICENSE_PUBLIC_KEY');
  }

  // Verifies the request's Ed25519 signature (x-timestamp + x-signature) against the cloud public key
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const timestamp = request.headers['x-timestamp'];
    const signature = request.headers['x-signature'];
    const orgIdHeader = request.headers['x-org-id'];

    if (typeof timestamp !== 'string' || typeof signature !== 'string') {
      throw new UnauthorizedException('Missing request signature headers.');
    }

    const valid = verifySignedRequest({
      method: request.method,
      path: request.url.split('?')[0],
      orgId: Array.isArray(orgIdHeader) ? orgIdHeader[0] : orgIdHeader,
      rawBody: request.rawBody,
      timestamp,
      signature,
      publicKey: this.publicKey,
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid or expired request signature.');
    }

    return true;
  }
}
