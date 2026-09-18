import type { CreateSmsProviderDto } from '@communications/sms-providers/dto/request/create-sms-provider.dto';
import type { UpdateSmsProviderDto } from '@communications/sms-providers/dto/request/update-sms-provider.dto';
import type { SmsProviderCapabilitiesResponseDto } from '@communications/sms-providers/dto/response/sms-provider-capabilities-response.dto';
import type { SmsProviderResponseDto } from '@communications/sms-providers/dto/response/sms-provider-response.dto';
import type { SmsProviderTableResponseDto } from '@communications/sms-providers/dto/response/sms-provider-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SmsProvidersGatewayService {
  private readonly logger = new Logger(SmsProvidersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // The providers that can actually be connected. Comes from the microservice's transport registry,
  // so it never advertises a provider nothing can send through.
  listAvailable(): Promise<SmsProviderCapabilitiesResponseDto[]> {
    this.logger.log('smsProviders.available');
    return this.nats.send('communications', 'org.smsProviders.available', {});
  }

  // The org's own providers plus the Vritti-managed platform rows, as one data table
  async findForTable(userId: string): Promise<SmsProviderTableResponseDto> {
    this.logger.log('smsProviders.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-sms-providers',
    );

    const { result, count } = await this.nats.send<{ result: SmsProviderResponseDto[]; count: number }>(
      'communications',
      'org.smsProviders.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  findById(id: string): Promise<SmsProviderResponseDto> {
    this.logger.log(`smsProviders.findById — id: ${id}`);
    return this.nats.send('communications', 'org.smsProviders.findById', { id });
  }

  create(dto: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderResponseDto>> {
    this.logger.log(`smsProviders.create — provider: ${dto.provider}`);
    return this.nats.send('communications', 'org.smsProviders.create', dto);
  }

  update(id: string, dto: UpdateSmsProviderDto): Promise<SuccessResponseDto> {
    this.logger.log(`smsProviders.update — id: ${id}`);
    return this.nats.send('communications', 'org.smsProviders.update', { id, ...dto });
  }

  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`smsProviders.delete — id: ${id}`);
    return this.nats.send('communications', 'org.smsProviders.delete', { id });
  }
}
