import type { CreateDimensionTemplateDto } from '@commerce/dimension-templates/dto/request/create-dimension-template.dto';
import type { UpdateDimensionTemplateDto } from '@commerce/dimension-templates/dto/request/update-dimension-template.dto';
import type { TemplateValueInputDto } from '@commerce/dimension-templates/dto/request/upsert-dimension-template-values.dto';
import type { DimensionTemplateResponseDto } from '@commerce/dimension-templates/dto/response/dimension-template-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SiteDimensionTemplatesGatewayService {
  private readonly logger = new Logger(SiteDimensionTemplatesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns every dimension template this workspace can reach, for the card grid
  async list(orgId: string, search?: string): Promise<DimensionTemplateResponseDto[]> {
    this.logger.log('site.dimensionTemplates.list');
    const templates = await this.nats.send<DimensionTemplateResponseDto[]>('commerce', 'site.dimensionTemplates.list', {
      search,
    });
    return this.ownerNames.resolve(orgId, templates);
  }

  // Creates a template owned by the calling workspace
  async create(dto: CreateDimensionTemplateDto): Promise<CreateResponseDto<DimensionTemplateResponseDto>> {
    this.logger.log(`dimensionTemplates.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'site.dimensionTemplates.create', dto);
  }

  // Updates a template the workspace owns
  async update(id: string, dto: UpdateDimensionTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.update — id: ${id}`);
    return this.nats.send('commerce', 'site.dimensionTemplates.update', { id, ...dto });
  }

  // Switches a template on or off; the microservice refuses it while the template has no values
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.setActive — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'site.dimensionTemplates.setActive', { id, isActive });
  }

  // Deletes a template the workspace owns
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.dimensionTemplates.delete', { id });
  }

  // Replaces a template's values with the set supplied
  async upsertValues(templateId: string, values: TemplateValueInputDto[]): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.values.upsert — templateId: ${templateId}, count: ${values.length}`);
    return this.nats.send('commerce', 'site.dimensionTemplates.values.upsert', { templateId, values });
  }
}
