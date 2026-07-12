import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
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

  // Keyset/cursor Relay connection of a dimension's units for the mobile infinite feed (GraphQL-only).
  async findForFeed(query: { dimensionId: string; limit?: number; cursor?: string }): Promise<{
    edges: { cursor: string; node: UomResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`uom.feed — dimensionId: ${query.dimensionId}`);
    return this.nats.send('commerce', 'org.uom.feed', query);
  }

  // Returns a single UOM by ID
  async findById(id: string): Promise<UomResponseDto> {
    this.logger.log(`uom.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.uom.findById', { id });
  }

  // Returns base units, optionally filtered by search
  async findBaseUnits(search?: string): Promise<UomResponseDto[]> {
    this.logger.log('uom.base');
    return this.nats.send('commerce', 'org.uom.base', { search });
  }

  // Returns derived units for a given base unit
  async findDerivedUnits(baseUnitId: string): Promise<UomResponseDto[]> {
    this.logger.log(`uom.derived — baseUnitId: ${baseUnitId}`);
    return this.nats.send('commerce', 'org.uom.derived', { baseUnitId });
  }

  // Returns paginated UOM options for select dropdowns
  async select(
    params: SelectOptionsQueryDto & { derivedOnly?: boolean; baseOnly?: boolean; dimensionId?: string },
  ): Promise<SelectQueryResult> {
    this.logger.log('uom.select');
    return this.nats.send('commerce', 'org.uom.select', params);
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
      'org.uom.table',
      { ...state, dimensionId },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new UOM
  async create(dto: CreateUomDto): Promise<CreateResponseDto<UomResponseDto>> {
    this.logger.log(`uom.create — name: ${dto.name}, symbol: ${dto.symbol}`);
    return this.nats.send('commerce', 'org.uom.create', dto);
  }

  // Updates a UOM by ID
  async update(id: string, dto: UpdateUomDto): Promise<SuccessResponseDto> {
    this.logger.log(`uom.update — id: ${id}`);
    return this.nats.send('commerce', 'org.uom.update', { id, ...dto });
  }

  // Deletes a UOM by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`uom.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.uom.delete', { id });
  }
}
