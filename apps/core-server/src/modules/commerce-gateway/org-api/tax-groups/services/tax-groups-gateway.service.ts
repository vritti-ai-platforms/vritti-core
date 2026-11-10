import type { CreateTaxClassGroupDto } from '@commerce/tax-groups/dto/request/create-tax-class-group.dto';
import type { CreateTaxGroupDto } from '@commerce/tax-groups/dto/request/create-tax-group.dto';
import type { CreateTaxGroupRateDto } from '@commerce/tax-groups/dto/request/create-tax-group-rate.dto';
import type { TaxGroupRateTableQueryDto } from '@commerce/tax-groups/dto/request/tax-group-rate-table-query.dto';
import type { UpdateTaxClassGroupDto } from '@commerce/tax-groups/dto/request/update-tax-class-group.dto';
import type { UpdateTaxGroupDto } from '@commerce/tax-groups/dto/request/update-tax-group.dto';
import type { UpdateTaxGroupRateDto } from '@commerce/tax-groups/dto/request/update-tax-group-rate.dto';
import type { TaxClassGroupResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-response.dto';
import type { TaxClassGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-table-response.dto';
import type { TaxGroupRateResponseDto } from '@commerce/tax-groups/dto/response/tax-group-rate-response.dto';
import type { TaxGroupRateTableResponseDto } from '@commerce/tax-groups/dto/response/tax-group-rate-table-response.dto';
import type { TaxGroupResponseDto } from '@commerce/tax-groups/dto/response/tax-group-response.dto';
import type { TaxGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-group-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class TaxGroupsGatewayService {
  private readonly logger = new Logger(TaxGroupsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Returns paginated tax groups for the data table; the country comes from the saved table context
  async findForTable(userId: string): Promise<TaxGroupTableResponseDto> {
    this.logger.log('org.taxGroups.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-tax-groups');
    const { result, count } = await this.nats.send<{ result: TaxGroupResponseDto[]; count: number }>(
      'commerce',
      'org.taxGroups.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  // Creates a tax group for one country
  create(dto: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupResponseDto>> {
    this.logger.log(`org.taxGroups.create — country: ${dto.countryCode}, code: ${dto.code}`);
    return this.nats.send('commerce', 'org.taxGroups.create', dto);
  }

  // Finds a tax group by ID
  findById(id: string): Promise<TaxGroupResponseDto> {
    this.logger.log(`org.taxGroups.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.taxGroups.findById', { id });
  }

  // Updates a tax group by ID
  update(id: string, dto: UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxGroups.update — id: ${id}`);
    return this.nats.send('commerce', 'org.taxGroups.update', { id, ...dto });
  }

  // Activates or deactivates a tax group
  setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxGroups.setActive — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'org.taxGroups.setActive', { id, isActive });
  }

  // Deletes a tax group by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxGroups.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.taxGroups.delete', { id });
  }

  // Returns a group's paginated rates for the data table
  async findRatesForTable(
    userId: string,
    taxGroupId: string,
    context: TaxGroupRateTableQueryDto,
  ): Promise<TaxGroupRateTableResponseDto> {
    this.logger.log(
      `org.taxGroups.rates.table — taxGroupId: ${taxGroupId}, jurisdiction: ${context.jurisdiction ?? 'all'}, asOf: ${context.asOf ?? 'any'}`,
    );
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-tax-group-rates');
    const { result, count } = await this.nats.send<{ result: TaxGroupRateResponseDto[]; count: number }>(
      'commerce',
      'org.taxGroups.rates.table',
      { taxGroupId, ...context, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Adds a dated rate to a group
  createRate(taxGroupId: string, dto: CreateTaxGroupRateDto): Promise<CreateResponseDto<TaxGroupRateResponseDto>> {
    this.logger.log(`org.taxGroups.rates.create — taxGroupId: ${taxGroupId}, component: ${dto.taxComponentId}`);
    return this.nats.send('commerce', 'org.taxGroups.rates.create', { taxGroupId, ...dto });
  }

  // Updates a rate of a group
  updateRate(taxGroupId: string, id: string, dto: UpdateTaxGroupRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxGroups.rates.update — taxGroupId: ${taxGroupId}, id: ${id}`);
    return this.nats.send('commerce', 'org.taxGroups.rates.update', { taxGroupId, id, ...dto });
  }

  // Removes a rate from a group
  deleteRate(taxGroupId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxGroups.rates.delete — taxGroupId: ${taxGroupId}, id: ${id}`);
    return this.nats.send('commerce', 'org.taxGroups.rates.delete', { taxGroupId, id });
  }

  // Returns a group's paginated class mappings for the data table
  async findClassesForTable(userId: string, taxGroupId: string): Promise<TaxClassGroupTableResponseDto> {
    this.logger.log(`org.taxGroups.classes.table — taxGroupId: ${taxGroupId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      'commerce-org-tax-group-classes',
    );
    const { result, count } = await this.nats.send<{ result: TaxClassGroupResponseDto[]; count: number }>(
      'commerce',
      'org.taxGroups.classes.table',
      { taxGroupId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Maps a tax class to a group in the group's country
  createClass(taxGroupId: string, dto: CreateTaxClassGroupDto): Promise<CreateResponseDto<TaxClassGroupResponseDto>> {
    this.logger.log(`org.taxGroups.classes.create — taxGroupId: ${taxGroupId}, taxClassId: ${dto.taxClassId}`);
    return this.nats.send('commerce', 'org.taxGroups.classes.create', { taxGroupId, ...dto });
  }

  // Updates a class mapping of a group
  updateClass(taxGroupId: string, id: string, dto: UpdateTaxClassGroupDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxGroups.classes.update — taxGroupId: ${taxGroupId}, id: ${id}`);
    return this.nats.send('commerce', 'org.taxGroups.classes.update', { taxGroupId, id, ...dto });
  }

  // Removes a class mapping from a group
  deleteClass(taxGroupId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxGroups.classes.delete — taxGroupId: ${taxGroupId}, id: ${id}`);
    return this.nats.send('commerce', 'org.taxGroups.classes.delete', { taxGroupId, id });
  }
}
