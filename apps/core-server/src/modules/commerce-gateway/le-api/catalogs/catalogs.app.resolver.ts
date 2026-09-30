import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { LE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, LegalEntityId } from '@/security/decorators';
import { CatalogListing } from '../../org-api/catalogs/graphql/catalog-listing.type';
import { LeCatalogsGatewayService } from './services/catalogs-gateway.service';

/**
 * The range a legal entity's own website sells — the B2B storefront.
 *
 * The request carries `x-le-id`, so it is checked in LE scope and the LE's APP channel is preferred
 * over the organization's.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(LE_CATALOGS.featureCode)
export class LeCatalogsAppResolver {
  private readonly logger = new Logger(LeCatalogsAppResolver.name);

  constructor(private readonly service: LeCatalogsGatewayService) {}

  /** Everything this legal entity sells, delisted rows and channel exclusions already dropped. */
  @Query(() => [CatalogListing], { name: 'leCatalogListings' })
  @RequirePermission(LE_CATALOGS.listings.view)
  leCatalogListings(@AppId() appId: string, @LegalEntityId() legalEntityId: string): Promise<CatalogListing[]> {
    this.logger.log(`QUERY leCatalogListings — le: ${legalEntityId}`);
    return this.service.findStorefrontListings(appId, legalEntityId);
  }
}
