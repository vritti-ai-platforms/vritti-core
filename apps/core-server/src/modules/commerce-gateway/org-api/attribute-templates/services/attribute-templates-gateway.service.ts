import type { CreateAttributeTemplateDto } from '@commerce/attribute-templates/dto/request/create-attribute-template.dto';
import type { UpdateAttributeTemplateDto } from '@commerce/attribute-templates/dto/request/update-attribute-template.dto';
import type { TemplateValueInputDto } from '@commerce/attribute-templates/dto/request/upsert-attribute-template-values.dto';
import type { AttributeTemplateResponseDto } from '@commerce/attribute-templates/dto/response/attribute-template-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class OrgAttributeTemplatesGatewayService {
  private readonly logger = new Logger(OrgAttributeTemplatesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns every attribute template this workspace can reach, for the card grid
  async list(orgId: string, search?: string): Promise<AttributeTemplateResponseDto[]> {
    this.logger.log('org.attributeTemplates.list');
    const templates = await this.nats.send<AttributeTemplateResponseDto[]>('commerce', 'org.attributeTemplates.list', {
      search,
    });
    return this.ownerNames.resolve(orgId, templates);
  }

  // Creates a template owned by the calling workspace
  async create(dto: CreateAttributeTemplateDto): Promise<CreateResponseDto<AttributeTemplateResponseDto>> {
    this.logger.log(`attributeTemplates.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'org.attributeTemplates.create', dto);
  }

  // Updates a template the workspace owns
  async update(id: string, dto: UpdateAttributeTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.update — id: ${id}`);
    return this.nats.send('commerce', 'org.attributeTemplates.update', { id, ...dto });
  }

  // Switches a template on or off; the microservice refuses it while the template has no values
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.setActive — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'org.attributeTemplates.setActive', { id, isActive });
  }

  // Deletes a template the workspace owns
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.attributeTemplates.delete', { id });
  }

  // Replaces a template's values with the set supplied
  async upsertValues(templateId: string, values: TemplateValueInputDto[]): Promise<SuccessResponseDto> {
    this.logger.log(`attributeTemplates.values.upsert — templateId: ${templateId}, count: ${values.length}`);
    return this.nats.send('commerce', 'org.attributeTemplates.values.upsert', { templateId, values });
  }
}
