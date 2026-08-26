import { WhatsappAccountDto } from '@domain/whatsapp-accounts/dto/entity/whatsapp-account.dto';
import { CreateWhatsappAccountDto } from '@domain/whatsapp-accounts/dto/request/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from '@domain/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
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
export class WhatsappAccountsController {
  private readonly logger = new Logger(WhatsappAccountsController.name);

  constructor(private readonly service: WhatsappAccountsDomainService) {}

  @MessagePattern({ cmd: 'org.whatsappAccounts.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: WhatsappAccountDto[]; count: number }> {
    this.logger.log('whatsappAccounts.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.create' })
  async create(@Payload() dto: CreateWhatsappAccountDto): Promise<CreateResponseDto<WhatsappAccountDto>> {
    this.logger.log(`whatsappAccounts.create — waba: ${dto.wabaId}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'select.whatsappAccounts' })
  async select(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.whatsappAccounts');
    return this.service.findForSelect(query);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.findById' })
  async findById(@Payload() data: { id: string }): Promise<WhatsappAccountDto> {
    this.logger.log(`whatsappAccounts.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.update' })
  async update(@Payload() dto: UpdateWhatsappAccountDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`whatsappAccounts.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
