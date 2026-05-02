import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreateUomDimensionDto } from '@/modules/uom-dimensions/dto/request/create-uom-dimension.dto';
import type { UpdateUomDimensionDto } from '@/modules/uom-dimensions/dto/request/update-uom-dimension.dto';
import { UomDimensionDto } from '../dto/entity/uom-dimension.dto';
import { UomDimensionsRepository } from '../repositories/uom-dimensions.repository';

@Injectable()
export class UomDimensionsService {
  private readonly logger = new Logger(UomDimensionsService.name);

  constructor(private readonly repository: UomDimensionsRepository) {}

  // Returns all dimensions, optionally filtered by name or code
  async list(search?: string): Promise<UomDimensionDto[]> {
    const rows = await this.repository.findAllOrSearch(search);
    return rows.map((r) => UomDimensionDto.from(r));
  }

  // Returns paginated dimension options for the select component
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Finds a dimension by ID or throws NotFoundException
  async findById(id: string): Promise<UomDimensionDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('UOM dimension not found.');
    const refs = await this.repository.countReferences(id);
    return UomDimensionDto.from(entity, refs.inventoryItems === 0 && refs.supplierItems === 0);
  }

  // Creates a new UOM dimension
  async create(data: CreateUomDimensionDto): Promise<CreateResponseDto<UomDimensionDto>> {
    const entity = await this.repository.create({
      code: data.code,
      name: data.name,
      description: data.description ?? null,
    });
    this.logger.log(`Created UOM dimension: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Dimension "${entity.name}" created successfully.`,
      data: UomDimensionDto.from(entity, true),
    };
  }

  // Updates a UOM dimension
  async update(id: string, data: UpdateUomDimensionDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM dimension not found.');

    const updated = await this.repository.update(id, data);
    this.logger.log(`Updated UOM dimension: ${updated.name} (${updated.code})`);
    return { success: true, message: `Dimension "${updated.name}" updated successfully.` };
  }

  // Deletes a UOM dimension; cascades all UOMs in it.
  // Blocked if any UOM in the dimension is referenced by an inventory item or supplier item.
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM dimension not found.');

    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.inventoryItems, 'inventory item'],
      [refs.supplierItems, 'supplier item'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Dimension In Use',
        detail: `Cannot delete "${existing.name}" — its units are referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.repository.transaction(async (tx) => {
      await this.repository.deleteUomsByDimensionId(tx, id);
      await this.repository.delete(id, tx);
    });
    this.logger.log(`Deleted UOM dimension: ${existing.name} (${id}) and cascaded its units`);
    return { success: true, message: `Dimension "${existing.name}" deleted successfully.` };
  }
}
