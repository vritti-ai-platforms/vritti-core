import { Module } from '@nestjs/common';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { WebhookSessionInterceptor } from '@/common/interceptors/webhook-session.interceptor';
import { OrgRolesController } from './controllers/org-roles.controller';
import { OrganizationController } from './controllers/organization.controller';

@Module({
  imports: [OrganizationDomainModule],
  controllers: [OrganizationController, OrgRolesController],
  providers: [WebhookSecretGuard, WebhookSessionInterceptor],
})
export class OrganizationApiModule {}
