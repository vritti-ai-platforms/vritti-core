import { Injectable, Logger } from '@nestjs/common';
import {
  CLIENT_ID_HEADER,
  MAX_CLOCK_SKEW_SECONDS,
  type OnAuthenticatedCallback,
  PARTY_ID_HEADER,
  WORKSPACE_HEADER_ORDER,
} from '@vritti/api-sdk/auth';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { verifySignedRequest } from '@vritti/api-sdk/signing';
import type { FastifyRequest } from 'fastify';
import { AppDomainService } from '@/modules/domain/app/services/app.service';

/**
 * The request accessor the auth hook is handed.
 *
 * Derived from the callback's own signature rather than imported: `RequestService`
 * is not part of api-sdk's named public surface, and taking the type from the
 * contract this service is called through means it cannot drift from it.
 */
type AuthRequestService = Parameters<OnAuthenticatedCallback>[0];

const header = (requestService: AuthRequestService, name: string): string | undefined => {
  const value = requestService.getHeader(name);
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Authenticates a signed request from an external app and establishes its tenant.
 *
 * Called from `guard.onAuthenticated` in `app.module.ts`, which is where
 * `VrittiAuthGuard` hands off an `@RequireApp()` request. The guard cannot do this
 * itself: verifying a signature needs the app's public key, and that is a row in
 * this deployment's `apps` table. api-sdk owns the mechanism, this owns the lookup.
 *
 * A service rather than an inline closure so the security properties below are
 * testable — see `app-request.resolver.spec.ts`.
 *
 * Every rejection raises the **same** error. An unknown client, a revoked one, a
 * suspended one, a bad signature and a stale timestamp must be indistinguishable,
 * or the endpoint becomes an oracle for which client ids exist. The app-type filter
 * is applied by the guard afterwards and raises the identical error for the same
 * reason.
 */
@Injectable()
export class AppRequestResolver {
  private readonly logger = new Logger(AppRequestResolver.name);

  constructor(private readonly appService: AppDomainService) {}

  /** True when this request presents an app credential rather than a session. */
  isAppRequest(requestService: AuthRequestService): boolean {
    return Boolean(header(requestService, CLIENT_ID_HEADER));
  }

  async resolve(
    requestService: AuthRequestService,
    sessionInfo: NonNullable<FastifyRequest['sessionInfo']>,
  ): Promise<void> {
    const clientId = header(requestService, CLIENT_ID_HEADER);
    const timestamp = header(requestService, 'x-timestamp');
    const signature = header(requestService, 'x-signature');
    const partyId = header(requestService, PARTY_ID_HEADER);

    // Collected before verification because they are part of what was signed. The
    // header NAME carries the scope, so re-pointing a request from a site to a legal
    // entity cannot survive even with the same id.
    const workspaceHeaders: Record<string, string | undefined> = {};
    for (const name of WORKSPACE_HEADER_ORDER) {
      const value = header(requestService, name);
      if (value) workspaceHeaders[name] = value;
    }

    if (!clientId || !timestamp || !signature) throw rejected();

    const app = await this.appService.findByClientId(clientId);

    if (!app || !app.isActive || app.revokedAt) {
      this.logger.warn(`Rejected app request for client ${clientId}`);
      throw rejected();
    }

    const valid = verifySignedRequest({
      method: requestService.getMethod(),
      path: requestService.getPath(),
      // Signed separately from the path, which strips it. A REST route's filters
      // would otherwise ride outside the signature.
      query: requestService.getQuery(),
      partyId,
      workspaceHeaders,
      rawBody: requestService.getRawBody(),
      timestamp,
      signature,
      publicKey: app.signingPublicKey,
      maxSkewSeconds: MAX_CLOCK_SKEW_SECONDS,
    });

    if (!valid) {
      this.logger.warn(`Invalid signature for app ${clientId}`);
      throw rejected();
    }

    sessionInfo.organizationId = app.organizationId;
    sessionInfo.appType = app.type;

    // The shopper the app is acting for, when it named one. Signed, so it cannot be
    // swapped in transit. The workspace headers are left to `applyContextHeaders`,
    // which both callers share.
    if (partyId) sessionInfo.partyId = partyId;

    // No user is behind a server-to-server call, but both fields are required and
    // are what downstream reads as the acting principal. The app id stands in, so
    // NATS headers and anything that records who acted name the app.
    sessionInfo.userId = app.id;
    sessionInfo.sessionId = app.id;

    // Required by the type, and deliberately empty: nothing on the app path reads it.
    // `@OrgSubdomain()` is used only by the gitea gateway's session endpoints. Filling
    // it would mean an organization lookup on every signed request to serve a field
    // no app endpoint consumes — an app endpoint that ever needs it should fetch the
    // organization itself rather than making every other request pay for it.
    sessionInfo.subdomain = '';

    // Bookkeeping only — never allowed to fail a request that was otherwise valid.
    // The service already swallows its own async rejection; this guards a synchronous
    // throw, so the claim above holds however it fails.
    try {
      this.appService.touchLastUsed(app.id);
    } catch (error) {
      this.logger.warn({ err: error }, `Could not stamp last-used for app ${clientId}`);
    }

    this.logger.debug(`App ${clientId} (${app.type}) authenticated for org ${app.organizationId}`);
  }
}

function rejected(): UnauthorizedException {
  return new UnauthorizedException({
    label: 'Unknown Client',
    detail: 'This client is not recognised.',
  });
}
