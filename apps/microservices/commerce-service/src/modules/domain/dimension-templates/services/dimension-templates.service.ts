import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { eq, ilike, or } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import { dimensionTemplates } from '@/db/schema';
import { DimensionTemplateDto } from '../dto/entity/dimension-template.dto';
import type { CreateDimensionTemplateDto } from '../dto/request/create-dimension-template.dto';
import type { UpdateDimensionTemplateDto } from '../dto/request/update-dimension-template.dto';
import { DimensionTemplatesDomainRepository } from '../repositories/dimension-templates.repository';

@Injectable()
export class DimensionTemplatesDomainService {
  private readonly logger = new Logger(DimensionTemplatesDomainService.name);

  constructor(private readonly repository: DimensionTemplatesDomainRepository) {}

  // Returns every template this workspace can reach, each with its values, for the card grid
  async list(search?: string): Promise<DimensionTemplateDto[]> {
    const where = search
      ? or(ilike(dimensionTemplates.name, `%${search}%`), ilike(dimensionTemplates.description, `%${search}%`))
      : undefined;

    const templates = await this.repository.findAll(where);
    const valuesByTemplate = await this.repository.findValuesByTemplateIds(templates.map((t) => t.id));
    return templates.map((t) => DimensionTemplateDto.from(t, valuesByTemplate.get(t.id) ?? [], t.isOwned));
  }

  // Returns template options for select dropdowns, restricted to active templates
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      conditions: [eq(dimensionTemplates.isActive, true)],
    });
  }

  // Creates a template owned by the calling workspace; the database stamps the owner from its GUCs
  async create(data: CreateDimensionTemplateDto): Promise<CreateResponseDto<DimensionTemplateDto>> {
    const duplicate = await this.repository.findOwnedByName(data.name);
    if (duplicate) {
      throw new ConflictException({
        label: 'Duplicate Name',
        detail: `You already have a dimension template named "${data.name}".`,
      });
    }

    const entity = await this.repository.create(data);

    this.logger.log(`Created dimension template: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Template "${entity.name}" created successfully. Add values, then activate it.`,
      data: DimensionTemplateDto.from(entity, [], true),
    };
  }

  // Updates a template the workspace owns
  async update(id: string, data: Omit<UpdateDimensionTemplateDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id, { requireOwned: true });

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await this.repository.findOwnedByName(data.name);
      if (duplicate) {
        throw new ConflictException({
          label: 'Duplicate Name',
          detail: `You already have a dimension template named "${data.name}".`,
        });
      }
    }

    const updated = await this.repository.update(id, data);
    this.logger.log(`Updated dimension template: ${updated.name} (${id})`);
    return { success: true, message: `Template "${updated.name}" updated successfully.` };
  }

  // Switches a template on or off; activation is refused while it has no values, because an empty
  // template would seed a dimension with nothing
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id, { requireOwned: true });

    if (isActive) {
      const values = await this.repository.findValuesByTemplateId(id);
      if (values.length === 0) {
        throw new BadRequestException({
          label: 'No Values',
          detail: `Add at least one value to "${existing.name}" before activating it.`,
        });
      }
    }

    const updated = await this.repository.update(id, { isActive });
    this.logger.log(`${isActive ? 'Activated' : 'Deactivated'} dimension template: ${updated.name} (${id})`);
    return {
      success: true,
      message: `Template "${updated.name}" ${isActive ? 'activated' : 'deactivated'} successfully.`,
    };
  }

  // Deletes a template the workspace owns
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id, { requireOwned: true });
    await this.repository.delete(id);
    this.logger.log(`Deleted dimension template: ${existing.name} (${id})`);
    return { success: true, message: `Template "${existing.name}" deleted successfully.` };
  }
}
