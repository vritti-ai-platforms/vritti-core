import { Injectable, Logger } from '@nestjs/common';
import {
  DataTableStateService,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateCustomerDto } from '../dto/request/create-customer.dto';
import type { UpdateCustomerDto } from '../dto/request/update-customer.dto';
import type { CustomerResponseDto } from '../dto/response/customer-response.dto';
import type { CustomerTableResponseDto } from '../dto/response/customer-table-response.dto';

@Injectable()
export class CustomersGatewayService {
  private readonly logger = new Logger(CustomersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted customers for the data table
  async findForTable(userId: string): Promise<CustomerTableResponseDto> {
    this.logger.log('customers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-customers');

    const { result, count } = await this.nats.send<{ result: CustomerResponseDto[]; count: number }>(
      'commerce',
      'customers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated customer options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('customers.select');
    return this.nats.send('commerce', 'customers.select', params);
  }

  // Creates a new customer
  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    this.logger.log(`customers.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'customers.create', dto);
  }

  // Finds a customer by ID
  async findById(id: string): Promise<CustomerResponseDto> {
    this.logger.log(`customers.findById — id: ${id}`);
    return this.nats.send('commerce', 'customers.findById', { id });
  }

  // Updates a customer by ID and returns the full updated entity
  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    this.logger.log(`customers.update — id: ${id}`);
    return this.nats.send('commerce', 'customers.update', { id, ...dto });
  }

  // Deletes a customer by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`customers.delete — id: ${id}`);
    return this.nats.send('commerce', 'customers.delete', { id });
  }
}
