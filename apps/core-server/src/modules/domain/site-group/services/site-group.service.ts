import { CatalogService } from '@domain/catalog/services/catalog.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { type SelectOptionsQueryDto, type SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { AUTH_STATUS_EVENTS, SiteGroupUpdatedEvent } from '@/modules/core-api/auth/root/events/auth-status.events';
import { normalizeLocks } from '@/rbac/permission-dependencies';
import { sequentialSortOrders } from '@/utils/sort-order';
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

  // Returns site groups as select options, excluding a node and its descendant subtree
  findForSelect(query: SelectOptionsQueryDto, excludeId?: string): Promise<SelectQueryResult> {
    return this.siteGroupRepository.findForSelectOptions(query, excludeId);
  }

  // Returns the site group's feature lock deny-list
  async getFeatureLocks(id: string): Promise<FeatureLocks | null> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');
    return group.featureLocks ?? null;
  }

  // Replaces the site group's feature lock deny-list
  async setFeatureLocks(id: string, featureLocks: FeatureLocks | null): Promise<SuccessResponseDto> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');

    const snapshot = featureLocks ? await this.catalogService.getActiveSnapshot() : null;
    const expanded = normalizeLocks(featureLocks, snapshot);

    await this.siteGroupRepository.update(id, { featureLocks: expanded, updatedAt: new Date() });

    this.logger.log(
      `Set feature locks for site group ${id}: ${featureLocks ? `${Object.keys(featureLocks).length} feature(s)` : 'inherit full plan'}`,
    );
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(id, group.organizationId));
    return { success: true, message: 'Site group feature locks updated successfully.' };
  }

  // Creates a site group after validation
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
      color: dto.color ?? null,
      parentId: dto.parentId ?? null,
      sortOrder: dto.sortOrder ?? (await this.siteGroupRepository.nextSortOrder(orgId, dto.parentId ?? null)),
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

  // Updates a site group after validation
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

    const oldParentId = group.parentId;
    const reparented = dto.parentId !== undefined && dto.parentId !== oldParentId;
    const effectiveSortOrder =
      dto.sortOrder !== undefined
        ? dto.sortOrder
        : reparented
          ? await this.siteGroupRepository.nextSortOrder(group.organizationId, dto.parentId ?? null)
          : undefined;

    await this.siteGroupRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.code && { code: dto.code }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(effectiveSortOrder !== undefined && { sortOrder: effectiveSortOrder }),
      updatedAt: new Date(),
    });

    if (reparented) await this.compactSiblings(group.organizationId, oldParentId);

    this.logger.log(`Updated site group ${id}`);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(id, group.organizationId));
    return { success: true, message: 'Site group updated successfully.' };
  }

  // Deletes a site group after reference checks
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

    const { organizationId, parentId } = group;
    await this.siteGroupRepository.delete(id);

    await this.compactSiblings(organizationId, parentId);

    this.logger.log(`Deleted site group "${group.name}" (${id})`);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(id, organizationId));
    return { success: true, message: 'Site group deleted successfully.' };
  }

  // Reorders sibling site groups
  async reorder(orgId: string, ids: string[]): Promise<SuccessResponseDto> {
    const groups = await this.siteGroupRepository.findByIds(orgId, ids);
    if (groups.length !== ids.length) {
      throw new BadRequestException({
        label: 'Invalid Site Groups',
        detail: 'One or more site groups do not exist or belong to a different organization.',
      });
    }

    await this.siteGroupRepository.setSortOrders(orgId, sequentialSortOrders(ids));

    this.logger.log(`Reordered ${ids.length} site group(s) for org ${orgId}`);
    for (const group of groups) {
      this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(group.id, orgId));
    }
    return { success: true, message: 'Site groups reordered successfully.' };
  }

  // Reparents a site group under a validated new parent
  async reparent(id: string, parentId: string | null): Promise<SuccessResponseDto> {
    const group = await this.siteGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Site group not found.');

    if (parentId) {
      await this.assertParentInOrg(parentId, group.organizationId);
      await this.assertNoCycle(id, parentId);
    }

    const oldParentId = group.parentId;
    const sortOrder = await this.siteGroupRepository.nextSortOrder(group.organizationId, parentId);

    await this.siteGroupRepository.update(id, { parentId, sortOrder, updatedAt: new Date() });

    if (parentId !== oldParentId) await this.compactSiblings(group.organizationId, oldParentId);

    this.logger.log(`Reparented site group ${id} under ${parentId ?? 'root'}`);
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED, new SiteGroupUpdatedEvent(id, group.organizationId));
    return { success: true, message: 'Site group reparented successfully.' };
  }

  // Resequences a parent's siblings to close gaps
  private async compactSiblings(orgId: string, parentId: string | null): Promise<void> {
    const siblings = await this.siteGroupRepository.siblingsOrdered(orgId, parentId);
    if (siblings.length === 0) return;
    await this.siteGroupRepository.setSortOrders(orgId, sequentialSortOrders(siblings.map((sibling) => sibling.id)));
  }

  // Ensures the parent exists in the same organization
  private async assertParentInOrg(parentId: string, orgId: string): Promise<void> {
    const parent = await this.siteGroupRepository.findById(parentId);
    if (!parent || parent.organizationId !== orgId) {
      throw new BadRequestException({
        label: 'Invalid Parent',
        detail: 'The parent site group does not exist or belongs to a different organization.',
      });
    }
  }

  // Rejects a parent that would form a cycle
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
