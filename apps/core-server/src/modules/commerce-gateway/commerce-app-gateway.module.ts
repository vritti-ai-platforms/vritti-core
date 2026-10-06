import { Module } from '@nestjs/common';
import { CatalogListingsFieldsResolver } from './catalog-listings.fields.resolver';
import { CommerceGatewayServicesModule } from './commerce-gateway-services.module';
import { LeCatalogChannelsAppResolver } from './le-api/catalog-channels/catalog-channels.app.resolver';
import { CatalogChannelsAppResolver } from './org-api/catalog-channels/catalog-channels.app.resolver';
import { PeopleAppResolver } from './org-api/people/people.app.resolver';
import { CartsAppResolver } from './site-api/carts/carts.app.resolver';
import { SiteCatalogChannelsAppResolver } from './site-api/catalog-channels/catalog-channels.app.resolver';
import { SiteOfferingsAppResolver } from './site-api/offerings/offerings.app.resolver';

// The external-app GraphQL surface for commerce
@Module({
  imports: [CommerceGatewayServicesModule],
  providers: [
    PeopleAppResolver,
    CartsAppResolver,
    CatalogChannelsAppResolver,
    LeCatalogChannelsAppResolver,
    SiteCatalogChannelsAppResolver,
    CatalogListingsFieldsResolver,
    SiteOfferingsAppResolver,
  ],
})
export class CommerceAppGatewayModule {}
