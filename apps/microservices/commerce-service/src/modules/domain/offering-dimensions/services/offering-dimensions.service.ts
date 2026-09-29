import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OfferingDimensionDto } from '../dto/entity/offering-dimension.dto';
import type { CreateOfferingDimensionDto } from '../dto/request/create-offering-dimension.dto';
import type { CreateOfferingDimensionWithValuesAndTemplateDto } from '../dto/request/create-offering-dimension-with-values-and-template.dto';
import type { UpdateOfferingDimensionDto } from '../dto/request/update-offering-dimension.dto';
import type { UpsertOfferingDimensionValuesDto } from '../dto/request/upsert-offering-dimension-values.dto';
import { OfferingDimensionsDomainRepository } from '../repositories/offering-dimensions.repository';

@Injectable()
export class OfferingDimensionsDomainService {
  private readonly logger = new Logger(OfferingDimensionsDomainService.name);

  constructor(private readonly repository: OfferingDimensionsDomainRepository) {}

  // Lists an offering's axes with their values. The offering probe tells a missing offering apart from
  // one that simply has no dimensions yet, which an empty list alone cannot.
  async list(offeringId: string): Promise<OfferingDimensionDto[]> {
    if (!(await this.repository.findOffering(offeringId))) throw new NotFoundException('Offering not found.');
    const dimensions = await this.repository.findByOfferingWithValues(offeringId);
    return dimensions.map((d) => OfferingDimensionDto.from(d, d.values));
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

  // Creates an axis and the values the caller chose, in one transaction
  async createWithValuesAndTemplate(
    data: CreateOfferingDimensionWithValuesAndTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionDto>> {
    const offering = await this.requireOwnedOffering(data.offeringId);
    this.assertDistinctValueCodes(data.values);
    await this.assertValuesFromTemplate(data.templateId, data.values);

    const result = await this.repository.transaction(async () => {
      const sortOrder = await this.repository.nextSortOrder(data.offeringId);
      const dimension = await this.repository.create({
        offeringId: data.offeringId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        sortOrder,
      });

      const values = await this.repository.createValues(
        data.values.map((value, index) => ({
          dimensionId: dimension.id,
          code: value.code,
          value: value.value,
          sortOrder: index,
        })),
      );

      return { dimension, values };
    });

    this.logger.log(`Added dimension ${data.code} with ${result.values.length} values to offering ${offering.code}`);
    return {
      success: true,
      message: `"${data.name}" added with ${pluralize('value', result.values.length, true)}.`,
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
    const inUse = await this.repository.findValuesInUse(data.dimensionId);
    const byId = new Map(existing.map((value) => [value.id, value]));
    const submittedIds = new Set(data.values.map((input) => input.id).filter(Boolean));
    const submittedCodes = new Set(data.values.map((input) => input.code));

    // A row keeps its id across an edit, so a changed code is a rename of that very value — and the
    // code is a SKU segment of every variant already built on it.
    const renamed = data.values
      .map((input, index) => ({ input, index }))
      .filter(({ input }) => input.id && inUse.some((value) => value.id === input.id))
      .filter(({ input }) => byId.get(input.id as string)?.code !== input.code);
    if (renamed.length > 0) {
      throw new ConflictException({
        label: 'Code In Use',
        detail: `${pluralize('code', renamed.length, true)} ${renamed.length === 1 ? 'is' : 'are'} already part of a variant SKU and cannot change. Rename the label instead, or add a new value.`,
        errors: renamed.map(({ index }) => ({ field: `values.${index}.code`, message: 'Part of a variant SKU' })),
      });
    }

    // Dropped only when NEITHER its id nor its code came back — id is optional, so a caller that sends
    // just code/value still matches by code exactly as the transaction below does.
    const dropped = inUse.filter((value) => !submittedIds.has(value.id) && !submittedCodes.has(value.code));
    if (dropped.length > 0) {
      const quoted = dropped.map((value) => `"${value.code}"`).join(', ');
      throw new ConflictException({
        label: 'Value In Use',
        detail: `${quoted} ${dropped.length === 1 ? 'is' : 'are'} used by existing variants and cannot be removed — their codes are part of those SKUs.`,
      });
    }

    await this.repository.transaction(async () => {
      const byCode = new Map(existing.map((value) => [value.code, value]));
      const kept = new Set<string>();

      for (const [index, input] of data.values.entries()) {
        const match = (input.id ? byId.get(input.id) : undefined) ?? byCode.get(input.code);
        if (match) {
          kept.add(match.id);
          await this.repository.updateValue(match.id, { code: input.code, value: input.value, sortOrder: index });
        }
      }

      await this.repository.deleteValues(existing.filter((value) => !kept.has(value.id)).map((value) => value.id));

      await this.repository.createValues(
        data.values
          .map((input, index) => ({ input, index }))
          .filter(({ input }) => !(input.id && byId.has(input.id)) && !byCode.has(input.code))
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
    for (const [index, entry] of values.entries()) {
      if (codes.has(entry.code)) {
        throw new BadRequestException({
          label: 'Duplicate Value Code',
          detail: `The code "${entry.code}" appears twice. Each value needs its own code because it becomes a SKU segment.`,
          errors: [{ field: `values.${index}.code`, message: 'Duplicate code' }],
        });
      }
      codes.add(entry.code);
    }
  }

  // Every submitted value must be one the template offers, so a picked subset cannot become invented values
  private async assertValuesFromTemplate(templateId: string, values: { code: string }[]): Promise<void> {
    const template = await this.repository.findTemplateWithValues(templateId);
    if (!template) throw new NotFoundException('Dimension template not found or out of reach.');
    if (!template.isActive) {
      throw new BadRequestException({
        label: 'Template Inactive',
        detail: `"${template.name}" is inactive, so its values cannot be copied. Activate it first.`,
        errors: [{ field: 'templateId', message: 'Template is inactive' }],
      });
    }

    const offered = new Set(template.values.map((value) => value.code));
    const unknown = values.filter((value) => !offered.has(value.code));
    if (unknown.length > 0) {
      throw new BadRequestException({
        label: 'Values Not In Template',
        detail: `${pluralize('value', unknown.length, true)} ${unknown.length === 1 ? 'is' : 'are'} not offered by "${template.name}". Pick from its own values.`,
        errors: [{ field: 'values', message: 'Values not in template' }],
      });
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
