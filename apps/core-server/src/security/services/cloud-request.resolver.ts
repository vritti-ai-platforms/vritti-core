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

/**
 * Authenticates a signed request from the control plane and establishes its tenant.
 *
 * The counterpart to `AppRequestResolver`, called from the same `guard.onAuthenticated` hook
 * in `app.module.ts`. api-sdk owns the mechanism; this owns the key and the org.
 *
 * `x-org-id` is a **signed** input to `verifySignedRequest`, so the organization established
 * here is attested by cloud rather than merely asserted by whoever sent the request. Swapping
 * it in transit invalidates the signature.
 *
 * The header is optional. Some control-plane routes are genuinely not org-scoped — the catalog
 * license is deployment-wide, and the media sweep spans every tenant, where pinning one
 * organization would hide rows from it. Routes that DO need the org read it through `@OrgId()`,
 * which throws when it is absent, so the requirement is enforced where it is used rather than
 * guessed at here.
 */
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
