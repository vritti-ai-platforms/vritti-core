import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { BuMetadata, BuType } from '@/db/schema';
import { BusinessUnitDto } from '../dto/entity/business-unit.dto';
import type { CreateBusinessUnitWebhookDto } from '../dto/request/create-business-unit-webhook.dto';
import type { UpdateBuAppsWebhookDto } from '../dto/request/update-bu-apps-webhook.dto';
import type { UpdateBusinessUnitWebhookDto } from '../dto/request/update-business-unit-webhook.dto';
import { BuContextCacheService } from '@/common/services/bu-context-cache.service';
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
      ...(dto.metadata !== undefined && { metadata: dto.metadata as BuMetadata }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date(),
    });

    this.buContextCache.invalidate(id);
    this.logger.log(`Updated business unit ${id}`);
    return { success: true, message: 'Business unit updated successfully.' };
  }

  // Sets the assigned apps for a business unit
  async updateApps(id: string, dto: UpdateBuAppsWebhookDto): Promise<SuccessResponseDto> {
    const bu = await this.businessUnitRepository.findById(id);
    if (!bu) throw new NotFoundException('Business unit not found.');

    this.logger.log(`updateApps — appCodes: ${JSON.stringify(dto.appCodes)}`);

    await this.businessUnitRepository.update(id, {
      appCodes: dto.appCodes,
      updatedAt: new Date(),
    });

    this.buContextCache.invalidate(id);
    this.logger.log(`Updated apps for business unit ${id}: [${dto.appCodes.join(', ')}]`);
    return { success: true, message: 'Business unit apps updated successfully.' };
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
