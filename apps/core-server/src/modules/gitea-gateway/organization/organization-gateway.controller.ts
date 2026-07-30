import { Controller, Get, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk/auth';
import type { CreateResponseDto } from '@vritti/api-sdk/database';
import { ORG_ORGANIZATION } from '@vritti/commerce-permissions/organization';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId, OrgSubdomain } from '@/security/decorators';
import type { OrganizationResponseDto } from './dto/response/organization-response.dto';
import type { OrganizationStatusResponseDto } from './dto/response/organization-status-response.dto';
import { OrganizationGatewayService } from './services/organization-gateway.service';

@ApiTags('Gitea - Organization')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_ORGANIZATION.featureCode)
@Controller('organization')
export class OrganizationGatewayController {
  private readonly logger = new Logger(OrganizationGatewayController.name);

  constructor(private readonly organizationGatewayService: OrganizationGatewayService) {}

  @Get()
  @RequirePermission(ORG_ORGANIZATION.view)
  getStatus(@OrgSubdomain() subdomain: string): Promise<OrganizationStatusResponseDto> {
    this.logger.log(`GET /gitea-api/organization (org=${subdomain})`);
    return this.organizationGatewayService.findStatus(subdomain);
  }

  // Takes no body — every field is derived from the Vritti organization record
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_ORGANIZATION.setup)
  create(
    @OrgId() orgId: string,
    @OrgSubdomain() subdomain: string,
  ): Promise<CreateResponseDto<OrganizationResponseDto>> {
    this.logger.log(`POST /gitea-api/organization (org=${subdomain})`);
    return this.organizationGatewayService.create(orgId, subdomain);
  }
}
