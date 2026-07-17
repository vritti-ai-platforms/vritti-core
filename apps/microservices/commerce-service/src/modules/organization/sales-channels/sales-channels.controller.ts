import { SalesChannelDto } from '@domain/sales-channels/dto/entity/sales-channel.dto';
import { SalesChannelsService } from '@domain/sales-channels/services/sales-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import { CreateSalesChannelDto } from './dto/request/create-sales-channel.dto';
import { UpdateSalesChannelDto } from './dto/request/update-sales-channel.dto';

@Controller()
export class SalesChannelsController {
  private readonly logger = new Logger(SalesChannelsController.name);

  constructor(private readonly service: SalesChannelsService) {}

  @MessagePattern({ cmd: 'org.salesChannels.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: SalesChannelDto[]; count: number }> {
    this.logger.log('salesChannels.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.salesChannels.create' })
  async create(@Payload() dto: CreateSalesChannelDto): Promise<CreateResponseDto<SalesChannelDto>> {
    this.logger.log(`salesChannels.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.salesChannels.findById' })
  async findById(@Payload() data: { id: string }): Promise<SalesChannelDto> {
    this.logger.log(`salesChannels.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.salesChannels.update' })
  async update(@Payload() dto: UpdateSalesChannelDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`salesChannels.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.salesChannels.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`salesChannels.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
