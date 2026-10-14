import { LegalEntityDomainModule } from '@domain/legal-entity/legal-entity.module';
import { SiteDomainModule } from '@domain/site/site.module';
import { Module } from '@nestjs/common';
import { LegalEntityAppResolver } from './legal-entities/legal-entity.app.resolver';
import { LegalEntityAppService } from './legal-entities/services/legal-entity-app.service';
import { SiteAppService } from './sites/services/site-app.service';
import { SiteAppResolver } from './sites/site.app.resolver';

// The external-app GraphQL surface for org structure: where a storefront may sell from.
//
// Its own module rather than resolvers added to StructureApiModule, because `include` walks imports
// transitively — importing the internal surface would put every internal controller's types into the
// public app schema. The resolvers themselves stay in their feature folders beside that surface's
// controllers; only module membership differs.
@Module({
  imports: [LegalEntityDomainModule, SiteDomainModule],
  providers: [SiteAppService, SiteAppResolver, LegalEntityAppService, LegalEntityAppResolver],
})
export class StructureAppGatewayModule {}
