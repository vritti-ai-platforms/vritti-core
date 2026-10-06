import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OfferingAttributeDto } from '../dto/entity/offering-attribute.dto';
import type { CreateOfferingAttributeDto } from '../dto/request/create-offering-attribute.dto';
import type { CreateOfferingAttributeWithValuesAndTemplateDto } from '../dto/request/create-offering-attribute-with-values-and-template.dto';
import type { UpdateOfferingAttributeDto } from '../dto/request/update-offering-attribute.dto';
import type { UpsertOfferingAttributeValuesDto } from '../dto/request/upsert-offering-attribute-values.dto';
import { OfferingAttributesDomainRepository } from '../repositories/offering-attributes.repository';

@Injectable()
export class OfferingAttributesDomainService {
  private readonly logger = new Logger(OfferingAttributesDomainService.name);

  constructor(private readonly repository: OfferingAttributesDomainRepository) {}

  // Lists an offering's axes with their values. The offering probe tells a missing offering apart from
  // one that simply has no attributes yet, which an empty list alone cannot.
  async list(offeringId: string): Promise<OfferingAttributeDto[]> {
    if (!(await this.repository.findOffering(offeringId))) throw new NotFoundException('Offering not found.');
    const attributes = await this.repository.findByOfferingWithValues(offeringId);
    return attributes.map((d) => OfferingAttributeDto.from(d, d.values));
  }

  // Adds an empty axis to an offering. Existing variants are untouched — a variant names whichever
  // attributes apply to it, not necessarily all of them, so nothing needs backfilling.
  async create(data: CreateOfferingAttributeDto): Promise<CreateResponseDto<OfferingAttributeDto>> {
    const offering = await this.requireOwnedOffering(data.offeringId);

    const sortOrder = await this.repository.nextSortOrder(data.offeringId);
    const attribute = await this.repository.create({
      offeringId: data.offeringId,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      sortOrder,
    });

    this.logger.log(`Added attribute ${data.code} to offering ${offering.code}`);
    return {
      success: true,
      message: `"${data.name}" added. Add its values next.`,
      data: OfferingAttributeDto.from({ ...attribute, canDelete: true }, []),
    };
  }

  // Creates an axis and the values the caller chose, in one transaction
  async createWithValuesAndTemplate(
    data: CreateOfferingAttributeWithValuesAndTemplateDto,
  ): Promise<CreateResponseDto<OfferingAttributeDto>> {
    const offering = await this.requireOwnedOffering(data.offeringId);
    this.assertDistinctValueCodes(data.values);
    await this.assertValuesFromTemplate(data.templateId, data.values);

    const result = await this.repository.transaction(async () => {
      const sortOrder = await this.repository.nextSortOrder(data.offeringId);
      const attribute = await this.repository.create({
        offeringId: data.offeringId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        sortOrder,
      });

      const values = await this.repository.createValues(
        data.values.map((value, index) => ({
          attributeId: attribute.id,
          code: value.code,
          value: value.value,
          sortOrder: index,
        })),
      );

      return { attribute, values };
    });

    this.logger.log(`Added attribute ${data.code} with ${result.values.length} values to offering ${offering.code}`);
    return {
      success: true,
      message: `"${data.name}" added with ${pluralize('value', result.values.length, true)}.`,
      data: OfferingAttributeDto.from(
        { ...result.attribute, canDelete: true },
        result.values.map((value) => ({ ...value, canDelete: true })),
      ),
    };
  }

