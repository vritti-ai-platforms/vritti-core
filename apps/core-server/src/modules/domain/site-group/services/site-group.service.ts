import { CatalogService } from '@domain/catalog/services/catalog.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { normalizeLocks } from '@/rbac/permission-dependencies';
import { AUTH_STATUS_EVENTS, SiteGroupUpdatedEvent } from '@/modules/core-api/auth/root/events/auth-status.events';
import { SiteGroupDto } from '../dto/entity/site-group.dto';
import type { CreateSiteGroupInternalDto } from '../dto/request/create-site-group-internal.dto';
import type { UpdateSiteGroupInternalDto } from '../dto/request/update-site-group-internal.dto';
import { SiteGroupRepository } from '../repositories/site-group.repository';

@Injectable()
export class SiteGroupService {
  private readonly logger = new Logger(SiteGroupService.name);

  constructor(
    private readonly siteGroupRepository: SiteGroupRepository,
    private readonly catalogService: CatalogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Returns the site group's stored feature lock deny-list (null = inherit the full plan)
  async getFeatureLocks(id: string): Promise<FeatureLocks | null> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');
    return group.featureLocks ?? null;
  }

  // Replaces the site group's feature lock deny-list (null = inherit the full plan)
  async setFeatureLocks(id: string, featureLocks: FeatureLocks | null): Promise<SuccessResponseDto> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');

    // Locking a prerequisite must also lock its dependents — expand the deny-list before persisting
    const snapshot = featureLocks ? await this.catalogService.getActiveSnapshot() : null;
    const expanded = normalizeLocks(featureLocks, snapshot);

    await this.siteGroupRepository.update(id, { featureLocks: expanded, updatedAt: new Date() });
    // Lock consumption lands with group-context feature resolution; invalidate caches here when it does

    this.logger.log(
      `Set feature locks for site group ${id}: ${featureLocks ? `${Object.keys(featureLocks).length} feature(s)` : 'inherit full plan'}`,
    );
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(id));
    return { success: true, message: 'Site group feature locks updated successfully.' };
  }

  // Creates a site group after validating code uniqueness and parent linkage
  async create(orgId: string, dto: CreateSiteGroupInternalDto): Promise<SiteGroupDto> {
    const existing = await this.siteGroupRepository.findByOrgAndCode(orgId, dto.code);
    if (existing) {
      throw new ConflictException({
        label: 'Duplicate Code',
        detail: `A site group with code "${dto.code}" already exists in this organization.`,
      });
    }

    if (dto.parentId) await this.assertParentInOrg(dto.parentId, orgId);

    const group = await this.siteGroupRepository.create({
      organizationId: orgId,
      name: dto.name,
      code: dto.code,
      parentId: dto.parentId ?? null,
    });

    this.logger.log(`Created site group "${dto.name}" (${group.id}) for org ${orgId}`);
    return SiteGroupDto.from(group);
  }

  // Returns a flat list of site groups for an organization
  async findByOrg(orgId: string): Promise<SiteGroupDto[]> {
    const groups = await this.siteGroupRepository.findByOrg(orgId);
    return groups.map(SiteGroupDto.from);
  }

  // Returns a single site group by ID
  async findById(id: string): Promise<SiteGroupDto> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');
    return SiteGroupDto.from(group);
  }

  // Updates a site group after validating code uniqueness, parent linkage, and cycles
  async update(id: string, dto: UpdateSiteGroupInternalDto): Promise<SuccessResponseDto> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');

    if (dto.code && dto.code !== group.code) {
      const existing = await this.siteGroupRepository.findByOrgAndCode(group.organizationId, dto.code);
      if (existing) {
        throw new ConflictException({
          label: 'Duplicate Code',
          detail: `A site group with code "${dto.code}" already exists in this organization.`,
        });
      }
    }

    if (dto.parentId) {
      await this.assertParentInOrg(dto.parentId, group.organizationId);
      await this.assertNoCycle(id, dto.parentId);
    }

    await this.siteGroupRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.code && { code: dto.code }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated site group ${id}`);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(id));
    return { success: true, message: 'Site group updated successfully.' };
  }

  // Deletes a site group after ensuring it has no child groups or member sites
  async remove(id: string): Promise<SuccessResponseDto> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');

    const childCount = await this.siteGroupRepository.countChildren(id);
    if (childCount > 0) {
      throw new ConflictException({
        label: 'Cannot Delete',
        detail: `This site group has ${childCount} child group(s). Remove or reassign them first.`,
      });
    }

    const memberCount = await this.siteGroupRepository.countMemberSites(id);
    if (memberCount > 0) {
      throw new ConflictException({
        label: 'Cannot Delete',
        detail: `This site group has ${memberCount} member site(s). Move them to another group first.`,
      });
    }

    await this.siteGroupRepository.delete(id);

    this.logger.log(`Deleted site group "${group.name}" (${id})`);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(id));
    return { success: true, message: 'Site group deleted successfully.' };
  }

  // Ensures the parent site group exists within the same organization
  private async assertParentInOrg(parentId: string, orgId: string): Promise<void> {
    const parent = await this.siteGroupRepository.findById(parentId);
    if (!parent || parent.organizationId !== orgId) {
      throw new BadRequestException({
        label: 'Invalid Parent',
        detail: 'The parent site group does not exist or belongs to a different organization.',
      });
    }
  }

  // Rejects a parent assignment that would nest a site group under itself or one of its descendants
  private async assertNoCycle(id: string, parentId: string): Promise<void> {
    let cursor: string | null = parentId;
    let guard = 0;
    while (cursor && guard < 100) {
      if (cursor === id) {
        throw new BadRequestException({
          label: 'Invalid Parent',
          detail: 'A site group cannot be nested under itself or one of its own descendants.',
        });
      }
      const node = await this.siteGroupRepository.findById(cursor);
      cursor = node?.parentId ?? null;
      guard += 1;
    }
  }
}
