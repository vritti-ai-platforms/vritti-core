import type { OfferingDimensionDto } from '@domain/offering-dimensions/dto/entity/offering-dimension.dto';
import { CreateOfferingDimensionDto } from '@domain/offering-dimensions/dto/request/create-offering-dimension.dto';
import { CreateOfferingDimensionFromTemplateDto } from '@domain/offering-dimensions/dto/request/create-offering-dimension-from-template.dto';
import { UpdateOfferingDimensionDto } from '@domain/offering-dimensions/dto/request/update-offering-dimension.dto';
import { UpsertOfferingDimensionValuesDto } from '@domain/offering-dimensions/dto/request/upsert-offering-dimension-values.dto';
import { OfferingDimensionsDomainService } from '@domain/offering-dimensions/services/offering-dimensions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class SiteOfferingDimensionsController {
  private readonly logger = new Logger(SiteOfferingDimensionsController.name);

  constructor(private readonly service: OfferingDimensionsDomainService) {}

  // Returns an offering's dimensions with their values, in SKU segment order
  @MessagePattern({ cmd: 'site.offerings.dimensions.list' })
  list(@Payload() data: { offeringId: string }): Promise<OfferingDimensionDto[]> {
    this.logger.log(`offerings.dimensions.list — offeringId: ${data.offeringId}`);
    return this.service.list(data.offeringId);
  }

  // Appends an empty dimension defined inline; its values are set separately
  @MessagePattern({ cmd: 'site.offerings.dimensions.create' })
  create(@Payload() dto: CreateOfferingDimensionDto): Promise<CreateResponseDto<OfferingDimensionDto>> {
    this.logger.log(`offerings.dimensions.create — offeringId: ${dto.offeringId}, code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Appends a dimension seeded from a template — code, name and values are copied server-side.
  @MessagePattern({ cmd: 'site.offerings.dimensions.createFromTemplate' })
  createFromTemplate(
    @Payload() dto: CreateOfferingDimensionFromTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionDto>> {
    this.logger.log(`offerings.dimensions.createFromTemplate — templateId: ${dto.templateId}`);
    return this.service.createFromTemplate(dto);
  }

  // Replaces a dimension's value set; values already used by a variant cannot be dropped
  @MessagePattern({ cmd: 'site.offerings.dimensions.values.upsert' })
  upsertValues(@Payload() dto: UpsertOfferingDimensionValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.dimensions.values.upsert — dimensionId: ${dto.dimensionId}`);
    return this.service.upsertValues(dto);
  }

  // Reorders the axes; refused once variants exist because their SKUs encode the current order
  @MessagePattern({ cmd: 'site.offerings.dimensions.reorder' })
  reorder(@Payload() data: { offeringId: string; dimensionIds: string[] }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.dimensions.reorder — offeringId: ${data.offeringId}`);
    return this.service.reorder(data.offeringId, data.dimensionIds);
  }

  // Removes a dimension; refused while any variant uses one of its values
  // Renames a dimension; its code is fixed because every derived SKU carries it
  @MessagePattern({ cmd: 'site.offerings.dimensions.update' })
  update(@Payload() dto: UpdateOfferingDimensionDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`offerings.dimensions.update — id: ${id}`);
    return this.service.update(id, data);
  }

  @MessagePattern({ cmd: 'site.offerings.dimensions.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.dimensions.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
