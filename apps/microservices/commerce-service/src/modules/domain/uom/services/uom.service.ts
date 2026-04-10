import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import { UomDto } from '../dto/entity/uom.dto';
import type { CreateUomDto } from '@/modules/uom/dto/request/create-uom.dto';
import type { UpdateUomDto } from '@/modules/uom/dto/request/update-uom.dto';
import { UomRepository } from '../repositories/uom.repository';

@Injectable()
export class UomService {
  private readonly logger = new Logger(UomService.name);

  constructor(private readonly uomRepository: UomRepository) {}

  // Returns base units, optionally filtered by search
  async findBaseUnits(search?: string): Promise<UomDto[]> {
    const entities = await this.uomRepository.findBaseUnits(search);
    return entities.map((e) => UomDto.from(e));
  }

  // Returns all derived units for a given base unit
  async findDerivedUnits(baseUnitId: string): Promise<UomDto[]> {
    const baseUnit = await this.uomRepository.findById(baseUnitId);
    if (!baseUnit) throw new NotFoundException('Base unit not found.');
    const entities = await this.uomRepository.findDerivedUnits(baseUnitId);
    return entities.map((e) => UomDto.from(e, baseUnit.symbol));
  }

  // Returns paginated UOM options for select dropdowns
  findForSelect(params: {
    search?: string;
    limit?: number;
    offset?: number;
    values?: string;
    excludeIds?: string;
  }): Promise<SelectQueryResult> {
    return this.uomRepository.findForSelect({
      value: 'id',
      label: 'name',
      search: params.search,
      limit: params.limit,
      offset: params.offset,
      values: params.values,
      excludeIds: params.excludeIds,
      orderBy: { name: 'asc' },
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
      conversionFactor: String(data.conversionFactor ?? 1),
    });

    let baseSymbol: string | null = null;
    if (entity.baseUnitId) {
      const base = await this.uomRepository.findById(entity.baseUnitId);
      baseSymbol = base?.symbol ?? null;
    }

    this.logger.log(`Created UOM: ${entity.name} (${entity.symbol})`);
    return { success: true, message: 'Unit of measure created successfully.', data: UomDto.from(entity, baseSymbol) };
  }

  // Finds a UOM by ID or throws NotFoundException
  async findById(id: string): Promise<UomDto> {
    const entity = await this.uomRepository.findById(id);
    if (!entity) throw new NotFoundException('Unit of measure not found.');

    let baseSymbol: string | null = null;
    if (entity.baseUnitId) {
      const base = await this.uomRepository.findById(entity.baseUnitId);
      baseSymbol = base?.symbol ?? null;
    }

    return UomDto.from(entity, baseSymbol);
  }

  // Updates a UOM
  async update(id: string, data: UpdateUomDto): Promise<SuccessResponseDto> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');

    if (data.baseUnitId) await this.validateBaseUnitId(data.baseUnitId, id);

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.symbol !== undefined) updatePayload.symbol = data.symbol;
    if (data.baseUnitId !== undefined) updatePayload.baseUnitId = data.baseUnitId;
    if (data.conversionFactor !== undefined) updatePayload.conversionFactor = String(data.conversionFactor);

    if (Object.keys(updatePayload).length > 0) {
      await this.uomRepository.update(id, updatePayload);
    }

    this.logger.log(`Updated UOM: ${existing.name} (${existing.symbol})`);
    return { success: true, message: 'Unit of measure updated successfully.' };
  }

  // Deletes a UOM by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');
    await this.uomRepository.delete(id);
    this.logger.log(`Deleted UOM: ${id}`);
    return { success: true, message: 'Unit of measure deleted successfully.' };
  }
}
