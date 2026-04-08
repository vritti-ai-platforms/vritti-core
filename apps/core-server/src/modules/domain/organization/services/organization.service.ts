import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { OrgSize } from '@/db/schema';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationWebhookDto } from '../dto/request/create-organization-webhook.dto';
import type { UpdateOrganizationWebhookDto } from '../dto/request/update-organization-webhook.dto';
import { OrganizationRepository } from '../repositories/organization.repository';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(private readonly organizationRepository: OrganizationRepository) {}

  // Finds an organization by ID, returns DTO or null
  async getById(id: string): Promise<OrganizationDto | null> {
    const org = await this.organizationRepository.findById(id);
    return org ? OrganizationDto.from(org) : null;
  }

  // Finds an organization by subdomain, returns DTO or null
  async getBySubdomain(subdomain: string): Promise<OrganizationDto | null> {
    const org = await this.organizationRepository.findBySubdomain(subdomain);
    return org ? OrganizationDto.from(org) : null;
  }

  // Creates an organization from a cloud-server webhook payload
  async createFromWebhook(dto: CreateOrganizationWebhookDto): Promise<OrganizationDto> {
    const org = await this.organizationRepository.create({
      name: dto.name,
      subdomain: dto.subdomain,
      size: dto.size,
      plan: dto.plan,
      logoUrl: dto.logoUrl,
    });

    this.logger.log(`Created organization from webhook: ${org.subdomain} (${org.id})`);

    return OrganizationDto.from(org);
  }

  // Updates an organization from a cloud-server webhook payload
  async updateFromWebhook(id: string, dto: UpdateOrganizationWebhookDto): Promise<SuccessResponseDto> {
    const org = await this.organizationRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found.');

    await this.organizationRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.size && { size: dto.size as OrgSize }),
      ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated organization from webhook: ${org.subdomain} (${id})`);
    return { success: true, message: 'Organization updated successfully.' };
  }

  // Deletes an organization from a cloud-server webhook
  async deleteFromWebhook(id: string): Promise<SuccessResponseDto> {
    const org = await this.organizationRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found.');

    await this.organizationRepository.delete(id);

    this.logger.log(`Deleted organization from webhook: ${org.subdomain} (${id})`);
    return { success: true, message: 'Organization deleted successfully.' };
  }
}
