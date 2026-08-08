import { CatalogDomainService } from '@domain/catalog/services/catalog.service';
import { MediaGcService } from '@domain/media/services/media-gc.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { PrimaryDatabaseService, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { OrgEntitlement, SignedDocument } from '@vritti/api-sdk/license';
import { verifyDocument } from '@vritti/api-sdk/signing';
import { AUTH_STATUS_EVENTS, OrgUpdatedEvent, SiteUpdatedEvent } from '@/common/events/auth-status.events';
import type { OrgService as OrgServiceEntity, OrgSize } from '@/db/schema';
import { normalizeLocks } from '@/rbac/permission-dependencies';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import { SiteContextCacheService } from '@/site-context/site-context-cache.service';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationInternalDto } from '../dto/request/create-organization-internal.dto';
import type { ProvisionOrgServiceInternalDto } from '../dto/request/provision-org-service-internal.dto';
import type { UpdateOrganizationInternalDto } from '../dto/request/update-organization-internal.dto';
import { OrgServiceDomainRepository } from '../repositories/org-service.repository';
import { OrganizationDomainRepository } from '../repositories/organization.repository';

@Injectable()
export class OrganizationDomainService {
  private readonly logger = new Logger(OrganizationDomainService.name);
  private readonly licensePublicKey: string;
  private readonly deploymentId: string | undefined;
  private warnedUnboundDeployment = false;

  constructor(
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly orgServiceRepository: OrgServiceDomainRepository,
    private readonly primaryDb: PrimaryDatabaseService,
    private readonly siteContextCache: SiteContextCacheService,
    private readonly permissionSetCache: PermissionSetCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly catalogService: CatalogDomainService,
    private readonly mediaGcService: MediaGcService,
    configService: ConfigService,
  ) {
    this.licensePublicKey = configService.getOrThrow<string>('LICENSE_PUBLIC_KEY');
    this.deploymentId = configService.get<string>('DEPLOYMENT_ID');
  }

  // Returns the organization's stored feature lock deny-list (null = inherit the full plan)
  async getFeatureLocks(orgId: string): Promise<FeatureLocks | null> {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found.');
    return org.featureLocks ?? null;
  }

  // Replaces the organization's feature lock deny-list (null = inherit the full plan)
  async setFeatureLocks(orgId: string, featureLocks: FeatureLocks | null): Promise<SuccessResponseDto> {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found.');

    // Locking a prerequisite must also lock its dependents — expand the deny-list before persisting
    const snapshot = featureLocks ? await this.catalogService.getActiveSnapshot() : null;
    const expanded = normalizeLocks(featureLocks, snapshot);

    await this.organizationRepository.update(orgId, { featureLocks: expanded, updatedAt: new Date() });

    this.logger.log(
      `Set feature locks for org ${orgId}: ${featureLocks ? `${Object.keys(featureLocks).length} feature(s)` : 'inherit full plan'}`,
    );
    // Push the refreshed org-scope feature set to live SSE connections of the org's users
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.ORG_UPDATED, new OrgUpdatedEvent(orgId));
    return { success: true, message: 'Organization feature locks updated successfully.' };
  }

  // Returns the services this organization has provisioned. org_services carries an org_isolation
  // policy and callers include the public /auth/status path, where no session has set app.org_id — so
  // the read supplies its own context rather than relying on the connection owning the table.
  async getServices(orgId: string): Promise<OrgServiceEntity[]> {
    return this.primaryDb.runWithRlsContext({ orgId }, () => this.orgServiceRepository.findByOrg(orgId));
  }

  // Records a provisioned external service — its presence is the authoritative answer for service feature locks
  async provisionService(orgId: string, dto: ProvisionOrgServiceInternalDto): Promise<void> {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found.');

    // Passed through as-is: an omitted identifier must stay undefined so the upsert leaves the stored
    // value alone rather than overwriting it with null
    await this.orgServiceRepository.upsert(orgId, dto.service, {
      externalId: dto.externalId,
      externalName: dto.externalName,
    });

    // Bust the resolved permission sets BEFORE announcing, or the SSE re-push serves the stale locked
    // set. Reached from the read-only status backfill too, but only on the transition into provisioned,
    // so the blunt invalidateAll still fires about once per service (same as a catalog push).
    await this.permissionSetCache.invalidateAll();

    this.logger.log(`Provisioned service ${dto.service} for org ${orgId} (${dto.externalName ?? 'no ref'})`);
    // Unlocks every feature gated on this service and refreshes org.services for live SSE connections
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.ORG_UPDATED, new OrgUpdatedEvent(orgId));
  }

  // Finds an organization by ID, returns DTO (with its provisioned services) or null
  async getById(id: string): Promise<OrganizationDto | null> {
    const org = await this.organizationRepository.findById(id);
    return org ? OrganizationDto.from(org, await this.getServices(org.id)) : null;
  }

  // Finds an organization by subdomain, returns DTO (with its provisioned services) or null
  async getBySubdomain(subdomain: string): Promise<OrganizationDto | null> {
    const org = await this.organizationRepository.findBySubdomain(subdomain);
    return org ? OrganizationDto.from(org, await this.getServices(org.id)) : null;
  }

  // Creates an organization from a cloud-server internal request payload
  async createFromCloud(dto: CreateOrganizationInternalDto): Promise<OrganizationDto> {
    const org = await this.organizationRepository.create({
      name: dto.name,
      subdomain: dto.subdomain,
      size: dto.size,
      plan: dto.plan,
      logoUrl: dto.logoUrl,
      storage: dto.storage,
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
      // Checked against undefined, not truthiness: `false` is the whole point of this field
      ...(dto.storageEnabled !== undefined && { storageEnabled: dto.storageEnabled }),
      // Merged rather than replaced: buckets and publicUrl are unchanged by a rotation, and only this side holds them
      ...(dto.storageCredential && { storage: { ...org.storage, ...dto.storageCredential } }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated organization from cloud: ${org.subdomain} (${id})`);
    return { success: true, message: 'Organization updated successfully.' };
  }

  // Receives a signed entitlement from cloud: verify, replay-guard, store, refresh the org's live sites
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

    // Next getPermissions read resolves with the new plan; push fresh auth-state to the org's live sites
    const siteIds = await this.organizationRepository.findSiteIds(orgId);
    for (const siteId of siteIds) {
      await this.siteContextCache.invalidate(siteId);
      this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_UPDATED, new SiteUpdatedEvent(siteId));
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

    // Captured before the row goes, then used after it. Purging first would mean a failed row delete leaves the org
    // intact with every file destroyed — silent data loss with nothing deleted. This way the worst case is orphaned
    // objects, which the control plane's bucket delete and the GC sweep both clean up.
    const storage = org.storage;
    await this.organizationRepository.delete(id);

    try {
      await this.mediaGcService.purgeObjects(storage);
    } catch (error: unknown) {
      this.logger.warn(`Deleted org ${id} but could not purge its objects: ${error}`);
    }

    this.logger.log(`Deleted organization from cloud: ${org.subdomain} (${id})`);
    return { success: true, message: 'Organization deleted successfully.' };
  }
}
