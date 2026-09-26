import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_STOREFRONT_CATALOG } from '@vritti/commerce-permissions/storefront-catalog';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, LegalEntityId, SiteId } from '@/security/decorators';
import { CatalogListing } from './graphql/shopper.type';
import { ShopperGatewayService } from './services/shopper-gateway.service';

/**
 * The range this storefront sells.
 *
 * Unlike the basket and wishlist next door, this needs no party — it is the shop's own catalogue,
 * not one person's rows. What it does need is the credential, because the catalogue is resolved
 * from the APP channel: a site can read the range it was given and no other.
 *
 * Read only. A storefront lists what staff put in front of it; pricing and listing are staff work
 * on the session-authenticated surface.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_STOREFRONT_CATALOG.featureCode)
export class CatalogAppResolver {
  private readonly logger = new Logger(CatalogAppResolver.name);

  constructor(private readonly service: ShopperGatewayService) {}

  /** Everything sellable, delisted rows and channel exclusions already dropped. */
  @Query(() => [CatalogListing], { name: 'catalogListings' })
  @RequirePermission(ORG_STOREFRONT_CATALOG.view)
  async catalogListings(
    @AppId() appId: string,
    // Optional: a single-outlet storefront sends no site and gets the organization-wide range and
    // its null-site prices. One with a store selector sends the chosen site, signed.
    @SiteId() siteId: string | undefined,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY catalogListings — site: ${siteId ?? 'org'}`);
    const rows = await this.service.listCatalogListings(appId, siteId, legalEntityId);
    // The wire shape flattens the per-site price list to the one a site actually shows.
    return rows.map((row) => ({
      id: row.id,
      offeringVariantId: row.offeringVariantId,
      sku: row.sku ?? null,
      name: row.variantName ?? null,
      price: row.prices[0]?.price ?? null,
    }));
  }
}
