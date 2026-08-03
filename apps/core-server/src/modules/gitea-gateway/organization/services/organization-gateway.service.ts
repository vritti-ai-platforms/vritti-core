import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateResponseDto } from '@vritti/api-sdk/database';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { ServiceTypeValues } from '@/db/schema';
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

  // Reports whether the organization's git namespace exists. This one stays live against Gitea: it backs the
  // setup screen, which renders avatar/website/visibility — detail the org record does not carry.
  async findStatus(subdomain: string): Promise<OrganizationStatusResponseDto> {
    const organization = await this.gitea.getOrNull<GiteaApiOrganization>(`/orgs/${subdomain}`);
    if (!organization) return OrganizationStatusResponseDto.absent(subdomain);

    await this.backfillNamespace(subdomain, organization);

    return OrganizationStatusResponseDto.present(subdomain, OrganizationResponseDto.from(organization));
  }

  // Records a namespace that exists in Gitea but has no org_services row — covers orgs provisioned before the
  // table existed, and namespaces created directly in Gitea. Without it they read as un-provisioned forever.
  private async backfillNamespace(subdomain: string, organization: GiteaApiOrganization): Promise<void> {
    const org = await this.organizationService.getBySubdomain(subdomain);
    if (!org || org.services.some((entry) => entry.service === ServiceTypeValues.GITEA)) return;

    await this.organizationService.provisionService(org.id, {
      service: ServiceTypeValues.GITEA,
      externalId: String(organization.id),
      externalName: organization.username,
    });
    this.logger.log(`Backfilled git namespace "${organization.username}" for organization "${org.name}"`);
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

    // Persist before responding — the org_services row is what every later namespace check and feature lock reads
    await this.organizationService.provisionService(orgId, {
      service: ServiceTypeValues.GITEA,
      externalId: String(organization.id),
      externalName: organization.username,
    });

    this.logger.log(`Provisioned git namespace "${subdomain}" for organization "${org.name}"`);

    return {
      success: true,
      message: `Git organization "${subdomain}" created successfully.`,
      data: OrganizationResponseDto.from(organization),
    };
  }

  // Fails when the namespace has not been provisioned yet — used by sibling features. Answers from the
  // org_services row rather than Gitea, so the 20 repository/actions endpoints don't each pay an HTTP round-trip.
  async requireNamespace(subdomain: string): Promise<string> {
    const org = await this.organizationService.getBySubdomain(subdomain);
    const gitea = org?.services.find((entry) => entry.service === ServiceTypeValues.GITEA);
    if (gitea?.externalName) {
      // The namespace is provisioned AS the subdomain, so the two must stay identical. If they ever
      // diverge the stored value still wins — it is what actually exists in Gitea — but say so loudly,
      // because it means a rename happened without the namespace following it.
      if (gitea.externalName !== subdomain) {
        this.logger.warn(
          `Git namespace "${gitea.externalName}" no longer matches subdomain "${subdomain}" — using the stored namespace`,
        );
      }
      return gitea.externalName;
    }

    throw new ConflictException({
      label: 'Organization Not Set Up',
      detail: 'Set up the git organization before adding repositories.',
    });
  }
}
