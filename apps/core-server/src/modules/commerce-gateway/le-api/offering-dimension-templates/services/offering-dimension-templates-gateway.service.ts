import type { CreateOfferingDimensionTemplateDto } from '@commerce/offering-dimension-templates/dto/request/create-offering-dimension-template.dto';
import type { UpdateOfferingDimensionTemplateDto } from '@commerce/offering-dimension-templates/dto/request/update-offering-dimension-template.dto';
import type { TemplateValueInputDto } from '@commerce/offering-dimension-templates/dto/request/upsert-offering-dimension-template-values.dto';
import type { OfferingDimensionTemplateResponseDto } from '@commerce/offering-dimension-templates/dto/response/offering-dimension-template-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class LeOfferingDimensionTemplatesGatewayService {
  private readonly logger = new Logger(LeOfferingDimensionTemplatesGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns every dimension template this workspace can reach, for the card grid
  async list(search?: string): Promise<OfferingDimensionTemplateResponseDto[]> {
    this.logger.log('le.offeringDimensionTemplates.list');
    return this.nats.send('commerce', 'le.offeringDimensionTemplates.list', { search });
  }

  // Creates a template owned by the calling workspace
  async create(
    dto: CreateOfferingDimensionTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionTemplateResponseDto>> {
    this.logger.log(`offeringDimensionTemplates.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'le.offeringDimensionTemplates.create', dto);
  }

  // Finds a template by ID
  async findById(id: string): Promise<OfferingDimensionTemplateResponseDto> {
    this.logger.log(`offeringDimensionTemplates.findById — id: ${id}`);
    return this.nats.send('commerce', 'le.offeringDimensionTemplates.get', { id });
  }

  // Updates a template the workspace owns
  async update(id: string, dto: UpdateOfferingDimensionTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`offeringDimensionTemplates.update — id: ${id}`);
    return this.nats.send('commerce', 'le.offeringDimensionTemplates.update', { id, ...dto });
  }

  // Switches a template on or off; the microservice refuses it while the template has no values
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`offeringDimensionTemplates.setActive — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'le.offeringDimensionTemplates.setActive', { id, isActive });
  }

  // Deletes a template the workspace owns
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`offeringDimensionTemplates.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.offeringDimensionTemplates.delete', { id });
  }

  // Replaces a template's values with the set supplied
  async upsertValues(templateId: string, values: TemplateValueInputDto[]): Promise<SuccessResponseDto> {
    this.logger.log(`offeringDimensionTemplates.values.upsert — templateId: ${templateId}, count: ${values.length}`);
    return this.nats.send('commerce', 'le.offeringDimensionTemplates.values.upsert', { templateId, values });
  }
}
