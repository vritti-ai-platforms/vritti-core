import type { DimensionTemplateDto } from '@domain/dimension-templates/dto/entity/dimension-template.dto';
import { CreateDimensionTemplateDto } from '@domain/dimension-templates/dto/request/create-dimension-template.dto';
import { SetDimensionTemplateActiveDto } from '@domain/dimension-templates/dto/request/set-dimension-template-active.dto';
import { UpdateDimensionTemplateDto } from '@domain/dimension-templates/dto/request/update-dimension-template.dto';
import { DimensionTemplatesDomainService } from '@domain/dimension-templates/services/dimension-templates.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class SiteDimensionTemplatesController {
  private readonly logger = new Logger(SiteDimensionTemplatesController.name);

  constructor(private readonly service: DimensionTemplatesDomainService) {}

  // Returns every dimension template this workspace can reach, for the card grid
  @MessagePattern({ cmd: 'site.dimensionTemplates.list' })
  list(@Payload() data: { search?: string }): Promise<DimensionTemplateDto[]> {
    this.logger.log('dimensionTemplates.list');
    return this.service.list(data.search);
  }

  // Creates a site-owned dimension template; values are added through their own endpoint
  @MessagePattern({ cmd: 'site.dimensionTemplates.create' })
  create(@Payload() dto: CreateDimensionTemplateDto): Promise<CreateResponseDto<DimensionTemplateDto>> {
    this.logger.log(`dimensionTemplates.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  // Updates a dimension template this site owns
  @MessagePattern({ cmd: 'site.dimensionTemplates.update' })
  update(@Payload() dto: UpdateDimensionTemplateDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`dimensionTemplates.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Switches a template on or off; refused while it has no values
  @MessagePattern({ cmd: 'site.dimensionTemplates.setActive' })
  setActive(@Payload() dto: SetDimensionTemplateActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.setActive — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto.id, dto.isActive);
  }

  // Deletes a dimension template this site owns
  @MessagePattern({ cmd: 'site.dimensionTemplates.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
