import { UpsertDimensionTemplateValuesDto } from '@domain/dimension-template-values/dto/request/upsert-dimension-template-values.dto';
import { DimensionTemplateValuesDomainService } from '@domain/dimension-template-values/services/dimension-template-values.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class LeDimensionTemplateValuesController {
  private readonly logger = new Logger(LeDimensionTemplateValuesController.name);

  constructor(private readonly service: DimensionTemplateValuesDomainService) {}

  // Replaces a template's values with the set supplied
  @MessagePattern({ cmd: 'le.dimensionTemplates.values.upsert' })
  upsert(@Payload() dto: UpsertDimensionTemplateValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.values.upsert — templateId: ${dto.templateId}, count: ${dto.values.length}`);
    return this.service.upsert(dto);
  }
}
