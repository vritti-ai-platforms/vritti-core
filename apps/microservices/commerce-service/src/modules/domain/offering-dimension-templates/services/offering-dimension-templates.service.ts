import { Injectable, Logger } from '@nestjs/common';

// Postgres reports a unique violation as 23505 with the constraint name attached
function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  const code = cause?.code ?? cause?.cause?.code;
  const name = cause?.constraint ?? cause?.cause?.constraint;
  return code === '23505' && name === constraint;
}

import {
  type CreateResponseDto,
  MAX_PAGE_SIZE,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { eq, ilike, or } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { type OfferingDimensionTemplateValue, offeringDimensionTemplates } from '@/db/schema';
import { OfferingDimensionTemplateDto } from '../dto/entity/offering-dimension-template.dto';
import type { CreateOfferingDimensionTemplateDto } from '../dto/request/create-offering-dimension-template.dto';
import type { UpdateOfferingDimensionTemplateDto } from '../dto/request/update-offering-dimension-template.dto';
import {
  OfferingDimensionTemplatesDomainRepository,
  type TemplateWithMeta,
} from '../repositories/offering-dimension-templates.repository';

@Injectable()
export class OfferingDimensionTemplatesDomainService {
  private readonly logger = new Logger(OfferingDimensionTemplatesDomainService.name);

  constructor(private readonly repository: OfferingDimensionTemplatesDomainRepository) {}

  // Returns every template this workspace can reach, each with its values, for the card grid
  async list(search?: string): Promise<OfferingDimensionTemplateDto[]> {
    const where = search
      ? or(
          ilike(offeringDimensionTemplates.name, `%${search}%`),
          ilike(offeringDimensionTemplates.description, `%${search}%`),
        )
      : undefined;

    const rows = await this.repository.findAllWithMeta(where);
    if (rows.length === MAX_PAGE_SIZE) {
      this.logger.warn(
        `Dimension template list hit the ${MAX_PAGE_SIZE}-row cap — later templates are not being returned. Narrow with search.`,
      );
    }
    const values = await this.repository.findValuesForTemplates(rows.map((row) => row.id));
    return rows.map((row) =>
      this.toDto(
        row,
        values.filter((value) => value.templateId === row.id),
      ),
    );
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
      conditions: [eq(offeringDimensionTemplates.isActive, true)],
    });
  }

  async findById(id: string): Promise<OfferingDimensionTemplateDto> {
    const row = await this.requireReachable(id);
    return this.toDto(row, await this.repository.findValues(id));
  }

  // Creates a template owned by the calling workspace; the database stamps the owner from its GUCs.
  // Values are NOT accepted here — they are added through addValue, which is gated by values.add.
  async create(data: CreateOfferingDimensionTemplateDto): Promise<CreateResponseDto<OfferingDimensionTemplateDto>> {
    await this.assertNameFree(data.name);

    const entity = await this.createOrConflict({
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
    });

    this.logger.log(`Created dimension template: ${entity.code}`);
    return {
      success: true,
      message: `Template "${entity.name}" created successfully. Add values, then activate it.`,
      data: this.toDto({ ...entity, isOwned: true }, []),
    };
  }

  // Switches a template on or off. Activation is a separate action from editing, and is refused while
  // the template has no values — an empty template would seed a dimension with nothing.
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);

    const valueCount = (await this.repository.findValues(id)).length;
    if (isActive && valueCount === 0) {
      throw new BadRequestException({
        label: 'No Values',
        detail: `Add at least one value to "${existing.name}" before activating it.`,
      });
    }

    const updated = await this.repository.update(id, { isActive });
    this.logger.log(`${isActive ? 'Activated' : 'Deactivated'} dimension template: ${updated.name}`);
    return {
      success: true,
      message: `Template "${updated.name}" ${isActive ? 'activated' : 'deactivated'} successfully.`,
    };
  }

  async update(id: string, data: Omit<UpdateOfferingDimensionTemplateDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) await this.assertNameFree(data.name);

    const updated = await this.repository.update(id, data);
    this.logger.log(`Updated dimension template: ${updated.name}`);
    return { success: true, message: `Template "${updated.name}" updated successfully.` };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireOwned(id);
    await this.repository.delete(id);
    this.logger.log(`Deleted dimension template: ${existing.name} (${id})`);
    return { success: true, message: `Template "${existing.name}" deleted successfully.` };
  }

  // RLS already hides out-of-reach rows; this turns the resulting empty read into a 404
  private async requireReachable(id: string): Promise<TemplateWithMeta> {
    const row = await this.repository.findByIdWithMeta(id);
    if (!row) throw new NotFoundException('Dimension template not found.');
    return row;
  }

  // RLS would reject the write anyway; this fails earlier with a message that explains why
  private async requireOwned(id: string): Promise<TemplateWithMeta> {
    const row = await this.requireReachable(id);
    if (!row.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Template',
        detail: `"${row.name}" belongs to a wider scope. Switch to the workspace that owns it, or create your own.`,
      });
    }
    return row;
  }

  // `code` is unique per ORGANIZATION, but reach only shows this workspace its own subtree, so a
  // sibling's clashing code is invisible to a pre-check. The database is the arbiter; this turns its
  // unique violation into a message the user can act on.
  private async createOrConflict(data: { code: string; name: string; description: string | null; sortOrder: number }) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      if (isUniqueViolation(error, 'uq_offering_dimension_templates_org_code')) {
        throw new ConflictException({
          label: 'Duplicate Code',
          detail: `The code "${data.code}" is already used by another dimension template in this organization.`,
        });
      }
      throw error;
    }
  }

  private async assertNameFree(name: string): Promise<void> {
    const duplicate = await this.repository.findOwnedByName(name);
    if (duplicate) {
      throw new ConflictException({
        label: 'Duplicate Name',
        detail: `You already have a dimension template named "${name}".`,
      });
    }
  }

  private toDto(row: TemplateWithMeta, values: OfferingDimensionTemplateValue[]): OfferingDimensionTemplateDto {
    return OfferingDimensionTemplateDto.from(row, {
      values,
      valueCount: values.length,
      isOwned: row.isOwned,
      // Only the owning workspace can delete. Phase 2 adds a reference check here once
      // offering_dimensions.template_id exists — a seeded template must not be removable.
      canDelete: row.isOwned,
    });
  }
}
