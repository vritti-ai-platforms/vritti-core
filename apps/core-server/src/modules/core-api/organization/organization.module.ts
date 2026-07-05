import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { Module } from '@nestjs/common';
import { OrganizationController } from './controllers/organization.controller';
import { RolesController } from './controllers/roles.controller';

@Module({
  imports: [OrganizationDomainModule],
  controllers: [OrganizationController, RolesController],
})
export class OrganizationApiModule {}
