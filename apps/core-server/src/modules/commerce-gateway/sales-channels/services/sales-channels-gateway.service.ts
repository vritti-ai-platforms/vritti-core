import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  DataTableStateService,
  NatsClientService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreateSalesChannelDto } from '../dto/request/create-sales-channel.dto';
import type { UpdateSalesChannelDto } from '../dto/request/update-sales-channel.dto';
import type { SalesChannelResponseDto } from '../dto/response/sales-channel-response.dto';
import type { SalesChannelTableResponseDto } from '../dto/response/sales-channel-table-response.dto';

@Injectable()
export class SalesChannelsGatewayService {
  private readonly logger = new Logger(SalesChannelsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted sales channels for the data table
  async findForTable(userId: string): Promise<SalesChannelTableResponseDto> {
    this.logger.log('salesChannels.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-sales-channels');

    const { result, count } = await this.nats.send<{ result: SalesChannelResponseDto[]; count: number }>(
      'commerce',
      'salesChannels.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns sales channel options for select dropdowns
  select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('salesChannels.select');
    return this.nats.send('commerce', 'salesChannels.select', params);
  }

  // Creates a new sales channel
  create(dto: CreateSalesChannelDto): Promise<CreateResponseDto<SalesChannelResponseDto>> {
    this.logger.log(`salesChannels.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.nats.send('commerce', 'salesChannels.create', dto);
  }

  // Finds a sales channel by ID
  findById(id: string): Promise<SalesChannelResponseDto> {
    this.logger.log(`salesChannels.findById — id: ${id}`);
    return this.nats.send('commerce', 'salesChannels.findById', { id });
  }

  // Updates a sales channel by ID
  update(id: string, dto: UpdateSalesChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`salesChannels.update — id: ${id}`);
    return this.nats.send('commerce', 'salesChannels.update', { id, ...dto });
  }

  // Deletes a sales channel by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`salesChannels.delete — id: ${id}`);
    return this.nats.send('commerce', 'salesChannels.delete', { id });
  }
}
