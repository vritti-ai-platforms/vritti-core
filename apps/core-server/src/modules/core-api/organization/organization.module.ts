import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { Module } from '@nestjs/common';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { WebhookSessionInterceptor } from '@/common/interceptors/webhook-session.interceptor';
import { OrganizationController } from './controllers/organization.controller';
import { RolesController } from './controllers/roles.controller';

@Module({
  imports: [OrganizationDomainModule],
  controllers: [OrganizationController, RolesController],
  providers: [WebhookSecretGuard, WebhookSessionInterceptor],
})
export class OrganizationApiModule {}
