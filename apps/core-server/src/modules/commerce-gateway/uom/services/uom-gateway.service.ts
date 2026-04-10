import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
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

  // Returns paginated, filtered, and sorted UOMs for the data table
  async findForTable(userId: string): Promise<UomTableResponseDto> {
    this.logger.log('uom.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-uom');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: UomResponseDto[]; count: number }>(
      'commerce',
      'uom.table',
      {
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated UOM options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('uom.select');
    return this.nats.send('commerce', 'uom.select', params);
  }

  // Creates a new UOM
  async create(dto: CreateUomDto): Promise<UomResponseDto> {
    this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
    return this.nats.send('commerce', 'uom.create', dto);
  }

  // Finds a UOM by ID
  async findById(id: string): Promise<UomResponseDto> {
    this.logger.log(`uom.findById — id: ${id}`);
    return this.nats.send('commerce', 'uom.findById', { id });
  }

  // Updates a UOM by ID
  async update(id: string, dto: UpdateUomDto): Promise<UomResponseDto> {
    this.logger.log(`uom.update — id: ${id}`);
    return this.nats.send('commerce', 'uom.update', { id, ...dto });
  }

  // Deletes a UOM by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`uom.delete — id: ${id}`);
    return this.nats.send('commerce', 'uom.delete', { id });
  }
}
