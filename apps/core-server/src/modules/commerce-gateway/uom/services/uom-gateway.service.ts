import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  DataTableStateService,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateUomDto } from '../dto/request/create-uom.dto';
import type { UpdateUomDto } from '../dto/request/update-uom.dto';
import type { UomResponseDto } from '../dto/response/uom-response.dto';
import type { UomTableResponseDto } from '../dto/response/uom-table-response.dto';

@Injectable()
export class UomGatewayService {
  private readonly logger = new Logger(UomGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated UOM options for select dropdowns
  async select(
    params: SelectOptionsQueryDto & { derivedOnly?: boolean; baseOnly?: boolean; dimensionId?: string },
  ): Promise<SelectQueryResult> {
    this.logger.log('uom.select');
    return this.nats.send('commerce', 'uom.select', params);
  }

  // Returns paginated UOMs for the data table, scoped to a dimension
  async findForTable(userId: string, dimensionId: string): Promise<UomTableResponseDto> {
    this.logger.log(`uom.table — dimensionId: ${dimensionId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-uom-${dimensionId}`,
    );

    const { result, count } = await this.nats.send<{ result: UomResponseDto[]; count: number }>(
      'commerce',
      'uom.table',
      { ...state, dimensionId },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new UOM
  async create(dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
    this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
    return this.nats.send('commerce', 'uom.create', dto);
  }

  // Updates a UOM by ID
  async update(id: string, dto: UpdateUomDto): Promise<SuccessResponseDto> {
    this.logger.log(`uom.update — id: ${id}`);
    return this.nats.send('commerce', 'uom.update', { id, ...dto });
  }

  // Deletes a UOM by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`uom.delete — id: ${id}`);
    return this.nats.send('commerce', 'uom.delete', { id });
  }
}
