import { CatalogDomainService } from '@domain/catalog/services/catalog.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { type SiteFeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { AUTH_STATUS_EVENTS, SiteUpdatedEvent } from '@/common/events/auth-status.events';
import { type LegalEntity, type SiteMetadata, type SiteType } from '@/db/schema';
import { normalizeLocks } from '@/rbac/permission-dependencies';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import { SiteContextCacheService } from '@/site-context/site-context-cache.service';
import { sequentialSortOrders } from '@/utils/sort-order';
import { SiteDto } from '../dto/entity/site.dto';
import type { CreateSiteInternalDto } from '../dto/request/create-site-internal.dto';
import type { UpdateSiteInternalDto } from '../dto/request/update-site-internal.dto';
import { SiteDomainRepository } from '../repositories/site.repository';

@Injectable()
export class SiteDomainService {
  private readonly logger = new Logger(SiteDomainService.name);

  constructor(
    private readonly siteRepository: SiteDomainRepository,
    private readonly siteContextCache: SiteContextCacheService,
    private readonly permissionSetCache: PermissionSetCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly catalogService: CatalogDomainService,
  ) {}

  // Creates a site after validating its links
  async create(orgId: string, dto: CreateSiteInternalDto): Promise<SiteDto> {
    const code = dto.code;
    const existing = await this.siteRepository.findByOrgAndCode(orgId, code);
    if (existing) {
      throw new ConflictException({
        label: 'Duplicate Code',
        detail: `A site with code "${code}" already exists in this organization.`,
      });
    }

    if (dto.groupId) await this.validateGroup(orgId, dto.groupId);

    await this.validateEntityLinks(orgId, {
      legalEntityId: dto.legalEntityId,
      registrationId: dto.registrationId ?? null,
    });

    const site = await this.siteRepository.create({
      organizationId: orgId,
      name: dto.name,
      code,
      type: dto.type as SiteType,
      groupId: dto.groupId ?? null,
      timezone: dto.timezone,
      legalEntityId: dto.legalEntityId,
      registrationId: dto.registrationId ?? null,
      metadata: dto.metadata as SiteMetadata,
      sortOrder: dto.sortOrder ?? (await this.siteRepository.nextSortOrder(orgId, dto.legalEntityId)),
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

  // Updates a site after revalidating its links
  async update(id: string, dto: UpdateSiteInternalDto): Promise<SuccessResponseDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) throw new NotFoundException('Site not found.');

    const code = dto.code;
    if (code && code !== site.code) {
      const existing = await this.siteRepository.findByOrgAndCode(site.organizationId, code);
      if (existing) {
        throw new ConflictException({
          label: 'Duplicate Code',
          detail: `A site with code "${code}" already exists in this organization.`,
        });
      }
    }

    if (dto.groupId) await this.validateGroup(site.organizationId, dto.groupId);

    const effectiveLegalEntityId = dto.legalEntityId !== undefined ? dto.legalEntityId : site.legalEntityId;

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

    const effectiveSortOrder =
      dto.sortOrder !== undefined
        ? dto.sortOrder
        : legalEntityChanged
          ? await this.siteRepository.nextSortOrder(site.organizationId, effectiveLegalEntityId)
          : undefined;

    await this.siteRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(code !== undefined && { code }),
      ...(dto.type && { type: dto.type as SiteType }),
      ...(dto.groupId !== undefined && { groupId: dto.groupId }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      ...(dto.legalEntityId !== undefined && { legalEntityId: dto.legalEntityId }),
      ...((dto.registrationId !== undefined || effectiveRegistrationId !== site.registrationId) && {
        registrationId: effectiveRegistrationId,
      }),
      ...(dto.metadata !== undefined && { metadata: dto.metadata as SiteMetadata }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(effectiveSortOrder !== undefined && { sortOrder: effectiveSortOrder }),
      updatedAt: new Date(),
    });

    if (legalEntityChanged) await this.compactSiblings(site.organizationId, site.legalEntityId);

    await this.siteContextCache.invalidate(id);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_UPDATED, new SiteUpdatedEvent(id));

    this.logger.log(`Updated site ${id}`);
    return { success: true, message: 'Site updated successfully.' };
  }

  // Reorders sites within a legal entity
  async reorder(orgId: string, ids: string[]): Promise<SuccessResponseDto> {
    const sites = await this.siteRepository.findByIds(orgId, ids);
    if (sites.length !== ids.length) {
      throw new BadRequestException({
        label: 'Invalid Sites',
        detail: 'One or more sites do not exist or belong to a different organization.',
      });
    }

    await this.siteRepository.setSortOrders(sequentialSortOrders(ids));

    this.logger.log(`Reordered ${ids.length} site(s) for org ${orgId}`);
    for (const site of sites) {
      await this.siteContextCache.invalidate(site.id);
      this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_UPDATED, new SiteUpdatedEvent(site.id));
    }
    return { success: true, message: 'Sites reordered successfully.' };
  }

  // Replaces the site's feature lock deny-list
  async setFeatureLocks(id: string, featureLocks: SiteFeatureLocks | null): Promise<SuccessResponseDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) throw new NotFoundException('Site not found.');

    const snapshot = featureLocks ? await this.catalogService.getActiveSnapshot() : null;
    const expanded = normalizeLocks(featureLocks, snapshot);

    await this.siteRepository.update(id, { featureLocks: expanded, updatedAt: new Date() });

    await this.siteContextCache.invalidate(id);
    await this.permissionSetCache.invalidateBySite(id);
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

    const { organizationId, legalEntityId } = site;
    await this.siteRepository.delete(id);

    await this.compactSiblings(organizationId, legalEntityId);

    await this.siteContextCache.invalidate(id);
    this.logger.log(`Deleted site "${site.name}" (${id})`);
    return { success: true, message: 'Site deleted successfully.' };
  }

  // Resequences an LE's sites to close gaps
  private async compactSiblings(orgId: string, legalEntityId: string): Promise<void> {
    const siblings = await this.siteRepository.siblingsOrdered(orgId, legalEntityId);
    if (siblings.length === 0) return;
    await this.siteRepository.setSortOrders(sequentialSortOrders(siblings.map((sibling) => sibling.id)));
  }

  // Ensures the site group exists in the same organization
  private async validateGroup(orgId: string, groupId: string): Promise<void> {
    const group = await this.siteRepository.findSiteGroupById(groupId);
    if (!group || group.organizationId !== orgId) {
      throw new BadRequestException({
        label: 'Invalid Site Group',
        detail: 'The site group does not exist or belongs to a different organization.',
      });
    }
  }

  // Validates a site's legal entity and registration links
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
