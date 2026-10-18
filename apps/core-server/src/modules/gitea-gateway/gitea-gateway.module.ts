import { Module } from '@nestjs/common';
import { OrganizationDomainModule } from '../domain/organization/organization.module';
import { OrganizationGatewayController } from './organization/organization-gateway.controller';
import { OrganizationGatewayService } from './organization/services/organization-gateway.service';
import { RepositoriesGatewayController } from './repositories/repositories-gateway.controller';
import { ActionsGatewayService } from './repositories/services/actions-gateway.service';
import { RepositoriesGatewayService } from './repositories/services/repositories-gateway.service';
import { SelectApiController } from './select-api/select-api.controller';
import { SelectApiGatewayService } from './select-api/services/select-api-gateway.service';
import { GiteaCredentialsRepository } from './services/gitea-credentials.repository';
import { GiteaCredentialsService } from './services/gitea-credentials.service';
import { GiteaHttpService } from './services/gitea-http.service';

// HTTP gateway to the self-hosted Gitea instance.
@Module({
  // The organization is provisioned from our own org record, so the domain service is needed here
  imports: [OrganizationDomainModule],
  controllers: [OrganizationGatewayController, RepositoriesGatewayController, SelectApiController],
  providers: [
    // Reads the agent-owned gitea_credentials row (base URL + admin token + pull token), cached in memory
    GiteaCredentialsService,
    GiteaCredentialsRepository,
    // HTTP transport
    GiteaHttpService,
    // Organization
    OrganizationGatewayService,
    // Repositories — actions are a view of a repository, so they share the one controller
    RepositoriesGatewayService,
    ActionsGatewayService,
    // Select options for dropdowns
    SelectApiGatewayService,
  ],
  exports: [GiteaCredentialsService, SelectApiGatewayService],
})
export class GiteaGatewayModule {}
