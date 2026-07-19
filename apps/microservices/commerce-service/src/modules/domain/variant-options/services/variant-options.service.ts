import { Injectable, Logger } from '@nestjs/common';
import type { SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { VariantOptionDto } from '../dto/entity/variant-option.dto';
import type { CreateVariantOptionDto } from '../dto/request/create-variant-option.dto';
import type { UpdateVariantOptionDto } from '../dto/request/update-variant-option.dto';
import { VariantOptionsDomainRepository } from '../repositories/variant-options.repository';

@Injectable()
export class VariantOptionsDomainService {
  private readonly logger = new Logger(VariantOptionsDomainService.name);

  constructor(private readonly repository: VariantOptionsDomainRepository) {}

  // Returns all variant options with their values for a catalog
  async list(catalogId: string): Promise<VariantOptionDto[]> {
    const options = await this.repository.findByCatalogId(catalogId);
    const valuesByOption = new Map<string, Awaited<ReturnType<typeof this.repository.findValuesByOptionId>>>();
    const allValueIds: string[] = [];
    for (const option of options) {
      const values = await this.repository.findValuesByOptionId(option.id);
      valuesByOption.set(option.id, values);
      for (const value of values) allValueIds.push(value.id);
    }

    const referencedIds = new Set(await this.repository.findReferencedValueIds(allValueIds));
    return options.map((option) => VariantOptionDto.from(option, valuesByOption.get(option.id) ?? [], referencedIds));
  }

  // Returns variant option select results scoped to a catalog
  findForSelect(catalogId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectByCatalog(catalogId, {
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'sortOrder',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Creates a variant option with its values for a catalog
  async create(data: CreateVariantOptionDto): Promise<VariantOptionDto> {
    const maxSortOrder = await this.repository.findMaxSortOrder(data.catalogId);
    const option = await this.repository.createOption({
      catalogId: data.catalogId,
      name: data.name,
      sortOrder: maxSortOrder + 1,
    });

    for (let i = 0; i < data.values.length; i++) {
      await this.repository.createValue({ variantOptionId: option.id, value: data.values[i], sortOrder: i });
    }

    const values = await this.repository.findValuesByOptionId(option.id);
    this.logger.log(`Created variant option: ${option.name} (${option.id})`);
    return VariantOptionDto.from(option, values);
  }

  // Renames an option and reconciles its values, blocking removal of values still in use
  async update(data: UpdateVariantOptionDto): Promise<VariantOptionDto> {
    const option = await this.repository.findOptionById(data.optionId);
    if (!option) throw new NotFoundException('Variant option not found.');

    if (data.name != null) {
      await this.repository.updateOption(data.optionId, { name: data.name });
    }

    if (data.values != null) {
      const existingValues = await this.repository.findValuesByOptionId(data.optionId);
      const existingByValue = new Map(existingValues.map((v) => [v.value, v]));
      const desired = new Set(data.values);

      const removed = existingValues.filter((v) => !desired.has(v.value));
      const referenced = await this.repository.countVariantReferencesForValues(removed.map((v) => v.id));
      if (referenced > 0) {
        throw new ConflictException({
          label: 'Value in use',
          detail: 'Remove the variants that use these values before deleting them.',
        });
      }
      await this.repository.deleteValues(removed.map((v) => v.id));

      for (let i = 0; i < data.values.length; i++) {
        const value = data.values[i];
        if (existingByValue.has(value)) continue;
        await this.repository.createValue({ variantOptionId: data.optionId, value, sortOrder: i });
      }
    }

    const refreshed = await this.repository.findOptionById(data.optionId);
    if (!refreshed) throw new NotFoundException('Variant option not found.');
    const values = await this.repository.findValuesByOptionId(data.optionId);
    this.logger.log(`Updated variant option: ${refreshed.name} (${data.optionId})`);
    return VariantOptionDto.from(refreshed, values);
  }

  // Deletes a variant option, blocking when it is used by an offering axis or variant
  async delete(optionId: string): Promise<SuccessResponseDto> {
    const option = await this.repository.findOptionById(optionId);
    if (!option) throw new NotFoundException('Variant option not found.');

    const axisReferences = await this.repository.countAxisReferencesForOption(optionId);
    if (axisReferences > 0) {
      throw new ConflictException({
        label: 'Option in use',
        detail: 'Remove this option from offerings that use it before deleting it.',
      });
    }

    const values = await this.repository.findValuesByOptionId(optionId);
    const variantReferences = await this.repository.countVariantReferencesForValues(values.map((v) => v.id));
    if (variantReferences > 0) {
      throw new ConflictException({
        label: 'Option in use',
        detail: 'Remove the variants that use this option before deleting it.',
      });
    }

    await this.repository.deleteValues(values.map((v) => v.id));
    await this.repository.deleteOption(optionId);
    this.logger.log(`Deleted variant option: ${option.name} (${optionId})`);
    return { success: true, message: `Variant option "${option.name}" deleted successfully.` };
  }
}
