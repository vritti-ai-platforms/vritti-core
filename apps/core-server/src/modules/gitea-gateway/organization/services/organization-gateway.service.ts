import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateResponseDto } from '@vritti/api-sdk/database';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { OrganizationDomainService } from '../../../domain/organization/services/organization.service';
import { GiteaHttpService } from '../../services/gitea-http.service';
import { type GiteaApiOrganization, OrganizationResponseDto } from '../dto/response/organization-response.dto';
import { OrganizationStatusResponseDto } from '../dto/response/organization-status-response.dto';

// The git namespace IS the organization subdomain, used verbatim. Subdomains are already validated
// at creation (lowercase, hyphens, max 40 chars — Gitea's own name limit), so there is nothing to
// normalise or re-check here.
@Injectable()
export class OrganizationGatewayService {
  private readonly logger = new Logger(OrganizationGatewayService.name);
  private readonly baseDomain: string;

  constructor(
    private readonly gitea: GiteaHttpService,
    private readonly organizationService: OrganizationDomainService,
    configService: ConfigService,
  ) {
    this.baseDomain = configService.getOrThrow<string>('BASE_DOMAIN');
  }

  // Reports whether the organization's git namespace exists
  async findStatus(subdomain: string): Promise<OrganizationStatusResponseDto> {
    const organization = await this.gitea.getOrNull<GiteaApiOrganization>(`/orgs/${subdomain}`);
    if (!organization) return OrganizationStatusResponseDto.absent(subdomain);

    return OrganizationStatusResponseDto.present(subdomain, OrganizationResponseDto.from(organization));
  }

  // Provisions the git namespace. Every field is derived from the Vritti organization record —
  // the client sends nothing, so the two systems cannot drift.
  async create(orgId: string, subdomain: string): Promise<CreateResponseDto<OrganizationResponseDto>> {
    const org = await this.organizationService.getById(orgId);
    if (!org) throw new NotFoundException('Organization not found.');

    const organization = await this.gitea.post<GiteaApiOrganization>('/orgs', {
      username: subdomain,
      full_name: org.name,
      // The org record carries no website or location columns; the workspace URL is the one
      // genuinely derivable value.
      description: '',
      website: `https://${subdomain}.${this.baseDomain}`,
      location: '',
      visibility: 'private',
      repo_admin_change_team_access: true,
    });

    this.logger.log(`Provisioned git namespace "${subdomain}" for organization "${org.name}"`);

    return {
      success: true,
      message: `Git organisation "${subdomain}" created successfully.`,
      data: OrganizationResponseDto.from(organization),
    };
  }

  // Fails when the namespace has not been provisioned yet — used by sibling features
  async requireNamespace(subdomain: string): Promise<string> {
    const status = await this.findStatus(subdomain);
    if (status.exists) return status.namespace;

    throw new ConflictException({
      label: 'Organisation Not Set Up',
      detail: 'Set up the git organisation before adding repositories.',
    });
  }
}
