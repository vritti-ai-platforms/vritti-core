import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import { TaxGroupDto } from '../dto/tax-group.dto';
import type { CreateTaxGroupDto } from '../dto/create-tax-group.dto';
import type { UpdateTaxGroupDto } from '../dto/update-tax-group.dto';
import { TaxGroupsRepository } from '../repositories/tax-groups.repository';

@Injectable()
export class TaxGroupsService {
  private readonly logger = new Logger(TaxGroupsService.name);

  constructor(private readonly taxGroupsRepository: TaxGroupsRepository) {}

  // Returns all tax groups for a business unit
  async list(orgId: string, buId: string): Promise<TaxGroupDto[]> {
    const entities = await this.taxGroupsRepository.findByBu(orgId, buId);
    return entities.map(TaxGroupDto.from);
  }

  // Creates a new tax group and returns the entity DTO
  async create(data: CreateTaxGroupDto): Promise<TaxGroupDto> {
    const entity = await this.taxGroupsRepository.create({
      ...data,
      rate: String(data.rate),
      cgstRate: data.cgstRate != null ? String(data.cgstRate) : undefined,
      sgstRate: data.sgstRate != null ? String(data.sgstRate) : undefined,
      igstRate: data.igstRate != null ? String(data.igstRate) : undefined,
      cessRate: data.cessRate != null ? String(data.cessRate) : undefined,
    });
    this.logger.log(`Created tax group: ${entity.name} (${entity.id})`);
    return TaxGroupDto.from(entity);
  }

  // Finds a tax group by ID or throws NotFoundException
  async findById(id: string): Promise<TaxGroupDto> {
    const entity = await this.taxGroupsRepository.findById(id);
    if (!entity) throw new NotFoundException('Tax group not found.');
    return TaxGroupDto.from(entity);
  }

  // Updates a tax group and returns the updated entity DTO
  async update(id: string, data: UpdateTaxGroupDto): Promise<TaxGroupDto> {
    const existing = await this.taxGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Tax group not found.');

    const updatePayload: Record<string, unknown> = { ...data };
    if (data.rate != null) updatePayload.rate = String(data.rate);
    if (data.cgstRate != null) updatePayload.cgstRate = String(data.cgstRate);
    if (data.sgstRate != null) updatePayload.sgstRate = String(data.sgstRate);
    if (data.igstRate != null) updatePayload.igstRate = String(data.igstRate);
    if (data.cessRate != null) updatePayload.cessRate = String(data.cessRate);

    const entity = await this.taxGroupsRepository.update(id, updatePayload);
    this.logger.log(`Updated tax group: ${entity.name} (${entity.id})`);
    return TaxGroupDto.from(entity);
  }

  // Deletes a tax group by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.taxGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Tax group not found.');
    await this.taxGroupsRepository.delete(id);
    this.logger.log(`Deleted tax group: ${id}`);
    return { success: true, message: 'Tax group deleted successfully.' };
  }
}
