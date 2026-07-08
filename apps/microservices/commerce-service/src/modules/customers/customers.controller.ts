import type { CustomerDto } from '@domain/customers/dto/entity/customer.dto';
import { CustomersService } from '@domain/customers/services/customers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import type { CreateCustomerDto } from './dto/request/create-customer.dto';
import type { UpdateCustomerDto } from './dto/request/update-customer.dto';

@Controller()
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly service: CustomersService) {}

  @MessagePattern({ cmd: 'customers.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: CustomerDto[]; count: number }> {
    this.logger.log('customers.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'customers.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('customers.select');
    return this.service.findForSelect(data);
  }

  @MessagePattern({ cmd: 'customers.create' })
  async create(@Payload() dto: CreateCustomerDto): Promise<CustomerDto> {
    this.logger.log(`customers.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'customers.findById' })
  async findById(@Payload() data: { id: string }): Promise<CustomerDto> {
    this.logger.log(`customers.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'customers.update' })
  async update(@Payload() data: { id: string } & UpdateCustomerDto): Promise<CustomerDto> {
    const { id, ...updateData } = data;
    this.logger.log(`customers.update — id: ${id}`);
    return this.service.update(id, updateData);
  }

  @MessagePattern({ cmd: 'customers.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`customers.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
