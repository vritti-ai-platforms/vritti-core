import { TemplateLibraryItemDto } from '@domain/whatsapp-account-templates/dto/entity/template-library-item.dto';
import { WhatsappTemplateDto } from '@domain/whatsapp-account-templates/dto/entity/whatsapp-template.dto';
import { CreateWhatsappTemplateDto } from '@domain/whatsapp-account-templates/dto/request/create-whatsapp-template.dto';
import { WhatsappAccountTemplatesDomainService } from '@domain/whatsapp-account-templates/services/whatsapp-account-templates.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class WhatsappAccountsTemplatesController {
  private readonly logger = new Logger(WhatsappAccountsTemplatesController.name);

  constructor(private readonly service: WhatsappAccountTemplatesDomainService) {}

  @MessagePattern({ cmd: 'org.whatsappAccounts.templates.list' })
  async list(@Payload() data: { accountId: string }): Promise<WhatsappTemplateDto[]> {
    this.logger.log(`whatsappAccounts.templates.list — account: ${data.accountId}`);
    return this.service.list(data.accountId);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.templates.libraryList' })
  async libraryList(
    @Payload() data: { accountId: string; search?: string; topic?: string; language?: string; category?: string },
  ): Promise<TemplateLibraryItemDto[]> {
    const { accountId, ...filters } = data;
    this.logger.log(`whatsappAccounts.templates.libraryList — account: ${accountId}`);
    return this.service.listLibrary(accountId, filters);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.templates.libraryLanguages' })
  async libraryLanguages(@Payload() data: { accountId: string }): Promise<string[]> {
    this.logger.log(`whatsappAccounts.templates.libraryLanguages — account: ${data.accountId}`);
    return this.service.listLibraryLanguages(data.accountId);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.templates.create' })
  async create(
    @Payload() data: { accountId: string } & CreateWhatsappTemplateDto,
  ): Promise<CreateResponseDto<WhatsappTemplateDto>> {
    const { accountId, ...dto } = data;
    this.logger.log(`whatsappAccounts.templates.create — account: ${accountId}, template: ${dto.name}`);
    return this.service.create(accountId, dto);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.templates.delete' })
  async delete(@Payload() data: { accountId: string; templateId: string; name: string }): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.templates.delete — account: ${data.accountId}, template: ${data.name}`);
    return this.service.delete(data.accountId, data.templateId, data.name);
  }
}
