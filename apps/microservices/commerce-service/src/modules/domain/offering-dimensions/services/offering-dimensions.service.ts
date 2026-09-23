import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { OfferingDimensionDto } from '../dto/entity/offering-dimension.dto';
import type { CreateOfferingDimensionDto } from '../dto/request/create-offering-dimension.dto';
import type { CreateOfferingDimensionFromTemplateDto } from '../dto/request/create-offering-dimension-from-template.dto';
import type { UpdateOfferingDimensionDto } from '../dto/request/update-offering-dimension.dto';
import type { UpsertOfferingDimensionValuesDto } from '../dto/request/upsert-offering-dimension-values.dto';
import { OfferingDimensionsDomainRepository } from '../repositories/offering-dimensions.repository';

@Injectable()
export class OfferingDimensionsDomainService {
  private readonly logger = new Logger(OfferingDimensionsDomainService.name);

  constructor(private readonly repository: OfferingDimensionsDomainRepository) {}

  async list(offeringId: string): Promise<OfferingDimensionDto[]> {
    if (!(await this.repository.findOffering(offeringId))) throw new NotFoundException('Offering not found.');
    const dimensions = await this.repository.findByOffering(offeringId);
    const values = await this.repository.findValues(dimensions.map((d) => d.id));
    return dimensions.map((d) =>
      OfferingDimensionDto.from(
        d,
        values.filter((v) => v.dimensionId === d.id),
      ),
    );
  }

  // Adds an empty axis to an offering. Existing variants are untouched — a variant names whichever
  // dimensions apply to it, not necessarily all of them, so nothing needs backfilling.
  async create(data: CreateOfferingDimensionDto): Promise<CreateResponseDto<OfferingDimensionDto>> {
    const offering = await this.requireOwnedOffering(data.offeringId);

    const sortOrder = await this.repository.nextSortOrder(data.offeringId);
    const dimension = await this.repository.create({
      offeringId: data.offeringId,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      sortOrder,
    });

    this.logger.log(`Added dimension ${data.code} to offering ${offering.code}`);
    return {
      success: true,
      message: `"${data.name}" added. Add its values next.`,
      data: OfferingDimensionDto.from({ ...dimension, canDelete: true }, []),
    };
  }

