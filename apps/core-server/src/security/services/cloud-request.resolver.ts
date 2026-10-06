import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OnAuthenticatedCallback } from '@vritti/api-sdk/auth';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { verifySignedRequest } from '@vritti/api-sdk/signing';
import type { VrittiCloudAuth } from 'fastify';

type AuthRequestService = Parameters<OnAuthenticatedCallback>[0];

const header = (requestService: AuthRequestService, name: string): string | undefined => {
  const value = requestService.getHeader(name);
  return Array.isArray(value) ? value[0] : value;
};

@Injectable()
export class CloudRequestResolver {
  private readonly logger = new Logger(CloudRequestResolver.name);
  private readonly publicKey: string;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.getOrThrow<string>('LICENSE_PUBLIC_KEY');
  }

  // Verifies the cloud signature over method, path, org scope and body, then records the org
  resolve(requestService: AuthRequestService, auth: VrittiCloudAuth): void {
    const timestamp = header(requestService, 'x-timestamp');
    const signature = header(requestService, 'x-signature');
    const orgId = header(requestService, 'x-org-id');

    if (!timestamp || !signature) {
      throw new UnauthorizedException('Missing request signature headers.');
    }

    const valid = verifySignedRequest({
      method: requestService.getMethod(),
      path: requestService.getPath(),
      orgId,
      rawBody: requestService.getRawBody(),
      timestamp,
      signature,
      publicKey: this.publicKey,
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid or expired request signature.');
    }

    if (orgId) auth.organizationId = orgId;

    this.logger.debug(`Cloud request authenticated${orgId ? ` for org ${orgId}` : ' (no org scope)'}`);
  }
}
