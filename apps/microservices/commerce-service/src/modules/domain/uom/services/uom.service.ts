import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  type CreateResponseDto,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreateUomDto } from '@/modules/uom/dto/request/create-uom.dto';
import type { UpdateUomDto } from '@/modules/uom/dto/request/update-uom.dto';
import { UomDto } from '../dto/entity/uom.dto';
import { UomRepository } from '../repositories/uom.repository';

@Injectable()
export class UomService {
  private readonly logger = new Logger(UomService.name);

  constructor(private readonly uomRepository: UomRepository) {}

  // Returns base units, optionally filtered by search
  async findBaseUnits(search?: string): Promise<UomDto[]> {
    const entities = await this.uomRepository.findBaseUnits(search);
    const referencedIds = await this.uomRepository.findReferencedIds(entities.map((e) => e.id));
    return entities.map((e) => UomDto.from(e, !referencedIds.has(e.id)));
  }

  // Returns all derived units for a given base unit
  async findDerivedUnits(baseUnitId: string): Promise<UomDto[]> {
    const baseUnit = await this.uomRepository.findById(baseUnitId);
    if (!baseUnit) throw new NotFoundException('Base unit not found.');
    const entities = await this.uomRepository.findDerivedUnits(baseUnitId);
    const referencedIds = await this.uomRepository.findReferencedIds(entities.map((e) => e.id));
    return entities.map((e) => UomDto.from(e, !referencedIds.has(e.id)));
  }

  // Returns paginated UOM options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.uomRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupId: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Validates that baseUnitId exists and is not self-referencing
  private async validateBaseUnitId(baseUnitId: string, selfId?: string): Promise<void> {
    if (selfId && baseUnitId === selfId) {
      throw new BadRequestException('A unit of measure cannot reference itself as its base unit.');
    }
    const baseUnit = await this.uomRepository.findById(baseUnitId);
    if (!baseUnit) throw new BadRequestException('The specified base unit does not exist.');
  }

  // Creates a new UOM
  async create(data: CreateUomDto): Promise<CreateResponseDto<UomDto>> {
    if (data.baseUnitId) await this.validateBaseUnitId(data.baseUnitId);

    const entity = await this.uomRepository.create({
      name: data.name,
      symbol: data.symbol,
      baseUnitId: data.baseUnitId ?? null,
      conversionFactor: data.conversionFactor ?? 1,
    });

    this.logger.log(`Created UOM: ${entity.name} (${entity.symbol})`);
    return {
      success: true,
      message: `Unit "${entity.name}" (${entity.symbol}) created successfully.`,
      data: UomDto.from(entity),
    };
  }

  // Finds a UOM by ID or throws NotFoundException
  async findById(id: string): Promise<UomDto> {
    const entity = await this.uomRepository.findById(id);
    if (!entity) throw new NotFoundException('Unit of measure not found.');
    return UomDto.from(entity);
  }

  // Updates a UOM
  async update(id: string, data: UpdateUomDto): Promise<SuccessResponseDto> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');
    if (data.baseUnitId) await this.validateBaseUnitId(data.baseUnitId, id);
    await this.uomRepository.update(id, data);
    this.logger.log(`Updated UOM: ${existing.name} (${existing.symbol})`);
    return { success: true, message: `Unit "${existing.name}" updated successfully.` };
  }

  // Deletes a UOM by ID; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');
    const refs = await this.uomRepository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.inventoryItems, 'inventory item'],
      [refs.supplierItems, 'supplier item'],
      [refs.derivedUnits, 'derived unit'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Unit In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }
    await this.uomRepository.delete(id);
    this.logger.log(`Deleted UOM: ${existing.name} (${id})`);
    return { success: true, message: `Unit "${existing.name}" deleted successfully.` };
  }
}
