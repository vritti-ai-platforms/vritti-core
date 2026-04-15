import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { TaxGroupDto } from '@domain/tax-groups/dto/entity/tax-group.dto';
import type { CreateTaxGroupDto } from './dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from './dto/request/update-tax-group.dto';
import { TaxGroupsService } from '@domain/tax-groups/services/tax-groups.service';

@Controller()
export class TaxGroupsController {
  private readonly logger = new Logger(TaxGroupsController.name);

  constructor(private readonly taxGroupsService: TaxGroupsService) {}

  // Lists all tax groups (RLS scopes to org + BU ancestors)
  @MessagePattern({ cmd: 'taxGroups.list' })
  async list(): Promise<TaxGroupDto[]> {
    this.logger.log('taxGroups.list');
    return this.taxGroupsService.list();
  }

  // Creates a new tax group (org_id/bu_id auto-filled by DB defaults from session vars)
  @MessagePattern({ cmd: 'taxGroups.create' })
  async create(@Payload() dto: CreateTaxGroupDto): Promise<TaxGroupDto> {
    this.logger.log(`taxGroups.create — name: ${dto.name}`);
    return this.taxGroupsService.create(dto);
  }

  // Finds a tax group by ID (RLS scopes visibility)
  @MessagePattern({ cmd: 'taxGroups.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxGroupDto> {
    this.logger.log(`taxGroups.findById — id: ${data.id}`);
    return this.taxGroupsService.findById(data.id);
  }

  // Updates a tax group by ID
  @MessagePattern({ cmd: 'taxGroups.update' })
  async update(@Payload() data: { id: string } & UpdateTaxGroupDto): Promise<TaxGroupDto> {
    const { id, ...updateData } = data;
    this.logger.log(`taxGroups.update — id: ${id}`);
    return this.taxGroupsService.update(id, updateData);
  }

  // Deletes a tax group by ID
  @MessagePattern({ cmd: 'taxGroups.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.delete — id: ${data.id}`);
    return this.taxGroupsService.delete(data.id);
  }
}
