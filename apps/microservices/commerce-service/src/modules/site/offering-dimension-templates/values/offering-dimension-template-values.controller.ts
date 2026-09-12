import { UpsertOfferingDimensionTemplateValuesDto } from '@domain/offering-dimension-template-values/dto/request/upsert-offering-dimension-template-values.dto';
import { OfferingDimensionTemplateValuesDomainService } from '@domain/offering-dimension-template-values/services/offering-dimension-template-values.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class SiteOfferingDimensionTemplateValuesController {
  private readonly logger = new Logger(SiteOfferingDimensionTemplateValuesController.name);

  constructor(private readonly service: OfferingDimensionTemplateValuesDomainService) {}

  // Replaces a template's values with the set supplied
  @MessagePattern({ cmd: 'site.offeringDimensionTemplates.values.upsert' })
  upsert(@Payload() dto: UpsertOfferingDimensionTemplateValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `offeringDimensionTemplates.values.upsert — templateId: ${dto.templateId}, count: ${dto.values.length}`,
    );
    return this.service.upsert(dto);
  }
}
