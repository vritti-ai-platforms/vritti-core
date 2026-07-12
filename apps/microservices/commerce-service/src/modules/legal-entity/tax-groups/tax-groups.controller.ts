import type { TaxGroupDto } from '@domain/tax-groups/dto/entity/tax-group.dto';
import { TaxGroupsService } from '@domain/tax-groups/services/tax-groups.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import type { CreateTaxGroupDto } from './dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from './dto/request/update-tax-group.dto';

@Controller()
export class TaxGroupsController {
  private readonly logger = new Logger(TaxGroupsController.name);

  constructor(private readonly taxGroupsService: TaxGroupsService) {}

  // Returns a paginated page of tax groups for the data table
  @MessagePattern({ cmd: 'le.taxGroups.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: TaxGroupDto[]; count: number }> {
    this.logger.log('taxGroups.table');
    return this.taxGroupsService.findForTable(state);
  }

  // Returns all tax groups (base + rates) for the mobile plain list
  @MessagePattern({ cmd: 'le.taxGroups.list' })
  async list(@Payload() data: { search?: string }): Promise<TaxGroupDto[]> {
    this.logger.log('taxGroups.list');
    return this.taxGroupsService.list(data?.search);
  }

  // Returns tax groups as dropdown options
  @MessagePattern({ cmd: 'le.taxGroups.select' })
  async select(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('taxGroups.select');
    return this.taxGroupsService.findForSelect(query);
  }

  // Creates a new tax group (org_id/bu_id auto-filled by DB defaults from session vars)
  @MessagePattern({ cmd: 'le.taxGroups.create' })
  async create(@Payload() dto: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupDto>> {
    this.logger.log(`taxGroups.create — name: ${dto.name}`);
    return this.taxGroupsService.create(dto);
  }

  // Finds a tax group by ID (RLS scopes visibility)
  @MessagePattern({ cmd: 'le.taxGroups.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxGroupDto> {
    this.logger.log(`taxGroups.findById — id: ${data.id}`);
    return this.taxGroupsService.findById(data.id);
  }

  // Updates a tax group by ID
  @MessagePattern({ cmd: 'le.taxGroups.update' })
  async update(@Payload() data: { id: string } & UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`taxGroups.update — id: ${id}`);
    return this.taxGroupsService.update(id, updateData);
  }

  // Deletes a tax group by ID
  @MessagePattern({ cmd: 'le.taxGroups.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.delete — id: ${data.id}`);
    return this.taxGroupsService.delete(data.id);
  }
}
