import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { Module } from '@nestjs/common';
import { CloudSignatureGuard } from '@/common/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/common/interceptors/org-scope.interceptor';
import { OrganizationController } from './controllers/organization.controller';
import { RolesController } from './controllers/roles.controller';

@Module({
  imports: [OrganizationDomainModule],
  controllers: [OrganizationController, RolesController],
  providers: [CloudSignatureGuard, OrgScopeInterceptor],
})
export class OrganizationApiModule {}
