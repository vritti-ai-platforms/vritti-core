import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateTaxGroupDto } from '../dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from '../dto/request/update-tax-group.dto';
import type { TaxGroupResponseDto } from '../dto/response/tax-group-response.dto';
import type { TaxGroupTableResponseDto } from '../dto/response/tax-group-table-response.dto';

@Injectable()
export class TaxGroupsGatewayService {
  private readonly logger = new Logger(TaxGroupsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns a paginated page of tax groups for the data table (Redis-backed view state)
  async findForTable(userId: string): Promise<TaxGroupTableResponseDto> {
    this.logger.log('taxGroups.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-tax-groups');
    const { result, count } = await this.nats.send<{ result: TaxGroupResponseDto[]; count: number }>(
      'commerce',
      'taxGroups.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  // Returns all tax groups (base + rates) for the mobile plain list
  async list(search?: string): Promise<TaxGroupResponseDto[]> {
    this.logger.log('taxGroups.list');
    return this.nats.send('commerce', 'taxGroups.list', { search });
  }

  // Returns tax groups as dropdown options
  async select(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('taxGroups.select');
    return this.nats.send('commerce', 'taxGroups.select', query);
  }

  // Creates a new tax group
  async create(dto: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupResponseDto>> {
    this.logger.log(`taxGroups.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'taxGroups.create', dto);
  }

  // Finds a tax group by ID
  async findById(id: string): Promise<TaxGroupResponseDto> {
    this.logger.log(`taxGroups.findById — id: ${id}`);
    return this.nats.send('commerce', 'taxGroups.findById', { id });
  }

  // Updates a tax group by ID
  async update(id: string, dto: UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.update — id: ${id}`);
    return this.nats.send('commerce', 'taxGroups.update', { id, ...dto });
  }

  // Deletes a tax group by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`taxGroups.delete — id: ${id}`);
    return this.nats.send('commerce', 'taxGroups.delete', { id });
  }
}
