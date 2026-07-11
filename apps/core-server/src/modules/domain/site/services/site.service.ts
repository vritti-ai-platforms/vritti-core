import { CatalogService } from '@domain/catalog/services/catalog.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { type SiteFeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type LegalEntity, type SiteMetadata, type SiteType } from '@/db/schema';
import { AUTH_STATUS_EVENTS, SiteUpdatedEvent } from '@/modules/core-api/auth/root/events/auth-status.events';
import { normalizeLocks } from '@/rbac/permission-dependencies';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import { SiteContextCacheService } from '@/site-context/site-context-cache.service';
import { SiteDto } from '../dto/entity/site.dto';
import type { CreateSiteInternalDto } from '../dto/request/create-site-internal.dto';
import type { UpdateSiteInternalDto } from '../dto/request/update-site-internal.dto';
import { SiteRepository } from '../repositories/site.repository';

@Injectable()
export class SiteService {
  private readonly logger = new Logger(SiteService.name);

  constructor(
    private readonly siteRepository: SiteRepository,
    private readonly siteContextCache: SiteContextCacheService,
    private readonly permissionSetCache: PermissionSetCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly catalogService: CatalogService,
  ) {}

  // Creates a site after validating its group, legal entity, and registration links
  async create(orgId: string, dto: CreateSiteInternalDto): Promise<SiteDto> {
    if (dto.groupId) await this.validateGroup(orgId, dto.groupId);

    const legalEntity = await this.validateEntityLinks(orgId, {
      legalEntityId: dto.legalEntityId ?? null,
      registrationId: dto.registrationId ?? null,
    });

    if (!legalEntity) {
      throw new BadRequestException({
        label: 'Missing Legal Entity',
        detail: 'Link a legal entity — the site currency derives from it.',
      });
    }

    const site = await this.siteRepository.create({
      organizationId: orgId,
      name: dto.name,
      code: dto.code.toLowerCase(),
      type: dto.type as SiteType,
      groupId: dto.groupId ?? null,
      timezone: dto.timezone,
      legalEntityId: dto.legalEntityId ?? null,
      registrationId: dto.registrationId ?? null,
      metadata: dto.metadata as SiteMetadata,
    });

    this.logger.log(`Created site "${dto.name}" (${site.id})`);
    return SiteDto.from(site);
  }

  // Returns a flat list of sites for an organization
  async findByOrg(orgId: string): Promise<SiteDto[]> {
    const sites = await this.siteRepository.findByOrg(orgId);
    return sites.map(SiteDto.from);
  }

