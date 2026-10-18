import { LegalEntityDomainModule } from '@domain/legal-entity/legal-entity.module';
import { SiteDomainModule } from '@domain/site/site.module';
import { Module } from '@nestjs/common';
import { LegalEntityAppResolver } from './legal-entities/legal-entity.app.resolver';
import { LegalEntityAppService } from './legal-entities/services/legal-entity-app.service';
import { SiteAppService } from './sites/services/site-app.service';
import { SiteAppResolver } from './sites/site.app.resolver';

// The external-app GraphQL surface for org structure: where a storefront may sell from.
@Module({
  imports: [LegalEntityDomainModule, SiteDomainModule],
  providers: [SiteAppService, SiteAppResolver, LegalEntityAppService, LegalEntityAppResolver],
})
export class StructureAppGatewayModule {}