  // Replaces the attribute's value set. Values a variant already carries cannot be dropped — the
  // variant holds a foreign key to them.
  async upsertValues(data: UpsertOfferingAttributeValuesDto): Promise<SuccessResponseDto> {
    const attribute = await this.requireOwnedAttribute(data.attributeId);
    this.assertDistinctValueCodes(data.values);

    const existing = await this.repository.findValuesByAttribute(data.attributeId);
    const inUse = await this.repository.findValuesInUse(data.attributeId);
    const byId = new Map(existing.map((value) => [value.id, value]));
    const submittedIds = new Set(data.values.map((input) => input.id).filter(Boolean));
    const submittedCodes = new Set(data.values.map((input) => input.code));

    // No rename guard, unlike dimensions: an attribute code is not a SKU segment, so changing one
    // rewrites nothing. It does change the storefront's filter URL for that value, which the admin
    // copy warns about rather than the server refusing.

    // Dropped only when NEITHER its id nor its code came back — id is optional, so a caller that sends
    // just code/value still matches by code exactly as the transaction below does.
    const dropped = inUse.filter((value) => !submittedIds.has(value.id) && !submittedCodes.has(value.code));
    if (dropped.length > 0) {
      const quoted = dropped.map((value) => `"${value.code}"`).join(', ');
      throw new ConflictException({
        label: 'Value In Use',
        detail: `${quoted} ${dropped.length === 1 ? 'is' : 'are'} carried by existing variants and cannot be removed. Clear it from those variants first.`,
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
            attributeId: data.attributeId,
            code: input.code,
            value: input.value,
            sortOrder: index,
          })),
      );
    });

    this.logger.log(`Set ${data.values.length} values on attribute ${attribute.code}`);
    return { success: true, message: `"${attribute.name}" now has ${pluralize('value', data.values.length, true)}.` };
  }

  // Position drives the order filter groups appear in on a storefront. Nothing derived is stored, so
  // recomputed, so reordering leaves them exactly as they are — variants created before and after a
  // reorder can therefore carry differently ordered segments.
  async reorder(offeringId: string, attributeIds: string[]): Promise<SuccessResponseDto> {
    const offering = await this.requireOwnedOffering(offeringId);

    const current = await this.repository.findByOffering(offeringId);
    const currentIds = new Set(current.map((attribute) => attribute.id));
    const incoming = new Set(attributeIds);
    // A partial or padded list would leave gaps or drop an axis, so the set must match exactly
    if (
      incoming.size !== attributeIds.length ||
      incoming.size !== currentIds.size ||
      attributeIds.some((id) => !currentIds.has(id))
    ) {
      throw new BadRequestException({
        label: 'Incomplete Order',
        detail: "The list must contain every one of this offering's attributes exactly once.",
        errors: [{ field: 'attributeIds', message: 'Does not match the offering' }],
      });
    }

    await this.repository.transaction(async () => {
      for (const [index, id] of attributeIds.entries()) {
        await this.repository.update(id, { sortOrder: index });
      }
    });

    this.logger.log(`Reordered ${attributeIds.length} attributes on offering ${offering.code}`);
    return { success: true, message: 'Attribute order updated.' };
  }

  // Renames the attribute. The code is left alone — it is the storefront's filter key for this
  // attribute, so only the label a person reads is editable.
  async update(id: string, data: Omit<UpdateOfferingAttributeDto, 'id'>): Promise<SuccessResponseDto> {
    await this.requireOwnedAttribute(id);
    await this.repository.update(id, { name: data.name, description: data.description });
    return { success: true, message: `"${data.name}" updated.` };
  }

  // Blocked while any variant carries a value on this axis — removing it would leave those variants
  // with variants carrying values of an attribute that no longer exists.
  async delete(id: string): Promise<SuccessResponseDto> {
    const attribute = await this.requireOwnedAttribute(id);
    const inUse = await this.repository.countVariantsUsingAttribute(id);
    if (inUse > 0) {
      throw new ConflictException({
        label: 'Attribute In Use',
        detail: `"${attribute.name}" is used by ${pluralize('variant', inUse, true)}. Remove those variants first.`,
      });
    }
    await this.repository.delete(id);
    return { success: true, message: `"${attribute.name}" deleted.` };
  }

  private assertDistinctValueCodes(values: { code: string; value: string }[]): void {
    const codes = new Set<string>();
    for (const [index, entry] of values.entries()) {
      if (codes.has(entry.code)) {
        throw new BadRequestException({
          label: 'Duplicate Value Code',
          detail: `The code "${entry.code}" appears twice. Each value needs its own code.`,
          errors: [{ field: `values.${index}.code`, message: 'Duplicate code' }],
        });
      }
      codes.add(entry.code);
    }
  }

  // Every submitted value must be one the template offers, so a picked subset cannot become invented values
  private async assertValuesFromTemplate(templateId: string, values: { code: string }[]): Promise<void> {
    const template = await this.repository.findTemplateWithValues(templateId);
    if (!template) throw new NotFoundException('Attribute template not found or out of reach.');
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

  private async requireOwnedAttribute(id: string) {
    const attribute = await this.repository.findById(id);
    if (!attribute) throw new NotFoundException('Attribute not found.');
    await this.requireOwnedOffering(attribute.offeringId);
    return attribute;
  }

  // RLS already rejects a write to someone else's offering; this fails earlier with a clearer message
  private async requireOwnedOffering(offeringId: string) {
    const offering = await this.repository.findOffering(offeringId, { requireOwned: true });
    if (!offering) {
      throw new ForbiddenException({
        label: 'Not Your Offering',
        detail:
          'This offering belongs to a wider scope. Switch to the workspace that owns it to change its attributes.',
      });
    }
    return offering;
  }
}
