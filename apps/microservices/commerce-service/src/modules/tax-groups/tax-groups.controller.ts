import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { TaxGroupDto } from '@domain/tax-groups/dto/entity/tax-group.dto';
import type { CreateTaxGroupDto } from './dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from './dto/request/update-tax-group.dto';
import { TaxGroupsService } from '@domain/tax-groups/services/tax-groups.service';

@Controller()
export class TaxGroupsController {
  private readonly logger = new Logger(TaxGroupsController.name);

  constructor(private readonly taxGroupsService: TaxGroupsService) {}

  // Lists all tax groups for a business unit
  @MessagePattern({ cmd: 'taxGroups.list' })
  async list(data: { organizationId: string; businessUnitId: string }): Promise<TaxGroupDto[]> {
    this.logger.log(`taxGroups.list — buId: ${data.businessUnitId}`);
    return this.taxGroupsService.list(data.organizationId, data.businessUnitId);
  }

  // Creates a new tax group
  @MessagePattern({ cmd: 'taxGroups.create' })
  async create(data: CreateTaxGroupDto): Promise<TaxGroupDto> {
    this.logger.log(`taxGroups.create — buId: ${data.businessUnitId}`);
    return this.taxGroupsService.create(data);
  }

  // Finds a tax group by ID
  @MessagePattern({ cmd: 'taxGroups.findById' })
  async findById(data: { id: string }): Promise<TaxGroupDto> {
    this.logger.log(`taxGroups.findById — id: ${data.id}`);
    return this.taxGroupsService.findById(data.id);
  }

  // Updates a tax group by ID
  @MessagePattern({ cmd: 'taxGroups.update' })
  async update(data: { id: string } & UpdateTaxGroupDto): Promise<TaxGroupDto> {
    const { id, ...updateData } = data;
    this.logger.log(`taxGroups.update — id: ${id}`);
    return this.taxGroupsService.update(id, updateData);
  }

  // Deletes a tax group by ID
  @MessagePattern({ cmd: 'taxGroups.delete' })
  async delete(data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`taxGroups.delete — id: ${data.id}`);
    return this.taxGroupsService.delete(data.id);
  }
}
