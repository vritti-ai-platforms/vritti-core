import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreateStorageLocationDto } from '@/modules/storage-locations/dto/request/create-storage-location.dto';
import type { UpdateStorageLocationDto } from '@/modules/storage-locations/dto/request/update-storage-location.dto';
import { StorageLocationDto, LocationStockDto } from '../dto/entity/storage-location.dto';
import { StorageLocationsRepository } from '../repositories/storage-locations.repository';

@Injectable()
export class StorageLocationsService {
  private readonly logger = new Logger(StorageLocationsService.name);

  constructor(private readonly storageLocationsRepository: StorageLocationsRepository) {}

  // Returns all storage locations with canDelete computed
  async findAll(): Promise<StorageLocationDto[]> {
    const entities = await this.storageLocationsRepository.findAll();
    const referencedIds = await this.storageLocationsRepository.findReferencedIds(entities.map((e) => e.id));
    return entities.map((e) => StorageLocationDto.from(e, !referencedIds.has(e.id)));
  }

  // Returns a single storage location by ID with canDelete computed
  async findById(id: string): Promise<StorageLocationDto> {
    const entity = await this.storageLocationsRepository.findById(id);
    if (!entity) throw new NotFoundException('Storage location not found.');
    const refs = await this.storageLocationsRepository.countReferences(id);
    return StorageLocationDto.from(entity, refs.inventoryLevels === 0);
  }

  // Returns stock levels at a location
  async findLevels(locationId: string): Promise<LocationStockDto[]> {
    const entity = await this.storageLocationsRepository.findById(locationId);
    if (!entity) throw new NotFoundException('Storage location not found.');
    const rows = await this.storageLocationsRepository.findLevelsByLocationId(locationId);
    return rows.map((row) => LocationStockDto.from(row));
  }

  // Returns paginated location options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.storageLocationsRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      groupId: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderBy: { name: 'asc' },
    });
  }

  // Creates a new storage location
  async create(data: CreateStorageLocationDto): Promise<CreateResponseDto<StorageLocationDto>> {
    const entity = await this.storageLocationsRepository.create({
      name: data.name,
      code: data.code,
      area: data.area || null,
      managerId: data.managerId ?? null,
      address: data.address || null,
      isActive: data.isActive,
    });
    this.logger.log(`Created storage location: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Storage location "${entity.name}" (${entity.code}) created successfully.`,
      data: StorageLocationDto.from(entity),
    };
  }

  // Updates an storage location by ID
  async update(id: string, data: UpdateStorageLocationDto): Promise<SuccessResponseDto> {
    const existing = await this.storageLocationsRepository.findById(id);
    if (!existing) throw new NotFoundException('Storage location not found.');
    await this.storageLocationsRepository.update(id, {
      ...data,
      area: data.area !== undefined ? data.area || null : undefined,
      address: data.address !== undefined ? data.address || null : undefined,
    });
    this.logger.log(`Updated storage location: ${existing.name} (${id})`);
    return { success: true, message: `Storage location "${existing.name}" updated successfully.` };
  }

  // Deletes an storage location by ID; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.storageLocationsRepository.findById(id);
    if (!existing) throw new NotFoundException('Storage location not found.');
    const refs = await this.storageLocationsRepository.countReferences(id);
    const refLabels: [number, string][] = [[refs.inventoryLevels, 'inventory level']];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Storage Location In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }
    await this.storageLocationsRepository.delete(id);
    this.logger.log(`Deleted storage location: ${existing.name} (${id})`);
    return { success: true, message: `Storage location "${existing.name}" deleted successfully.` };
  }
}
