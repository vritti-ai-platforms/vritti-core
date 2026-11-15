import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import { type StorageType, storageTypes } from '@/db/schema';
import { StorageTypeDto } from '../dto/entity/storage-type.dto';
import type { StorageTypeLimitDto } from '../dto/entity/storage-type-limit.dto';
import type { CreateStorageTypeDto } from '../dto/request/create-storage-type.dto';
import type { UpdateStorageTypeDto } from '../dto/request/update-storage-type.dto';
import { StorageTypesDomainRepository, type StorageTypeWithUsage } from '../repositories/storage-types.repository';

@Injectable()
export class StorageTypesDomainService {
  private readonly logger = new Logger(StorageTypesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    code: { column: storageTypes.code, type: 'string' },
    name: { column: storageTypes.name, type: 'string' },
    maxWeight: { column: storageTypes.maxWeight, type: 'number' },
    maxVolume: { column: storageTypes.maxVolume, type: 'number' },
    capacityCheck: { column: storageTypes.capacityCheck, type: 'string' },
    allowMixedItems: { column: storageTypes.allowMixedItems, type: 'boolean' },
    allowMixedBatches: { column: storageTypes.allowMixedBatches, type: 'boolean' },
    allowAdditionToStock: { column: storageTypes.allowAdditionToStock, type: 'boolean' },
    isActive: { column: storageTypes.isActive, type: 'boolean' },
  };

  // Search runs ILIKE, which Postgres enums (capacityCheck) don't support — so it only covers the text columns
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    code: StorageTypesDomainService.FIELD_MAP.code,
    name: StorageTypesDomainService.FIELD_MAP.name,
  };

  constructor(private readonly repository: StorageTypesDomainRepository) {}

  // Returns paginated storage types for the data table
  async findForTable(state: TableState): Promise<{ result: StorageTypeDto[]; count: number }> {
    const fieldMap = StorageTypesDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findForTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, StorageTypesDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(storageTypes.name)],
      limit,
      offset,
    });
    return { result: result.map((row) => StorageTypeDto.from(row)), count };
  }

  // Returns active storage type options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'code',
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      searchKeys: ['name', 'code'],
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      where: { isActive: true },
    });
  }

  // Returns a storage type with its location and item counts
  async findById(id: string): Promise<StorageTypeDto> {
    return StorageTypeDto.from(await this.findDetailOrThrow(id));
  }

  // Returns the name and weight/volume maxima of the given storage types, for location fill
  findLimitsByIds(ids: string[]): Promise<StorageTypeLimitDto[]> {
    return this.repository.findLimitsByIds(ids);
  }

  // Loads a storage type a location or an item may be assigned to, rejecting a missing or inactive one on the field
  async requireAssignable(id: string, field: string): Promise<StorageType> {
    const storageType = await this.repository.findById(id);
    if (storageType?.isActive) return storageType;
    throw new BadRequestException({
      label: storageType ? 'Storage Type Inactive' : 'Storage Type Not Found',
      detail: storageType
        ? `"${storageType.name}" is inactive. Activate it or pick another storage type.`
        : 'The selected storage type does not exist. Pick another storage type.',
      errors: [{ field, message: storageType ? 'Storage type inactive' : 'Storage type not found' }],
    });
  }

  // Creates a storage type with a code unique in the org
  async create(data: CreateStorageTypeDto): Promise<CreateResponseDto<StorageTypeDto>> {
    await this.assertCodeFree(data.code);
    const entity = await this.repository.create(data);
    this.logger.log(`Created storage type: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Storage type "${entity.name}" (${entity.code}) created successfully.`,
      data: StorageTypeDto.from({ ...entity, locationCount: 0, itemCount: 0 }),
    };
  }

  // Updates a storage type's code, name, limits or rules
  async update(id: string, data: Omit<UpdateStorageTypeDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.findDetailOrThrow(id);
    if (data.code !== undefined && data.code !== existing.code) await this.assertCodeFree(data.code, id);
    const updated = await this.repository.update(id, data);
    this.logger.log(`Updated storage type: ${updated.name} (${id})`);
    return { success: true, message: `Storage type "${updated.name}" updated successfully.` };
  }

  // Deletes a storage type no location or item × storage type row references
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.findDetailOrThrow(id);
    const references: [number, string][] = [
      [Number(existing.locationCount), 'location'],
      [Number(existing.itemCount), 'inventory item'],
    ];
    const parts = references.filter(([n]) => n > 0).map(([n, label]) => pluralize(label, n, true));
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Storage Type In Use',
        detail: `"${existing.name}" is used by ${parts.join(' and ')}. Move them to another storage type first.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted storage type: ${existing.name} (${id})`);
    return { success: true, message: `Storage type "${existing.name}" deleted successfully.` };
  }

  // Loads a storage type with its reference counts, throwing when it is out of reach
  private async findDetailOrThrow(id: string): Promise<StorageTypeWithUsage> {
    const storageType = await this.repository.findDetail(id);
    if (!storageType) throw new NotFoundException('Storage type not found.');
    return storageType;
  }

  // Codes are unique per org
  private async assertCodeFree(code: string, excludeId?: string): Promise<void> {
    if (!(await this.repository.isCodeTaken(code, excludeId))) return;
    throw new ConflictException({
      label: 'Duplicate Code',
      detail: `The code "${code}" is already used by another storage type in this organization.`,
      errors: [{ field: 'code', message: 'Code already in use' }],
    });
  }
}
