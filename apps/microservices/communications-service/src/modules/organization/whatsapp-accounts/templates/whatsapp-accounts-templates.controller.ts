import { WhatsappTemplateDto } from '@domain/whatsapp-account-templates/dto/entity/whatsapp-template.dto';
import { WhatsappAccountTemplatesDomainService } from '@domain/whatsapp-account-templates/services/whatsapp-account-templates.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class WhatsappAccountsTemplatesController {
  private readonly logger = new Logger(WhatsappAccountsTemplatesController.name);

  constructor(private readonly service: WhatsappAccountTemplatesDomainService) {}

  @MessagePattern({ cmd: 'org.whatsappAccounts.templates.list' })
  async list(@Payload() data: { accountId: string }): Promise<WhatsappTemplateDto[]> {
    this.logger.log(`whatsappAccounts.templates.list — account: ${data.accountId}`);
    return this.service.list(data.accountId);
  }
}