  // Seeds an axis from a template in one step: the template's code, name and values are COPIED onto
  // the offering and the link is not kept. The template is a starting point, not an owner — editing
  // it later never reshapes an offering, and the copy is free to diverge.
  async createFromTemplate(
    data: CreateOfferingDimensionFromTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionDto>> {
    const offering = await this.requireOwnedOffering(data.offeringId);
    const template = await this.repository.findTemplateWithValues(data.templateId);
    if (!template) throw new NotFoundException('Dimension template not found or out of reach.');
    if (template.values.length === 0) {
      throw new BadRequestException({
        label: 'Template Has No Values',
        detail: `"${template.name}" has no values yet, so there is nothing to copy. Add values to the template first.`,
        errors: [{ field: 'templateId', message: 'Template has no values' }],
      });
    }
    this.assertDistinctValueCodes(template.values);

    const result = await this.repository.transaction(async () => {
      const sortOrder = await this.repository.nextSortOrder(data.offeringId);
      const dimension = await this.repository.create({
        offeringId: data.offeringId,
        code: template.code,
        name: template.name,
        description: template.description,
        sortOrder,
      });

      const values = await this.repository.createValues(
        template.values.map((value, index) => ({
          dimensionId: dimension.id,
          code: value.code,
          value: value.value,
          sortOrder: index,
        })),
      );

      return { dimension, values };
    });

    this.logger.log(`Seeded dimension ${template.code} on offering ${offering.code} from template`);
    return {
      success: true,
      message: `"${template.name}" added with ${pluralize('value', result.values.length, true)}.`,
      data: OfferingDimensionDto.from(
        { ...result.dimension, canDelete: true },
        result.values.map((value) => ({ ...value, canDelete: true })),
      ),
    };
  }

  // Replaces the dimension's value set. Values a variant already carries cannot be dropped — the
  // variant holds a foreign key to them, and their codes are baked into that variant's stored SKU.
  async upsertValues(data: UpsertOfferingDimensionValuesDto): Promise<SuccessResponseDto> {
    const dimension = await this.requireOwnedDimension(data.dimensionId);
    this.assertDistinctValueCodes(data.values);

    const existing = await this.repository.findValuesByDimension(data.dimensionId);
    const inUse = await this.repository.findValueCodesInUse(data.dimensionId);
    const incoming = new Set(data.values.map((value) => value.code));

    const dropped = inUse.filter((code) => !incoming.has(code));
    if (dropped.length > 0) {
      throw new ConflictException({
        label: 'Value In Use',
        detail: `${dropped.map((code) => `"${code}"`).join(', ')} ${dropped.length === 1 ? 'is' : 'are'} used by existing variants and cannot be removed — their codes are part of those SKUs.`,
      });
    }

    await this.repository.transaction(async () => {
      const byCode = new Map(existing.map((value) => [value.code, value]));
      const kept = new Set<string>();

      for (const [index, input] of data.values.entries()) {
        const match = byCode.get(input.code);
        if (match) {
          kept.add(match.id);
          await this.repository.updateValue(match.id, { value: input.value, sortOrder: index });
        }
      }

      await this.repository.deleteValues(existing.filter((value) => !kept.has(value.id)).map((value) => value.id));

      await this.repository.createValues(
        data.values
          .map((input, index) => ({ input, index }))
          .filter(({ input }) => !byCode.has(input.code))
          .map(({ input, index }) => ({
            dimensionId: data.dimensionId,
            code: input.code,
            value: input.value,
            sortOrder: index,
          })),
      );
    });

    this.logger.log(`Set ${data.values.length} values on dimension ${dimension.code}`);
    return { success: true, message: `"${dimension.name}" now has ${pluralize('value', data.values.length, true)}.` };
  }

  // Position drives the segment order of SKUs derived from here on. Existing SKUs are stored, never
  // recomputed, so reordering leaves them exactly as they are — variants created before and after a
  // reorder can therefore carry differently ordered segments.
  async reorder(offeringId: string, dimensionIds: string[]): Promise<SuccessResponseDto> {
    const offering = await this.requireOwnedOffering(offeringId);

    const current = await this.repository.findByOffering(offeringId);
    const currentIds = new Set(current.map((dimension) => dimension.id));
    const incoming = new Set(dimensionIds);
    // A partial or padded list would leave gaps or drop an axis, so the set must match exactly
    if (
      incoming.size !== dimensionIds.length ||
      incoming.size !== currentIds.size ||
      dimensionIds.some((id) => !currentIds.has(id))
    ) {
      throw new BadRequestException({
        label: 'Incomplete Order',
        detail: "The list must contain every one of this offering's dimensions exactly once.",
        errors: [{ field: 'dimensionIds', message: 'Does not match the offering' }],
      });
    }

    await this.repository.transaction(async () => {
      for (const [index, id] of dimensionIds.entries()) {
        await this.repository.update(id, { sortOrder: index });
      }
    });

    this.logger.log(`Reordered ${dimensionIds.length} dimensions on offering ${offering.code}`);
    return { success: true, message: 'Dimension order updated.' };
  }

  // Renames the axis. The code is left alone — it is a segment of every SKU derived from this
  // dimension, so only the label a person reads is editable.
  async update(id: string, data: Omit<UpdateOfferingDimensionDto, 'id'>): Promise<SuccessResponseDto> {
    await this.requireOwnedDimension(id);
    await this.repository.update(id, { name: data.name, description: data.description });
    return { success: true, message: `"${data.name}" updated.` };
  }

  // Blocked while any variant carries a value on this axis — removing it would leave those variants
  // with SKUs containing a segment for a dimension that no longer exists.
  async delete(id: string): Promise<SuccessResponseDto> {
    const dimension = await this.requireOwnedDimension(id);
    const inUse = await this.repository.countVariantsUsingDimension(id);
    if (inUse > 0) {
      throw new ConflictException({
        label: 'Dimension In Use',
        detail: `"${dimension.name}" is used by ${pluralize('variant', inUse, true)}. Remove those variants first.`,
      });
    }
    await this.repository.delete(id);
    return { success: true, message: `"${dimension.name}" deleted.` };
  }

  private assertDistinctValueCodes(values: { code: string; value: string }[]): void {
    const codes = new Set<string>();
    for (const entry of values) {
      if (codes.has(entry.code)) {
        throw new BadRequestException({
          label: 'Duplicate Value Code',
          detail: `The code "${entry.code}" appears twice. Each value needs its own code because it becomes a SKU segment.`,
          errors: [{ field: 'values', message: 'Duplicate code' }],
        });
      }
      codes.add(entry.code);
    }
  }

  private async requireOwnedDimension(id: string) {
    const dimension = await this.repository.findById(id);
    if (!dimension) throw new NotFoundException('Dimension not found.');
    await this.requireOwnedOffering(dimension.offeringId);
    return dimension;
  }

  // RLS already rejects a write to someone else's offering; this fails earlier with a clearer message
  private async requireOwnedOffering(offeringId: string) {
    const offering = await this.repository.findOffering(offeringId, { requireOwned: true });
    if (!offering) {
      throw new ForbiddenException({
        label: 'Not Your Offering',
        detail:
          'This offering belongs to a wider scope. Switch to the workspace that owns it to change its dimensions.',
      });
    }
    return offering;
  }
}