  // Returns a single site by ID
  async findById(id: string): Promise<SiteDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) throw new NotFoundException('Site not found.');
    return SiteDto.from(site);
  }

  // Updates a site, revalidating group membership and legal-entity/registration links
  async update(id: string, dto: UpdateSiteInternalDto): Promise<SuccessResponseDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) throw new NotFoundException('Site not found.');

    if (dto.groupId) await this.validateGroup(site.organizationId, dto.groupId);

    const effectiveLegalEntityId = dto.legalEntityId !== undefined ? dto.legalEntityId : site.legalEntityId;

    // Clear a registration that no longer belongs to the site's new legal entity
    let effectiveRegistrationId = dto.registrationId !== undefined ? dto.registrationId : site.registrationId;
    const legalEntityChanged = dto.legalEntityId !== undefined && dto.legalEntityId !== site.legalEntityId;
    if (legalEntityChanged && dto.registrationId === undefined && site.registrationId) {
      const registration = await this.siteRepository.findTaxRegistrationById(site.registrationId);
      if (!registration || registration.legalEntityId !== effectiveLegalEntityId) {
        effectiveRegistrationId = null;
      }
    }

    if (dto.legalEntityId !== undefined || dto.registrationId !== undefined) {
      await this.validateEntityLinks(site.organizationId, {
        legalEntityId: effectiveLegalEntityId,
        registrationId: effectiveRegistrationId,
      });
    }

    await this.siteRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.code !== undefined && { code: dto.code.toLowerCase() }),
      ...(dto.type && { type: dto.type as SiteType }),
      ...(dto.groupId !== undefined && { groupId: dto.groupId }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      ...(dto.legalEntityId !== undefined && { legalEntityId: dto.legalEntityId }),
      ...((dto.registrationId !== undefined || effectiveRegistrationId !== site.registrationId) && {
        registrationId: effectiveRegistrationId,
      }),
      ...(dto.metadata !== undefined && { metadata: dto.metadata as SiteMetadata }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date(),
    });

    await this.siteContextCache.invalidate(id);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_UPDATED, new SiteUpdatedEvent(id));

    this.logger.log(`Updated site ${id}`);
    return { success: true, message: 'Site updated successfully.' };
  }

  // Replaces the site's feature lock deny-list (null = inherit the full plan)
  async setFeatureLocks(id: string, featureLocks: SiteFeatureLocks | null): Promise<SuccessResponseDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) throw new NotFoundException('Site not found.');

    // Locking a prerequisite must also lock its dependents — expand the deny-list before persisting
    const snapshot = featureLocks ? await this.catalogService.getActiveSnapshot() : null;
    const expanded = normalizeLocks(featureLocks, snapshot);

    await this.siteRepository.update(id, { featureLocks: expanded, updatedAt: new Date() });

    await this.siteContextCache.invalidate(id);
    await this.permissionSetCache.invalidateBySite(id);
    // Push the refreshed feature set to live SSE connections of users at this site
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_UPDATED, new SiteUpdatedEvent(id));

    this.logger.log(
      `Set feature locks for site ${id}: ${featureLocks ? `${Object.keys(featureLocks).length} feature(s)` : 'inherit full plan'}`,
    );
    return { success: true, message: 'Site feature locks updated successfully.' };
  }

  // Resolves a site's currency from its owning legal entity
  async getSiteCurrency(siteId: string): Promise<string | null> {
    return this.siteRepository.findLeCurrencyBySiteId(siteId);
  }

  // Deletes a site
  async remove(id: string): Promise<SuccessResponseDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) throw new NotFoundException('Site not found.');

    await this.siteRepository.delete(id);

    await this.siteContextCache.invalidate(id);
    this.logger.log(`Deleted site "${site.name}" (${id})`);
    return { success: true, message: 'Site deleted successfully.' };
  }

  // Ensures the target site group exists within the same organization
  private async validateGroup(orgId: string, groupId: string): Promise<void> {
    const group = await this.siteRepository.findSiteGroupById(groupId);
    if (!group || group.organizationId !== orgId) {
      throw new BadRequestException({
        label: 'Invalid Site Group',
        detail: 'The site group does not exist or belongs to a different organization.',
      });
    }
  }

  // Validates the legal entity and tax registration links for a site's effective state
  private async validateEntityLinks(
    orgId: string,
    effective: { legalEntityId: string | null; registrationId: string | null },
  ): Promise<LegalEntity | null> {
    let legalEntity: LegalEntity | null = null;

    if (effective.legalEntityId) {
      const found = await this.siteRepository.findLegalEntityById(effective.legalEntityId);
      if (!found || found.organizationId !== orgId) {
        throw new BadRequestException({
          label: 'Invalid Legal Entity',
          detail: 'The legal entity does not exist or belongs to a different organization.',
        });
      }
      legalEntity = found;
    }

    if (effective.registrationId) {
      if (!legalEntity) {
        throw new BadRequestException({
          label: 'Missing Legal Entity',
          detail: 'Assign a legal entity before attaching a tax registration.',
        });
      }
      const registration = await this.siteRepository.findTaxRegistrationById(effective.registrationId);
      if (!registration || registration.legalEntityId !== legalEntity.id) {
        throw new BadRequestException({
          label: 'Registration Mismatch',
          detail: "The tax registration does not belong to the site's legal entity.",
        });
      }
    }

    return legalEntity;
  }
}
