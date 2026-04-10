import type { UomDto } from '@domain/uom/dto/entity/uom.dto';
import { UomService } from '@domain/uom/services/uom.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SelectQueryResult, SortCondition } from '@vritti/api-sdk';
import type { CreateUomDto } from './dto/request/create-uom.dto';
import type { UpdateUomDto } from './dto/request/update-uom.dto';

@Controller()
export class UomController {
  private readonly logger = new Logger(UomController.name);

  constructor(private readonly uomService: UomService) {}

  // Returns paginated, filtered, and sorted UOMs for the data table
  @MessagePattern({ cmd: 'uom.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: UomDto[]; count: number }> {
    this.logger.log('uom.table');
    return this.uomService.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  // Returns paginated UOM options for the select component
  @MessagePattern({ cmd: 'uom.select' })
  async select(
    @Payload() data: { search?: string; limit?: number; offset?: number; values?: string; excludeIds?: string },
  ): Promise<SelectQueryResult> {
    this.logger.log('uom.select');
    return this.uomService.findForSelect(data);
  }

  // Creates a new UOM
  @MessagePattern({ cmd: 'uom.create' })
  async create(@Payload() dto: CreateUomDto): Promise<UomDto> {
    this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
    return this.uomService.create(dto);
  }

  // Finds a UOM by ID
  @MessagePattern({ cmd: 'uom.findById' })
  async findById(@Payload() data: { id: string }): Promise<UomDto> {
    this.logger.log(`uom.findById — id: ${data.id}`);
    return this.uomService.findById(data.id);
  }

  // Updates a UOM by ID
  @MessagePattern({ cmd: 'uom.update' })
  async update(@Payload() data: { id: string } & UpdateUomDto): Promise<UomDto> {
    const { id, ...updateData } = data;
    this.logger.log(`uom.update — id: ${id}`);
    return this.uomService.update(id, updateData);
  }

  // Deletes a UOM by ID
  @MessagePattern({ cmd: 'uom.delete' })
  async delete(@Payload() data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`uom.delete — id: ${data.id}`);
    return this.uomService.delete(data.id);
  }
}
