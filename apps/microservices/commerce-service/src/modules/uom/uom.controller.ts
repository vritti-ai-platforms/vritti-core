import type { UomDto } from '@domain/uom/dto/entity/uom.dto';
import { UomService } from '@domain/uom/services/uom.service';
import type { UomDimensionDto } from '@domain/uom-dimensions/dto/entity/uom-dimension.dto';
import { UomDimensionsService } from '@domain/uom-dimensions/services/uom-dimensions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import { RpcSiteId } from '@vritti/api-sdk/nats';
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
    @RpcSiteId() siteId: string,
  ): Promise<{ result: UomDto[]; count: number }> {
    this.logger.log(`uom.table — dimensionId: ${state.dimensionId}`);
    return this.uomService.findForTable(state, siteId);
  }

  // Returns paginated UOM options for the select component
  @MessagePattern({ cmd: 'uom.select' })
  async select(
    @Payload()
    data: SelectOptionsQueryDto & {
      derivedOnly?: boolean;
      baseOnly?: boolean;
      dimensionId?: string;
      inventoryItemId?: string;
      supplierId?: string;
      purchaseOrderId?: string;
    },
  ): Promise<SelectQueryResult> {
    this.logger.log('uom.select');
    return this.uomService.findForSelect(data, {
      derivedOnly: data.derivedOnly,
      baseOnly: data.baseOnly,
      dimensionId: data.dimensionId,
      inventoryItemId: data.inventoryItemId,
      supplierId: data.supplierId,
      purchaseOrderId: data.purchaseOrderId,
    });
  }

  // Creates a new UOM
  @MessagePattern({ cmd: 'uom.create' })
  async create(@Payload() dto: CreateUomDto): Promise<CreateResponseDto<UomDto>> {
    this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
    // Validate dimension exists; throws NotFoundException when missing
    await this.assertDimensionExists(dto.dimensionId);
    return this.uomService.create(dto);
  }

  // Finds a UOM by ID
  @MessagePattern({ cmd: 'uom.findById' })
  async findById(@Payload() data: { id: string }, @RpcSiteId() siteId: string): Promise<UomDto> {
    this.logger.log(`uom.findById — id: ${data.id}`);
    return this.uomService.findById(data.id, siteId);
  }

  // Updates a UOM by ID
  @MessagePattern({ cmd: 'uom.update' })
  async update(@Payload() data: { id: string } & UpdateUomDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`uom.update — id: ${id}`);
    if (updateData.dimensionId) {
      await this.assertDimensionExists(updateData.dimensionId);
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
  private async assertDimensionExists(dimensionId: string): Promise<UomDimensionDto> {
    return this.uomDimensionsService.findById(dimensionId);
  }
}
