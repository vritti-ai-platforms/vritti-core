import { Module } from '@nestjs/common';
import { BusinessUnitModule } from '../business-unit/business-unit.module';
import { OrgRolesController } from './controllers/org-roles.controller';
import { OrganizationController } from './controllers/organization.controller';
import { OrgRoleRepository } from './repositories/org-role.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { OrgRoleService } from './services/org-role.service';
import { OrganizationService } from './services/organization.service';

@Module({
  imports: [BusinessUnitModule],
  controllers: [OrganizationController, OrgRolesController],
  providers: [
    // Organization
    OrganizationService,
    OrganizationRepository,
    // Roles
    OrgRoleService,
    OrgRoleRepository,
  ],
  exports: [OrganizationService, OrganizationRepository, OrgRoleRepository],
})
export class OrganizationModule {}
