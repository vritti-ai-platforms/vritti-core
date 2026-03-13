import { Injectable, Logger } from '@nestjs/common';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationWebhookDto } from '../dto/request/create-organization-webhook.dto';
import { OrganizationRepository } from '../repositories/organization.repository';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(private readonly organizationRepository: OrganizationRepository) {}

  // Creates an organization from a cloud-server webhook payload
  async createFromWebhook(dto: CreateOrganizationWebhookDto): Promise<OrganizationDto> {
    const org = await this.organizationRepository.create({
      name: dto.name,
      subdomain: dto.subdomain,
      size: dto.size,
      plan: dto.plan,
      mediaId: dto.mediaId,
    });

    this.logger.log(`Created organization from webhook: ${org.subdomain} (${org.id})`);

    return OrganizationDto.from(org);
  }
}
