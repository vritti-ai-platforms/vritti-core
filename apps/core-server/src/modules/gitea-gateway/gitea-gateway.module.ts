import { Module } from '@nestjs/common';
import { OrganizationDomainModule } from '../domain/organization/organization.module';
import { OrganizationGatewayController } from './organization/organization-gateway.controller';
import { OrganizationGatewayService } from './organization/services/organization-gateway.service';
import { RepositoriesGatewayController } from './repositories/repositories-gateway.controller';
import { ActionsGatewayService } from './repositories/services/actions-gateway.service';
import { RepositoriesGatewayService } from './repositories/services/repositories-gateway.service';
import { GiteaHttpService } from './services/gitea-http.service';

// HTTP gateway to the self-hosted Gitea instance. GiteaHttpService stays private — callers get the
// typed feature services only, mirroring cloud-server's CoreServerModule.
@Module({
  // The organization is provisioned from our own org record, so the domain service is needed here
  imports: [OrganizationDomainModule],
  controllers: [OrganizationGatewayController, RepositoriesGatewayController],
  providers: [
    // HTTP transport
    GiteaHttpService,
    // Organization
    OrganizationGatewayService,
    // Repositories — actions are a view of a repository, so they share the one controller
    RepositoriesGatewayService,
    ActionsGatewayService,
  ],
})
export class GiteaGatewayModule {}
