import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { AppLegalEntity } from './graphql/app-legal-entity.type';
import { LegalEntityAppService } from './services/legal-entity-app.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
export class LegalEntityAppResolver {
  private readonly logger = new Logger(LegalEntityAppResolver.name);

  constructor(private readonly legalEntityAppService: LegalEntityAppService) {}

  /**
   * The legal entities this credential's organization may sell as.
   *
   * Separate from `appSites` and separately permissioned: a shop that sells at entity level never
   * asks about stores, and one with a store switcher never asks about entities.
   *
   * `currencyCode` is the reason this exists — it is the only place a currency is stated, so a
   * storefront resolves one from here rather than configuring its own.
   */
  @Query(() => [AppLegalEntity], { name: 'appLegalEntities' })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.legalEntities)
  appLegalEntities(@OrgId() orgId: string): Promise<AppLegalEntity[]> {
    this.logger.log('QUERY appLegalEntities');
    return this.legalEntityAppService.listForApp(orgId);
  }
}
