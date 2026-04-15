import type { BomDetailDto, BomDto } from '@domain/bom/dto/entity/bom.dto';
import { BomService } from '@domain/bom/services/bom.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, TableViewState } from '@vritti/api-sdk';
import type { CreateBomDto } from './dto/request/create-bom.dto';
import type { UpdateBomDto } from './dto/request/update-bom.dto';

@Controller()
export class BomController {
  private readonly logger = new Logger(BomController.name);

  constructor(private readonly bomService: BomService) {}

  // Returns paginated BOMs for the data table
  @MessagePattern({ cmd: 'bom.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: BomDto[]; count: number }> {
    this.logger.log('bom.table');
    return this.bomService.findForTable(state);
  }

  // Returns paginated BOM options for select dropdowns
  @MessagePattern({ cmd: 'bom.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('bom.select');
    return this.bomService.findForSelect(data);
  }

  // Creates a new BOM with lines
  @MessagePattern({ cmd: 'bom.create' })
  async create(@Payload() dto: CreateBomDto): Promise<BomDetailDto> {
    this.logger.log(`bom.create — name: ${dto.name}`);
    return this.bomService.create(dto);
  }

  // Returns BOM detail with lines
  @MessagePattern({ cmd: 'bom.findById' })
  async findById(@Payload() data: { id: string }): Promise<BomDetailDto> {
    this.logger.log(`bom.findById — id: ${data.id}`);
    return this.bomService.findById(data.id);
  }

  // Updates a BOM and replaces lines if provided
  @MessagePattern({ cmd: 'bom.update' })
  async update(@Payload() data: { id: string } & UpdateBomDto): Promise<BomDetailDto> {
    const { id, ...updateData } = data;
    this.logger.log(`bom.update — id: ${id}`);
    return this.bomService.update(id, updateData);
  }

  // Deletes a BOM (cascades to lines)
  @MessagePattern({ cmd: 'bom.delete' })
  async delete(@Payload() data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`bom.delete — id: ${data.id}`);
    return this.bomService.delete(data.id);
  }
}
