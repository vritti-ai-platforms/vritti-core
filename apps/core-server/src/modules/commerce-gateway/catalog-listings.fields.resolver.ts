import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { AppTypeValues } from '@/db/schema';
import { LeCatalogChannelsGatewayService } from './le-api/catalog-channels/services/catalog-channels-gateway.service';
import { CatalogListings, type ListingFilter } from './org-api/catalog-channels/graphql/catalog-listings.type';
import { CatalogChannelsGatewayService } from './org-api/catalog-channels/services/catalog-channels-gateway.service';
import { SiteCatalogChannelsGatewayService } from './site-api/catalog-channels/services/catalog-channels-gateway.service';

// `filters` hangs off CatalogListings rather than riding in its payload, so a caller that only wants prices never pays
// for the facet aggregates.
@Resolver(() => CatalogListings)
@Require(AuthType.App, AppTypeValues.GRAPHQL)
export class CatalogListingsFieldsResolver {
  constructor(
    private readonly org: CatalogChannelsGatewayService,
    private readonly le: LeCatalogChannelsGatewayService,
    private readonly site: SiteCatalogChannelsGatewayService,
  ) {}

  @ResolveField('filters')
  filters(@Parent() parent: CatalogListings): Promise<ListingFilter[]> {
    const service = parent.scope === 'site' ? this.site : parent.scope === 'le' ? this.le : this.org;
    return service.appListingFilters(parent.appId, parent.selected);
  }
}
