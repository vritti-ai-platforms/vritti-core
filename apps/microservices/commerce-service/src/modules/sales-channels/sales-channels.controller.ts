import { SalesChannelDto } from '@domain/sales-channels/dto/entity/sales-channel.dto';
import { SalesChannelsService } from '@domain/sales-channels/services/sales-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import type { CreateSalesChannelDto } from './dto/request/create-sales-channel.dto';
import type { UpdateSalesChannelDto } from './dto/request/update-sales-channel.dto';

@Controller()
export class SalesChannelsController {
  private readonly logger = new Logger(SalesChannelsController.name);

  constructor(private readonly service: SalesChannelsService) {}

  @MessagePattern({ cmd: 'salesChannels.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: SalesChannelDto[]; count: number }> {
    this.logger.log('salesChannels.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'salesChannels.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('salesChannels.select');
    return this.service.findForSelect(data);
  }

  @MessagePattern({ cmd: 'salesChannels.create' })
  async create(@Payload() dto: CreateSalesChannelDto): Promise<CreateResponseDto<SalesChannelDto>> {
    this.logger.log(`salesChannels.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'salesChannels.findById' })
  async findById(@Payload() data: { id: string }): Promise<SalesChannelDto> {
    this.logger.log(`salesChannels.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'salesChannels.update' })
  async update(@Payload() data: { id: string } & UpdateSalesChannelDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = data;
    this.logger.log(`salesChannels.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'salesChannels.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`salesChannels.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
