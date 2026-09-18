import { SmsProviderTemplateDto } from '@domain/sms-provider-templates/dto/entity/sms-provider-template.dto';
import { AddSmsProviderTemplateDto } from '@domain/sms-provider-templates/dto/request/add-sms-provider-template.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SmsProviderTemplatesService } from './services/sms-provider-templates.service';

@Controller()
export class SmsProviderTemplatesController {
  private readonly logger = new Logger(SmsProviderTemplatesController.name);

  constructor(private readonly service: SmsProviderTemplatesService) {}

  @MessagePattern({ cmd: 'org.smsProviders.templates.list' })
  async list(@Payload() data: { providerId: string }): Promise<SmsProviderTemplateDto[]> {
    this.logger.log(`smsProviders.templates.list — provider: ${data.providerId}`);
    return this.service.findForProvider(data.providerId);
  }

  @MessagePattern({ cmd: 'org.smsProviders.templates.add' })
  async add(
    @Payload() data: { providerId: string } & AddSmsProviderTemplateDto,
  ): Promise<CreateResponseDto<SmsProviderTemplateDto>> {
    const { providerId, ...dto } = data;
    this.logger.log(`smsProviders.templates.add — provider: ${providerId}, template: ${dto.templateId}`);
    return this.service.add(providerId, dto);
  }

  @MessagePattern({ cmd: 'org.smsProviders.templates.refresh' })
  async refresh(@Payload() data: { id: string }): Promise<SmsProviderTemplateDto> {
    this.logger.log(`smsProviders.templates.refresh — id: ${data.id}`);
    return this.service.refresh(data.id);
  }

  @MessagePattern({ cmd: 'org.smsProviders.templates.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`smsProviders.templates.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
