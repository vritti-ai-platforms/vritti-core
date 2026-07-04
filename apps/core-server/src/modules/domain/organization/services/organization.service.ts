import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForbiddenException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { OrgEntitlement, SignedDocument } from '@vritti/api-sdk/license';
import { verifyDocument } from '@vritti/api-sdk/signing';
import { BuContextCacheService } from '@/common/services/bu-context-cache.service';
import type { OrgSize } from '@/db/schema';
import { AUTH_STATUS_EVENTS, BuUpdatedEvent } from '@/modules/core-api/auth/root/events/auth-status.events';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationInternalDto } from '../dto/request/create-organization-internal.dto';
import type { UpdateOrganizationInternalDto } from '../dto/request/update-organization-internal.dto';
import { OrganizationRepository } from '../repositories/organization.repository';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  private readonly licensePublicKey: string;
  private readonly deploymentId: string | undefined;
  private warnedUnboundDeployment = false;

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly buContextCache: BuContextCacheService,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.licensePublicKey = configService.getOrThrow<string>('CLOUD_PUBLIC_KEY');
    this.deploymentId = configService.get<string>('DEPLOYMENT_ID');
  }

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

  // Creates an organization from a cloud-server internal request payload
  async createFromCloud(dto: CreateOrganizationInternalDto): Promise<OrganizationDto> {
    const org = await this.organizationRepository.create({
      name: dto.name,
      subdomain: dto.subdomain,
      size: dto.size,
      plan: dto.plan,
      logoUrl: dto.logoUrl,
    });

    this.logger.log(`Created organization from cloud: ${org.subdomain} (${org.id})`);

    return OrganizationDto.from(org);
  }

  // Updates an organization from a cloud-server internal request payload
  async updateFromCloud(id: string, dto: UpdateOrganizationInternalDto): Promise<SuccessResponseDto> {
    const org = await this.organizationRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found.');

    await this.organizationRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.size && { size: dto.size as OrgSize }),
      ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated organization from cloud: ${org.subdomain} (${id})`);
    return { success: true, message: 'Organization updated successfully.' };
  }

  // Receives a signed entitlement from cloud: verify, replay-guard, store, refresh the org's live BUs
  async receiveEntitlement(orgId: string, doc: SignedDocument<OrgEntitlement>): Promise<SuccessResponseDto> {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found.');

    if (!verifyDocument(doc, this.licensePublicKey)) {
      throw new ForbiddenException('Invalid entitlement signature.');
    }

    if (doc.payload.orgId !== orgId) {
      throw new ForbiddenException('Entitlement is bound to a different organization.');
    }

    this.checkDeploymentBinding(doc.payload.deploymentId);

    // issuedAt monotonicity — ignore replays of an entitlement we already superseded
    if (org.entitlement && new Date(org.entitlement.payload.issuedAt) >= new Date(doc.payload.issuedAt)) {
      this.logger.log(`Ignored stale entitlement for org ${orgId} (issuedAt ${doc.payload.issuedAt})`);
      return { success: true, message: 'Entitlement already up to date.' };
    }

    await this.organizationRepository.update(orgId, {
      entitlement: doc,
      planCode: doc.payload.planCode,
      businessCode: doc.payload.businessCode,
      updatedAt: new Date(),
    });

    // Next getPermissions read resolves with the new plan; push fresh auth-state to the org's live BUs
    const buIds = await this.organizationRepository.findBusinessUnitIds(orgId);
    for (const buId of buIds) {
      this.buContextCache.invalidate(buId);
      this.eventEmitter.emit(AUTH_STATUS_EVENTS.BU_UPDATED, new BuUpdatedEvent(buId));
    }

    this.logger.log(
      `Stored entitlement for org ${orgId}: plan ${doc.payload.planCode}, business ${doc.payload.businessCode}`,
    );
    return { success: true, message: 'Entitlement updated successfully.' };
  }

  // Rejects entitlements bound to a different deployment; skips binding (with a one-time warning) when unset
  private checkDeploymentBinding(payloadDeploymentId: string): void {
    if (!this.deploymentId) {
      if (!this.warnedUnboundDeployment) {
        this.logger.warn('DEPLOYMENT_ID is not set — skipping entitlement deployment binding check');
        this.warnedUnboundDeployment = true;
      }
      return;
    }
    if (this.deploymentId !== payloadDeploymentId) {
      throw new ForbiddenException('Entitlement is bound to a different deployment.');
    }
  }

  // Deletes an organization from a cloud-server internal request
  async deleteFromCloud(id: string): Promise<SuccessResponseDto> {
    const org = await this.organizationRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found.');

    await this.organizationRepository.delete(id);

    this.logger.log(`Deleted organization from cloud: ${org.subdomain} (${id})`);
    return { success: true, message: 'Organization deleted successfully.' };
  }
}
