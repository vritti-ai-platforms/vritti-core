import { UpsertAttributeTemplateValuesDto } from '@domain/attribute-template-values/dto/request/upsert-attribute-template-values.dto';
import { AttributeTemplateValuesDomainService } from '@domain/attribute-template-values/services/attribute-template-values.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class OrgAttributeTemplateValuesController {
  private readonly logger = new Logger(OrgAttributeTemplateValuesController.name);

  constructor(private readonly service: AttributeTemplateValuesDomainService) {}

  // Replaces a template's values with the set supplied
  @MessagePattern({ cmd: 'org.attributeTemplates.values.upsert' })
  upsert(@Payload() dto: UpsertAttributeTemplateValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.values.upsert — templateId: ${dto.templateId}, count: ${dto.values.length}`);
    return this.service.upsert(dto);
  }
}
