import { LegalEntityDomainModule } from '@domain/legal-entity/legal-entity.module';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { SiteDomainModule } from '@domain/site/site.module';
import { SiteGroupDomainModule } from '@domain/site-group/site-group.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { LegalEntityService } from './legal-entities/services/legal-entity-api.service';
import { StructureService } from './root/services/structure-api.service';
import { SiteGroupService } from './site-groups/services/site-group-api.service';
import { SiteService } from './sites/services/site-api.service';

const services = [StructureService, LegalEntityService, SiteService, SiteGroupService];

/**
 * Structure services, and nothing else.
 *
 * Same reason as `CommerceGatewayServicesModule`: both the internal surface (`StructureApiModule`,
 * which owns the controllers) needs these,
 * and neither may import the other without dragging its resolvers into the other's schema.
 */
@Module({
  imports: [
    LegalEntityDomainModule,
    SiteDomainModule,
    SiteGroupDomainModule,
    OrganizationDomainModule,
    UserRoleDomainModule,
  ],
  providers: services,
  exports: services,
})
export class StructureServicesModule {}
