import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { AppTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { AppLegalEntity } from './graphql/app-legal-entity.type';
import { LegalEntityAppService } from './services/legal-entity-app.service';

/**
 * Where a storefront may sell from, for an app credential.
 *
 * **No feature or permission code, deliberately.** Those belong to the modules that front a
 * microservice — the commerce and payments gateways, whose features are authored in the cloud catalog.
 * This is core's own structure, and a core-api module carries no RBAC codes: the gate is the
 * credential. The guard verifies an Ed25519 signature, `AppRequestResolver` takes the organization
 * from the credential rather than from the caller, and RLS confines every read to it — so an app can
 * enumerate its own organization's structure and nothing else.
 *
 * An earlier revision borrowed `catalog-channels` for this, which made a core module depend on the
 * commerce permission lib for a feature it has no part in.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
export class LegalEntityAppResolver {
  private readonly logger = new Logger(LegalEntityAppResolver.name);

  constructor(private readonly legalEntityAppService: LegalEntityAppService) {}

  /**
   * The legal entities this credential's organization may sell as.
   *
   * Separate from `appSites`: a shop that sells at legal-entity level never asks about sites, and one
   * with a site switcher never asks about entities.
   *
   *
   * `currencyCode` is the reason this exists — it is the only place a currency is stated, so a
   * storefront resolves one from here rather than configuring its own.
   */
  @Query(() => [AppLegalEntity], { name: 'appLegalEntities' })
  appLegalEntities(@OrgId() orgId: string): Promise<AppLegalEntity[]> {
    this.logger.log('QUERY appLegalEntities');
    return this.legalEntityAppService.listForApp(orgId);
  }
}
