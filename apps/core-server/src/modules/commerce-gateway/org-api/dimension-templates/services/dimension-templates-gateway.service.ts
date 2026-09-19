import type { CreateDimensionTemplateDto } from '@commerce/dimension-templates/dto/request/create-dimension-template.dto';
import type { UpdateDimensionTemplateDto } from '@commerce/dimension-templates/dto/request/update-dimension-template.dto';
import type { TemplateValueInputDto } from '@commerce/dimension-templates/dto/request/upsert-dimension-template-values.dto';
import type { DimensionTemplateResponseDto } from '@commerce/dimension-templates/dto/response/dimension-template-response.dto';
import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class OrgDimensionTemplatesGatewayService {
  private readonly logger = new Logger(OrgDimensionTemplatesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly legalEntityRepository: LegalEntityDomainRepository,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

  // Returns every dimension template this workspace can reach, for the card grid
  async list(orgId: string, search?: string): Promise<DimensionTemplateResponseDto[]> {
    this.logger.log('org.dimensionTemplates.list');
    const templates = await this.nats.send<DimensionTemplateResponseDto[]>('commerce', 'org.dimensionTemplates.list', {
      search,
    });
    return this.withOwnerNames(orgId, templates);
  }

  // Creates a template owned by the calling workspace
  async create(dto: CreateDimensionTemplateDto): Promise<CreateResponseDto<DimensionTemplateResponseDto>> {
    this.logger.log(`dimensionTemplates.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'org.dimensionTemplates.create', dto);
  }

  // Updates a template the workspace owns
  async update(id: string, dto: UpdateDimensionTemplateDto): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.update — id: ${id}`);
    return this.nats.send('commerce', 'org.dimensionTemplates.update', { id, ...dto });
  }

  // Switches a template on or off; the microservice refuses it while the template has no values
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.setActive — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'org.dimensionTemplates.setActive', { id, isActive });
  }

  // Deletes a template the workspace owns
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.dimensionTemplates.delete', { id });
  }

  // Replaces a template's values with the set supplied
  async upsertValues(templateId: string, values: TemplateValueInputDto[]): Promise<SuccessResponseDto> {
    this.logger.log(`dimensionTemplates.values.upsert — templateId: ${templateId}, count: ${values.length}`);
    return this.nats.send('commerce', 'org.dimensionTemplates.values.upsert', { templateId, values });
  }

  // Commerce stores only the owning ids; the names live in core, so they are resolved here. Batched
  // by scope so a grid of templates costs two lookups rather than one per card.
  private async withOwnerNames(
    orgId: string,
    templates: DimensionTemplateResponseDto[],
  ): Promise<DimensionTemplateResponseDto[]> {
    if (templates.length === 0) return templates;

    const leIds = [...new Set(templates.filter((t) => t.ownerScope === 'LE').map((t) => t.legalEntityId as string))];
    const siteIds = [...new Set(templates.filter((t) => t.ownerScope === 'SITE').map((t) => t.siteId as string))];

    const [legalEntities, sites] = await Promise.all([
      this.legalEntityRepository.findByIds(orgId, leIds),
      this.siteRepository.findByIds(orgId, siteIds),
    ]);
    const leNames = new Map(legalEntities.map((le) => [le.id, le.name]));
    const siteNames = new Map(sites.map((site) => [site.id, site.name]));

    return templates.map((template) => ({
      ...template,
      ownerName:
        template.ownerScope === 'SITE'
          ? (siteNames.get(template.siteId as string) ?? 'Unknown outlet')
          : template.ownerScope === 'LE'
            ? (leNames.get(template.legalEntityId as string) ?? 'Unknown company')
            : 'Organization',
    }));
  }
}
