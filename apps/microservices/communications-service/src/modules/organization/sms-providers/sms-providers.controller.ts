import { SmsProviderDto } from '@domain/sms-providers/dto/entity/sms-provider.dto';
import { CreateSmsProviderDto } from '@domain/sms-providers/dto/request/create-sms-provider.dto';
import { UpdateSmsProviderDto } from '@domain/sms-providers/dto/request/update-sms-provider.dto';
import { SmsProvidersDomainService } from '@domain/sms-providers/services/sms-providers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';

@Controller()
export class SmsProvidersController {
  private readonly logger = new Logger(SmsProvidersController.name);

  constructor(private readonly service: SmsProvidersDomainService) {}

  @MessagePattern({ cmd: 'org.smsProviders.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: SmsProviderDto[]; count: number }> {
    this.logger.log('smsProviders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'select.smsProviders' })
  async select(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.smsProviders');
    return this.service.findForSelect(query);
  }

  @MessagePattern({ cmd: 'org.smsProviders.create' })
  async create(@Payload() dto: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderDto>> {
    this.logger.log(`smsProviders.create — provider: ${dto.provider}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.smsProviders.findById' })
  async findById(@Payload() data: { id: string }): Promise<SmsProviderDto> {
    this.logger.log(`smsProviders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.smsProviders.update' })
  async update(@Payload() dto: UpdateSmsProviderDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`smsProviders.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.smsProviders.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`smsProviders.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
