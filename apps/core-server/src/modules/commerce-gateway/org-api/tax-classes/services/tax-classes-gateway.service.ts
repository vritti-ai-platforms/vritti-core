import type { CreateTaxClassDto } from '@commerce/tax-classes/dto/request/create-tax-class.dto';
import type { UpdateTaxClassDto } from '@commerce/tax-classes/dto/request/update-tax-class.dto';
import type { TaxClassResponseDto } from '@commerce/tax-classes/dto/response/tax-class-response.dto';
import type { TaxClassTableResponseDto } from '@commerce/tax-classes/dto/response/tax-class-table-response.dto';
import type { TaxClassTableRowResponseDto } from '@commerce/tax-classes/dto/response/tax-class-table-row-response.dto';
import type { CreateTaxClassGroupOnClassDto } from '@commerce/tax-groups/dto/request/create-tax-class-group-on-class.dto';
import type { UpdateTaxClassGroupOnClassDto } from '@commerce/tax-groups/dto/request/update-tax-class-group-on-class.dto';
import type { TaxClassGroupResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-response.dto';
import type { TaxClassGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class TaxClassesGatewayService {
  private readonly logger = new Logger(TaxClassesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Returns paginated tax classes with their tax groups in the saved table context's country and on its day
  async findForTable(userId: string): Promise<TaxClassTableResponseDto> {
    this.logger.log('org.taxClasses.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-tax-classes');

    const { result, count } = await this.nats.send<{ result: TaxClassTableRowResponseDto[]; count: number }>(
      'commerce',
      'org.taxClasses.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new tax class
  create(dto: CreateTaxClassDto): Promise<CreateResponseDto<TaxClassResponseDto>> {
    this.logger.log(`taxClasses.create — code: ${dto.code}`);
    return this.nats.send('commerce', 'org.taxClasses.create', dto);
  }

  // Finds a tax class by ID
  findById(id: string): Promise<TaxClassResponseDto> {
    this.logger.log(`taxClasses.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.taxClasses.findById', { id });
  }

  // Updates a tax class by ID
  update(id: string, dto: UpdateTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.update — id: ${id}`);
    return this.nats.send('commerce', 'org.taxClasses.update', { id, ...dto });
  }

  // Activates or deactivates a tax class
  setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.setActive — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'org.taxClasses.setActive', { id, isActive });
  }

  // Deletes a tax class by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.taxClasses.delete', { id });
  }

  // Returns a class's paginated group mappings; the country comes from the saved table context
  async findGroupsForTable(userId: string, taxClassId: string): Promise<TaxClassGroupTableResponseDto> {
    this.logger.log(`org.taxClasses.groups.table — taxClassId: ${taxClassId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-tax-class-groups');
    const { result, count } = await this.nats.send<{ result: TaxClassGroupResponseDto[]; count: number }>(
      'commerce',
      'org.taxClasses.groups.table',
      { taxClassId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Maps a class to a tax group in the group's country
  createGroup(
    taxClassId: string,
    dto: CreateTaxClassGroupOnClassDto,
  ): Promise<CreateResponseDto<TaxClassGroupResponseDto>> {
    this.logger.log(`org.taxClasses.groups.create — taxClassId: ${taxClassId}, taxGroupId: ${dto.taxGroupId}`);
    return this.nats.send('commerce', 'org.taxClasses.groups.create', { taxClassId, ...dto });
  }

  // Updates a group mapping of a class
  updateGroup(taxClassId: string, id: string, dto: UpdateTaxClassGroupOnClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxClasses.groups.update — taxClassId: ${taxClassId}, id: ${id}`);
    return this.nats.send('commerce', 'org.taxClasses.groups.update', { taxClassId, id, ...dto });
  }

  // Removes a group mapping of a class
  deleteGroup(taxClassId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxClasses.groups.delete — taxClassId: ${taxClassId}, id: ${id}`);
    return this.nats.send('commerce', 'org.taxClasses.groups.delete', { taxClassId, id });
  }
}
