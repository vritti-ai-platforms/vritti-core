import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateTaxClassDto } from '../dto/request/create-tax-class.dto';
import type { UpdateTaxClassDto } from '../dto/request/update-tax-class.dto';
import type { TaxClassResponseDto } from '../dto/response/tax-class-response.dto';
import type { TaxClassTableResponseDto } from '../dto/response/tax-class-table-response.dto';

@Injectable()
export class TaxClassesGatewayService {
  private readonly logger = new Logger(TaxClassesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted tax classes for the data table
  async findForTable(userId: string): Promise<TaxClassTableResponseDto> {
    this.logger.log('org.taxClasses.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-org-tax-classes');

    const { result, count } = await this.nats.send<{ result: TaxClassResponseDto[]; count: number }>(
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

  // Deletes a tax class by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.taxClasses.delete', { id });
  }
}
