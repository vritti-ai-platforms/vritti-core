import { Module } from '@nestjs/common';
import { BusinessUnitDomainModule } from '../business-unit/business-unit.module';
import { OrgRoleRepository } from './repositories/org-role.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { OrgRoleService } from './services/org-role.service';
import { OrganizationService } from './services/organization.service';

@Module({
  imports: [BusinessUnitDomainModule],
  providers: [OrganizationService, OrganizationRepository, OrgRoleService, OrgRoleRepository],
  exports: [OrganizationService, OrganizationRepository, OrgRoleService, OrgRoleRepository],
})
export class OrganizationDomainModule {}
