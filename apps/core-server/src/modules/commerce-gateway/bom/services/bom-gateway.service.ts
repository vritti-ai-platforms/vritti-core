import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import type { CreateBomDto } from '../dto/request/create-bom.dto';
import type { UpdateBomDto } from '../dto/request/update-bom.dto';
import type { BomDetailResponseDto, BomResponseDto } from '../dto/response/bom-response.dto';
import type { BomTableResponseDto } from '../dto/response/bom-table-response.dto';

@Injectable()
export class BomGatewayService {
  private readonly logger = new Logger(BomGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated BOMs for the data table
  async findForTable(userId: string): Promise<BomTableResponseDto> {
    this.logger.log('bom.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-bom');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: BomResponseDto[]; count: number }>(
      'commerce',
      'bom.table',
      {
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated BOM options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('bom.select');
    return this.nats.send('commerce', 'bom.select', params);
  }

  // Creates a new BOM with lines
  async create(dto: CreateBomDto): Promise<BomDetailResponseDto> {
    this.logger.log(`bom.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'bom.create', dto);
  }

  // Returns BOM detail with lines
  async findById(id: string): Promise<BomDetailResponseDto> {
    this.logger.log(`bom.findById — id: ${id}`);
    return this.nats.send('commerce', 'bom.findById', { id });
  }

  // Updates a BOM and replaces lines if provided
  async update(id: string, dto: UpdateBomDto): Promise<BomDetailResponseDto> {
    this.logger.log(`bom.update — id: ${id}`);
    return this.nats.send('commerce', 'bom.update', { id, ...dto });
  }

  // Deletes a BOM (cascades to lines)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`bom.delete — id: ${id}`);
    return this.nats.send('commerce', 'bom.delete', { id });
  }
}
