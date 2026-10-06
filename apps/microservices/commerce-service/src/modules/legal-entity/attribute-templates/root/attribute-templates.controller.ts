import type { AttributeTemplateDto } from '@domain/attribute-templates/dto/entity/attribute-template.dto';
import { CreateAttributeTemplateDto } from '@domain/attribute-templates/dto/request/create-attribute-template.dto';
import { SetAttributeTemplateActiveDto } from '@domain/attribute-templates/dto/request/set-attribute-template-active.dto';
import { UpdateAttributeTemplateDto } from '@domain/attribute-templates/dto/request/update-attribute-template.dto';
import { AttributeTemplatesDomainService } from '@domain/attribute-templates/services/attribute-templates.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeAttributeTemplatesController {
  private readonly logger = new Logger(LeAttributeTemplatesController.name);

  constructor(private readonly service: AttributeTemplatesDomainService) {}

  // Returns every attribute template this workspace can reach, for the card grid
  @MessagePattern({ cmd: 'le.attributeTemplates.list' })
  list(@Payload() data: { search?: string }): Promise<AttributeTemplateDto[]> {
    this.logger.log('attributeTemplates.list');
    return this.service.list(data.search);
  }

  // Creates a legal-entity-owned attribute template; values are added through their own endpoint
  @MessagePattern({ cmd: 'le.attributeTemplates.create' })
  create(@Payload() dto: CreateAttributeTemplateDto): Promise<CreateResponseDto<AttributeTemplateDto>> {
    this.logger.log(`attributeTemplates.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  // Updates an attribute template this legal-entity owns
  @MessagePattern({ cmd: 'le.attributeTemplates.update' })
  update(@Payload() dto: UpdateAttributeTemplateDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`attributeTemplates.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Switches a template on or off; refused while it has no values
  @MessagePattern({ cmd: 'le.attributeTemplates.setActive' })
  setActive(@Payload() dto: SetAttributeTemplateActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.setActive — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto.id, dto.isActive);
  }

  // Deletes an attribute template this legal-entity owns
  @MessagePattern({ cmd: 'le.attributeTemplates.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
