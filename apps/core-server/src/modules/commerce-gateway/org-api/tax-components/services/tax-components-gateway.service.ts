import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateTaxComponentDto } from '../dto/request/create-tax-component.dto';
import type { UpdateTaxComponentDto } from '../dto/request/update-tax-component.dto';
import type { TaxComponentResponseDto } from '../dto/response/tax-component-response.dto';
import type { TaxComponentTableResponseDto } from '../dto/response/tax-component-table-response.dto';

@Injectable()
export class TaxComponentsGatewayService {
  private readonly logger = new Logger(TaxComponentsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted tax components for the data table
  async findForTable(userId: string): Promise<TaxComponentTableResponseDto> {
    this.logger.log('org.taxComponents.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-org-tax-components');

    const { result, count } = await this.nats.send<{ result: TaxComponentResponseDto[]; count: number }>(
      'commerce',
      'org.taxComponents.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new tax component
  create(dto: CreateTaxComponentDto): Promise<CreateResponseDto<TaxComponentResponseDto>> {
    this.logger.log(`taxComponents.create — code: ${dto.code}`);
    return this.nats.send('commerce', 'org.taxComponents.create', dto);
  }

  // Finds a tax component by ID
  findById(id: string): Promise<TaxComponentResponseDto> {
    this.logger.log(`taxComponents.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.taxComponents.findById', { id });
  }

  // Updates a tax component by ID
  update(id: string, dto: UpdateTaxComponentDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxComponents.update — id: ${id}`);
    return this.nats.send('commerce', 'org.taxComponents.update', { id, ...dto });
  }

  // Deletes a tax component by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`taxComponents.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.taxComponents.delete', { id });
  }
}
