import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk';
import { NatsClientService } from '@vritti/api-sdk/nats';
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

    const { result, count } = await this.nats.send<{ result: ConversionDetailResponseDto[]; count: number }>(
      'commerce',
      'conversions.table',
      state,
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

  // Completes a conversion and adjusts inventory at the given location
  async complete(id: string, locationId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`conversions.complete — id: ${id}`);
    return this.nats.send('commerce', 'conversions.complete', { id, locationId });
  }
}
