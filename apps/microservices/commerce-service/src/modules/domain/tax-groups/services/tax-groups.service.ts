import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import type { CreateTaxGroupDto } from '@/modules/tax-groups/dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from '@/modules/tax-groups/dto/request/update-tax-group.dto';
import { TaxGroupDto } from '../dto/entity/tax-group.dto';
import { TaxGroupsRepository } from '../repositories/tax-groups.repository';

@Injectable()
export class TaxGroupsService {
  private readonly logger = new Logger(TaxGroupsService.name);

  constructor(private readonly taxGroupsRepository: TaxGroupsRepository) {}

  // Returns all tax groups with their tax rates (RLS scopes to org + BU ancestors)
  async list(): Promise<TaxGroupDto[]> {
    const groups = await this.taxGroupsRepository.findAllWithRates();
    return groups.map((g) => TaxGroupDto.from(g, g.taxRates));
  }

  // Creates a new tax group with associated tax rates
  async create(data: CreateTaxGroupDto): Promise<TaxGroupDto> {
    const entity = await this.taxGroupsRepository.create({
      name: data.name,
      isDefault: data.isDefault ?? false,
    });

    const rates = await this.taxGroupsRepository.createTaxRates(
      entity.id,
      (data.taxRates ?? []).map((r, i) => ({
        name: r.name,
        rate: String(r.rate),
        type: r.type,
        sortOrder: i,
      })),
    );

    this.logger.log(`Created tax group: ${entity.name} (${entity.id})`);
    return TaxGroupDto.from(entity, rates);
  }

  // Finds a tax group by ID with its tax rates or throws NotFoundException
  async findById(id: string): Promise<TaxGroupDto> {
    const entity = await this.taxGroupsRepository.findById(id);
    if (!entity) throw new NotFoundException('Tax group not found.');
    const rates = await this.taxGroupsRepository.findTaxRatesByGroupId(id);
    return TaxGroupDto.from(entity, rates);
  }

  // Updates a tax group and replaces its tax rates
  async update(id: string, data: UpdateTaxGroupDto): Promise<TaxGroupDto> {
    const existing = await this.taxGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Tax group not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.isDefault !== undefined) updatePayload.isDefault = data.isDefault;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

    const entity = await this.taxGroupsRepository.update(id, updatePayload);

    // Replace tax rates if provided
    let rates;
    if (data.taxRates !== undefined) {
      await this.taxGroupsRepository.deleteTaxRatesByGroupId(id);
      rates = await this.taxGroupsRepository.createTaxRates(
        id,
        data.taxRates.map((r, i) => ({
          name: r.name,
          rate: String(r.rate),
          type: r.type,
          sortOrder: i,
        })),
      );
    } else {
      rates = await this.taxGroupsRepository.findTaxRatesByGroupId(id);
    }

    this.logger.log(`Updated tax group: ${entity.name} (${entity.id})`);
    return TaxGroupDto.from(entity, rates);
  }

  // Deletes a tax group by ID (cascades to tax rates)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.taxGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Tax group not found.');
    await this.taxGroupsRepository.delete(id);
    this.logger.log(`Deleted tax group: ${id}`);
    return { success: true, message: 'Tax group deleted successfully.' };
  }
}
