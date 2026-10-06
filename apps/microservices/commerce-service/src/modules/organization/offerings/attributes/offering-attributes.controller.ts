import type { OfferingAttributeDto } from '@domain/offering-attributes/dto/entity/offering-attribute.dto';
import { CreateOfferingAttributeDto } from '@domain/offering-attributes/dto/request/create-offering-attribute.dto';
import { CreateOfferingAttributeWithValuesAndTemplateDto } from '@domain/offering-attributes/dto/request/create-offering-attribute-with-values-and-template.dto';
import { UpdateOfferingAttributeDto } from '@domain/offering-attributes/dto/request/update-offering-attribute.dto';
import { UpsertOfferingAttributeValuesDto } from '@domain/offering-attributes/dto/request/upsert-offering-attribute-values.dto';
import { OfferingAttributesDomainService } from '@domain/offering-attributes/services/offering-attributes.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class OrgOfferingAttributesController {
  private readonly logger = new Logger(OrgOfferingAttributesController.name);

  constructor(private readonly service: OfferingAttributesDomainService) {}

  // Returns an offering's attributes with their values
  @MessagePattern({ cmd: 'org.offerings.attributes.list' })
  list(@Payload() data: { offeringId: string }): Promise<OfferingAttributeDto[]> {
    this.logger.log(`offerings.attributes.list — offeringId: ${data.offeringId}`);
    return this.service.list(data.offeringId);
  }

  // Appends an empty attribute defined inline; its values are set separately
  @MessagePattern({ cmd: 'org.offerings.attributes.create' })
  create(@Payload() dto: CreateOfferingAttributeDto): Promise<CreateResponseDto<OfferingAttributeDto>> {
    this.logger.log(`offerings.attributes.create — offeringId: ${dto.offeringId}, code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Creates an axis and the values the caller chose
  @MessagePattern({ cmd: 'org.offerings.attributes.createWithValuesAndTemplate' })
  createWithValuesAndTemplate(
    @Payload() dto: CreateOfferingAttributeWithValuesAndTemplateDto,
  ): Promise<CreateResponseDto<OfferingAttributeDto>> {
    this.logger.log(`offerings.attributes.createWithValuesAndTemplate — ${dto.code}, ${dto.values.length} values`);
    return this.service.createWithValuesAndTemplate(dto);
  }

  // Replaces an attribute's value set; values already used by a variant cannot be dropped
  @MessagePattern({ cmd: 'org.offerings.attributes.values.upsert' })
  upsertValues(@Payload() dto: UpsertOfferingAttributeValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.attributes.values.upsert — attributeId: ${dto.attributeId}`);
    return this.service.upsertValues(dto);
  }

  // Reorders the groups; this is the order a storefront renders its filters in
  @MessagePattern({ cmd: 'org.offerings.attributes.reorder' })
  reorder(@Payload() data: { offeringId: string; attributeIds: string[] }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.attributes.reorder — offeringId: ${data.offeringId}`);
    return this.service.reorder(data.offeringId, data.attributeIds);
  }

  // Removes an attribute; refused while any variant uses one of its values
  // Renames an attribute; its code is fixed because a storefront filters on it
  @MessagePattern({ cmd: 'org.offerings.attributes.update' })
  update(@Payload() dto: UpdateOfferingAttributeDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`offerings.attributes.update — id: ${id}`);
    return this.service.update(id, data);
  }

  @MessagePattern({ cmd: 'org.offerings.attributes.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.attributes.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
