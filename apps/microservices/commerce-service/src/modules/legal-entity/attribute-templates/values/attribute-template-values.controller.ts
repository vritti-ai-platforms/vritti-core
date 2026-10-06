import { UpsertAttributeTemplateValuesDto } from '@domain/attribute-template-values/dto/request/upsert-attribute-template-values.dto';
import { AttributeTemplateValuesDomainService } from '@domain/attribute-template-values/services/attribute-template-values.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeAttributeTemplateValuesController {
  private readonly logger = new Logger(LeAttributeTemplateValuesController.name);

  constructor(private readonly service: AttributeTemplateValuesDomainService) {}

  // Replaces a template's values with the set supplied
  @MessagePattern({ cmd: 'le.attributeTemplates.values.upsert' })
  upsert(@Payload() dto: UpsertAttributeTemplateValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.values.upsert — templateId: ${dto.templateId}, count: ${dto.values.length}`);
    return this.service.upsert(dto);
  }
}
