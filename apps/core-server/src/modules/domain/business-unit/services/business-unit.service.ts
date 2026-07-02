import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import { type BuFeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import { BuContextCacheService } from '@/common/services/bu-context-cache.service';
import type { BuMetadata, BuType } from '@/db/schema';
import { AUTH_STATUS_EVENTS, BuUpdatedEvent } from '@/modules/core-api/auth/root/events/auth-status.events';
import { BusinessUnitDto } from '../dto/entity/business-unit.dto';
import type { CreateBusinessUnitWebhookDto } from '../dto/request/create-business-unit-webhook.dto';
import type { ReplaceBuSnapshotWebhookDto } from '../dto/request/replace-bu-snapshot-webhook.dto';
import type { UpdateBusinessUnitWebhookDto } from '../dto/request/update-business-unit-webhook.dto';
import { BusinessUnitRepository } from '../repositories/business-unit.repository';

// Builds an ltree path by appending a lowercase code to the parent path
function buildLtreePath(parentPath: string | null, code: string): string {
  const label = code.toLowerCase();
  return parentPath ? `${parentPath}.${label}` : label;
}

@Injectable()
export class BusinessUnitService {
  private readonly logger = new Logger(BusinessUnitService.name);

  constructor(
    private readonly businessUnitRepository: BusinessUnitRepository,
    private readonly buContextCache: BuContextCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Creates a business unit, computes depth/path from parent, and updates path with new ID
  async create(orgId: string, dto: CreateBusinessUnitWebhookDto): Promise<BusinessUnitDto> {
    let depth = 0;
    let parentPath: string | null = null;

    // Compute depth and parent path if parent is specified
    if (dto.parentId) {
      const parent = await this.businessUnitRepository.findById(dto.parentId);
      if (!parent) throw new NotFoundException('Parent business unit not found.');
      depth = parent.depth + 1;
      parentPath = parent.path;
    }

    const code = dto.code.toLowerCase();
    const path = buildLtreePath(parentPath, code);

    const bu = await this.businessUnitRepository.create({
      organizationId: orgId,
      parentId: dto.parentId ?? null,
      name: dto.name,
      code,
      type: dto.type as BuType,
      depth,
      path,
      timezone: dto.timezone,
      currencyCode: dto.currencyCode,
      metadata: dto.metadata as BuMetadata,
    });

    this.logger.log(`Created business unit "${dto.name}" (${bu.id}) at path ${path}`);
    return BusinessUnitDto.from(bu);
  }

  // Returns a flat list of business units for an organization
  async findByOrg(orgId: string): Promise<BusinessUnitDto[]> {
    const units = await this.businessUnitRepository.findByOrg(orgId);
    return units.map(BusinessUnitDto.from);
  }

  // Returns a single business unit by ID
  async findById(id: string): Promise<BusinessUnitDto> {
    const bu = await this.businessUnitRepository.findById(id);
    if (!bu) throw new NotFoundException('Business unit not found.');
    return BusinessUnitDto.from(bu);
  }

  // Returns a business unit and all its descendants using path prefix matching
  async findSubtree(id: string): Promise<BusinessUnitDto[]> {
    const bu = await this.businessUnitRepository.findById(id);
    if (!bu) throw new NotFoundException('Business unit not found.');

    const path = bu.path;
    const subtree = await this.businessUnitRepository.findSubtree(path);
    return subtree.map(BusinessUnitDto.from);
  }

  // Updates a business unit's fields
  async update(id: string, dto: UpdateBusinessUnitWebhookDto): Promise<SuccessResponseDto> {
    const bu = await this.businessUnitRepository.findById(id);
    if (!bu) throw new NotFoundException('Business unit not found.');

    await this.businessUnitRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.type && { type: dto.type as BuType }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      ...(dto.currencyCode !== undefined && { currencyCode: dto.currencyCode }),
      ...(dto.metadata !== undefined && { metadata: dto.metadata as BuMetadata }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date(),
    });

    this.buContextCache.invalidate(id);

    // Re-push fresh auth-state to live SSE connections of users in this BU (timezone/currency changed)
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.BU_UPDATED, new BuUpdatedEvent(id));

    this.logger.log(`Updated business unit ${id}`);
    return { success: true, message: 'Business unit updated successfully.' };
  }

  // Replaces the business unit's snapshot (feature catalog). Apps are DERIVED from it — an app is assigned
  // when it owns at least one usable (non-locked) feature.
  async replaceSnapshot(id: string, dto: ReplaceBuSnapshotWebhookDto): Promise<SuccessResponseDto> {
    const bu = await this.businessUnitRepository.findById(id);
    if (!bu) throw new NotFoundException('Business unit not found.');

    const featureCatalog = dto.featureCatalog ?? [];
    const appCodes = [...new Set(featureCatalog.filter((f) => !f.locked).map((f) => f.appCode))];

    await this.businessUnitRepository.update(id, { appCodes, featureCatalog, updatedAt: new Date() });

    this.buContextCache.invalidate(id);
    // Push the refreshed feature set to live SSE connections of users in this BU
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.BU_UPDATED, new BuUpdatedEvent(id));
    this.logger.log(
      `Replaced snapshot for business unit ${id}: ${featureCatalog.length} feature(s), [${appCodes.join(', ')}]`,
    );
    return { success: true, message: 'Business unit snapshot updated successfully.' };
  }

  // Replaces the business unit's feature unlock overlay (null = inherit the full plan)
  async setFeatureUnlocks(id: string, featureUnlocks: BuFeatureUnlocks | null): Promise<SuccessResponseDto> {
    const bu = await this.businessUnitRepository.findById(id);
    if (!bu) throw new NotFoundException('Business unit not found.');

    await this.businessUnitRepository.update(id, { featureUnlocks, updatedAt: new Date() });

    this.buContextCache.invalidate(id);
    // Push the refreshed feature set to live SSE connections of users in this BU
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.BU_UPDATED, new BuUpdatedEvent(id));

    this.logger.log(
      `Set feature unlocks for business unit ${id}: ${featureUnlocks ? `${Object.keys(featureUnlocks).length} feature(s)` : 'inherit full plan'}`,
    );
    return { success: true, message: 'Business unit feature unlocks updated successfully.' };
  }

  // Deletes a business unit after checking it has no children
  async remove(id: string): Promise<SuccessResponseDto> {
    const bu = await this.businessUnitRepository.findById(id);
    if (!bu) throw new NotFoundException('Business unit not found.');

    const childCount = await this.businessUnitRepository.countChildren(id);
    if (childCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Delete',
        detail: `This business unit has ${childCount} child unit(s). Remove or reassign them first.`,
      });
    }

    await this.businessUnitRepository.delete(id);

    this.buContextCache.invalidate(id);
    this.logger.log(`Deleted business unit "${bu.name}" (${id})`);
    return { success: true, message: 'Business unit deleted successfully.' };
  }
}
