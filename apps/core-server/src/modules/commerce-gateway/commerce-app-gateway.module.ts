import { Module } from '@nestjs/common';
import { CommerceGatewayServicesModule } from './commerce-gateway-services.module';
import { LeCatalogChannelsAppResolver } from './le-api/catalog-channels/catalog-channels.app.resolver';
import { CatalogChannelsAppResolver } from './org-api/catalog-channels/catalog-channels.app.resolver';
import { PeopleAppResolver } from './org-api/people/people.app.resolver';
import { CartsAppResolver } from './site-api/carts/carts.app.resolver';
import { SiteCatalogChannelsAppResolver } from './site-api/catalog-channels/catalog-channels.app.resolver';

/**
 * The external-app GraphQL surface for commerce.
 *
 * One of the two gateway surface modules, and what `GraphQLModule`'s `include` scopes the
 * storefront schema to. `include` walks imports **transitively**, so this module's entire closure
 * has to be free of the internal surface's resolvers — which is why it imports
 * `CommerceGatewayServicesModule` (services only) and never `CommerceGatewayModule`.
 *
 * Resolver files stay in their feature folder under `org-api/`, `le-api/`, `site-api/`; only module membership lives
 * here. Each resolver must be declared in EXACTLY ONE surface module — declaring it in both puts
 * the operation in both schemas, silently.
 */
@Module({
  imports: [CommerceGatewayServicesModule],
  providers: [
    PeopleAppResolver,
    CartsAppResolver,
    CatalogChannelsAppResolver,
    LeCatalogChannelsAppResolver,
    SiteCatalogChannelsAppResolver,
  ],
})
export class CommerceAppGatewayModule {}
