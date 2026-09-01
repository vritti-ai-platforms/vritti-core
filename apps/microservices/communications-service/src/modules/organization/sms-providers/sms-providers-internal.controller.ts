import { SmsProviderDto } from '@domain/sms-providers/dto/entity/sms-provider.dto';
import { CreateSmsProviderDto } from '@domain/sms-providers/dto/request/create-sms-provider.dto';
import { UpdateSmsProviderDto } from '@domain/sms-providers/dto/request/update-sms-provider.dto';
import { SmsProvidersDomainService } from '@domain/sms-providers/services/sms-providers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

/**
 * Platform provider management — reached only through core's cloud-signed internal controller.
 * These calls carry no RLS headers on purpose: with no org GUC set, the table policy resolves only
 * the NULL-org (platform) rows, so this surface cannot read or write any client row.
 */
@Controller()
export class SmsProvidersInternalController {
  private readonly logger = new Logger(SmsProvidersInternalController.name);

  constructor(private readonly service: SmsProvidersDomainService) {}

  @MessagePattern({ cmd: 'internal.smsProviders.list' })
  async list(): Promise<SmsProviderDto[]> {
    this.logger.log('internal.smsProviders.list');
    return this.service.listPlatform();
  }

  @MessagePattern({ cmd: 'internal.smsProviders.create' })
  async create(@Payload() dto: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderDto>> {
    this.logger.log(`internal.smsProviders.create — provider: ${dto.provider}`);
    return this.service.createPlatform(dto);
  }

  @MessagePattern({ cmd: 'internal.smsProviders.update' })
  async update(@Payload() dto: UpdateSmsProviderDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`internal.smsProviders.update — id: ${id}`);
    return this.service.updatePlatform(id, payload);
  }

  @MessagePattern({ cmd: 'internal.smsProviders.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`internal.smsProviders.delete — id: ${data.id}`);
    return this.service.deletePlatform(data.id);
  }
}
