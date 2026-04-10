import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService } from '@vritti/api-sdk';
import type { CreateConversionDto } from '../dto/request/create-conversion.dto';
import type { ConversionDetailResponseDto } from '../dto/response/conversion-response.dto';
import type { ConversionTableResponseDto } from '../dto/response/conversion-table-response.dto';

@Injectable()
export class ConversionsGatewayService {
  private readonly logger = new Logger(ConversionsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted conversions for the data table
  async findForTable(userId: string): Promise<ConversionTableResponseDto> {
    this.logger.log('conversions.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-conversions');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: ConversionDetailResponseDto[]; count: number }>(
      'commerce',
      'conversions.table',
      {
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new conversion
  async create(dto: CreateConversionDto): Promise<ConversionDetailResponseDto> {
    this.logger.log('conversions.create');
    return this.nats.send('commerce', 'conversions.create', dto);
  }

  // Finds a conversion by ID
  async findById(id: string): Promise<ConversionDetailResponseDto> {
    this.logger.log(`conversions.findById — id: ${id}`);
    return this.nats.send('commerce', 'conversions.findById', { id });
  }

  // Completes a conversion
  async complete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`conversions.complete — id: ${id}`);
    return this.nats.send('commerce', 'conversions.complete', { id });
  }
}
