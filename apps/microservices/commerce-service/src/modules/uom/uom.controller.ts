import type { UomDto } from '@domain/uom/dto/entity/uom.dto';
import { UomService } from '@domain/uom/services/uom.service';
import type { UomDimensionDto } from '@domain/uom-dimensions/dto/entity/uom-dimension.dto';
import { UomDimensionsService } from '@domain/uom-dimensions/services/uom-dimensions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  type CreateResponseDto,
  RpcBuId,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import type { CreateUomDto } from './dto/request/create-uom.dto';
import type { UpdateUomDto } from './dto/request/update-uom.dto';

@Controller()
export class UomController {
  private readonly logger = new Logger(UomController.name);

  constructor(
    private readonly uomService: UomService,
    private readonly uomDimensionsService: UomDimensionsService,
  ) {}

  // Returns paginated UOMs for the data table (scoped to a dimension)
  @MessagePattern({ cmd: 'uom.table' })
  async table(
    @Payload() state: TableViewState & { dimensionId: string },
    @RpcBuId() buId: string,
  ): Promise<{ result: UomDto[]; count: number }> {
    this.logger.log(`uom.table — dimensionId: ${state.dimensionId}`);
    return this.uomService.findForTable(state, buId);
  }

  // Returns base units, optionally filtered by search
  @MessagePattern({ cmd: 'uom.base' })
  async base(@Payload() data: { search?: string }, @RpcBuId() buId: string): Promise<UomDto[]> {
    this.logger.log('uom.base');
    return this.uomService.findBaseUnits(data.search, buId);
  }

  // Returns derived units for a given base unit
  @MessagePattern({ cmd: 'uom.derived' })
  async derived(@Payload() data: { baseUnitId: string }, @RpcBuId() buId: string): Promise<UomDto[]> {
    this.logger.log(`uom.derived — baseUnitId: ${data.baseUnitId}`);
    return this.uomService.findDerivedUnits(data.baseUnitId, buId);
  }

  // Returns paginated UOM options for the select component
  @MessagePattern({ cmd: 'uom.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('uom.select');
    return this.uomService.findForSelect(data);
  }

  // Creates a new UOM
  @MessagePattern({ cmd: 'uom.create' })
  async create(@Payload() dto: CreateUomDto, @RpcBuId() buId: string): Promise<CreateResponseDto<UomDto>> {
    this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
    // Validate dimension exists; throws NotFoundException when missing
    await this.assertDimensionExists(dto.dimensionId, buId);
    return this.uomService.create(dto);
  }

  // Finds a UOM by ID
  @MessagePattern({ cmd: 'uom.findById' })
  async findById(@Payload() data: { id: string }, @RpcBuId() buId: string): Promise<UomDto> {
    this.logger.log(`uom.findById — id: ${data.id}`);
    return this.uomService.findById(data.id, buId);
  }

  // Updates a UOM by ID
  @MessagePattern({ cmd: 'uom.update' })
  async update(@Payload() data: { id: string } & UpdateUomDto, @RpcBuId() buId: string): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`uom.update — id: ${id}`);
    if (updateData.dimensionId) {
      await this.assertDimensionExists(updateData.dimensionId, buId);
    }
    return this.uomService.update(id, updateData);
  }

  // Deletes a UOM by ID
  @MessagePattern({ cmd: 'uom.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`uom.delete — id: ${data.id}`);
    return this.uomService.delete(data.id);
  }

  // Cross-domain validation helper: ensures the referenced dimension exists
  private async assertDimensionExists(dimensionId: string, buId: string): Promise<UomDimensionDto> {
    return this.uomDimensionsService.findById(dimensionId, buId);
  }
}
