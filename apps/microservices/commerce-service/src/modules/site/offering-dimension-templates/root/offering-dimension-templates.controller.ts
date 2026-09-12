import type { OfferingDimensionTemplateDto } from '@domain/offering-dimension-templates/dto/entity/offering-dimension-template.dto';
import { CreateOfferingDimensionTemplateDto } from '@domain/offering-dimension-templates/dto/request/create-offering-dimension-template.dto';
import { SetOfferingDimensionTemplateActiveDto } from '@domain/offering-dimension-templates/dto/request/set-offering-dimension-template-active.dto';
import { UpdateOfferingDimensionTemplateDto } from '@domain/offering-dimension-templates/dto/request/update-offering-dimension-template.dto';
import { OfferingDimensionTemplatesDomainService } from '@domain/offering-dimension-templates/services/offering-dimension-templates.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class SiteOfferingDimensionTemplatesController {
  private readonly logger = new Logger(SiteOfferingDimensionTemplatesController.name);

  constructor(private readonly service: OfferingDimensionTemplatesDomainService) {}

  // Returns every dimension template this workspace can reach, for the card grid
  @MessagePattern({ cmd: 'site.offeringDimensionTemplates.list' })
  list(@Payload() data: { search?: string }): Promise<OfferingDimensionTemplateDto[]> {
    this.logger.log('offeringDimensionTemplates.list');
    return this.service.list(data.search);
  }

  // Returns one dimension template with its values
  @MessagePattern({ cmd: 'site.offeringDimensionTemplates.get' })
  get(@Payload() data: { id: string }): Promise<OfferingDimensionTemplateDto> {
    this.logger.log(`offeringDimensionTemplates.get — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Creates a site-owned dimension template; values are added through their own endpoint
  @MessagePattern({ cmd: 'site.offeringDimensionTemplates.create' })
  create(@Payload() dto: CreateOfferingDimensionTemplateDto): Promise<CreateResponseDto<OfferingDimensionTemplateDto>> {
    this.logger.log(`offeringDimensionTemplates.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  // Updates a dimension template this site owns
  @MessagePattern({ cmd: 'site.offeringDimensionTemplates.update' })
  update(@Payload() dto: UpdateOfferingDimensionTemplateDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`offeringDimensionTemplates.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Switches a template on or off; refused while it has no values
  @MessagePattern({ cmd: 'site.offeringDimensionTemplates.setActive' })
  setActive(@Payload() dto: SetOfferingDimensionTemplateActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`offeringDimensionTemplates.setActive — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto.id, dto.isActive);
  }

  // Deletes a dimension template this site owns
  @MessagePattern({ cmd: 'site.offeringDimensionTemplates.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offeringDimensionTemplates.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
