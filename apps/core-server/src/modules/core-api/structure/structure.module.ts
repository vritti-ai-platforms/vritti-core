import { LegalEntityDomainModule } from '@domain/legal-entity/legal-entity.module';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { SiteDomainModule } from '@domain/site/site.module';
import { SiteGroupDomainModule } from '@domain/site-group/site-group.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { LegalEntityController } from './legal-entities/legal-entity.controller';
import { LegalEntityApiService } from './legal-entities/services/legal-entity-api.service';
import { StructureApiService } from './root/services/structure-api.service';
import { StructureController } from './root/structure.controller';
import { SiteGroupApiService } from './site-groups/services/site-group-api.service';
import { SiteGroupController } from './site-groups/site-group.controller';
import { SiteApiService } from './sites/services/site-api.service';
import { SiteController } from './sites/site.controller';

@Module({
  imports: [
    LegalEntityDomainModule,
    SiteDomainModule,
    SiteGroupDomainModule,
    OrganizationDomainModule,
    UserRoleDomainModule,
  ],
  controllers: [StructureController, LegalEntityController, SiteController, SiteGroupController],
  providers: [StructureApiService, LegalEntityApiService, SiteApiService, SiteGroupApiService],
})
export class StructureApiModule {}
