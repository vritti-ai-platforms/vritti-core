import type { CustomerDto } from '@domain/customers/dto/entity/customer.dto';
import { CreateCustomerDto } from '@domain/customers/dto/request/create-customer.dto';
import { UpdateCustomerDto } from '@domain/customers/dto/request/update-customer.dto';
import { CustomersDomainService } from '@domain/customers/services/customers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly service: CustomersDomainService) {}

  @MessagePattern({ cmd: 'site.customers.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: CustomerDto[]; count: number }> {
    this.logger.log('customers.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'site.customers.create' })
  async create(@Payload() dto: CreateCustomerDto): Promise<CustomerDto> {
    this.logger.log(`customers.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'site.customers.findById' })
  async findById(@Payload() data: { id: string }): Promise<CustomerDto> {
    this.logger.log(`customers.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.customers.update' })
  async update(@Payload() dto: UpdateCustomerDto): Promise<CustomerDto> {
    const { id, ...updateData } = dto;
    this.logger.log(`customers.update — id: ${id}`);
    return this.service.update(id, updateData);
  }

  @MessagePattern({ cmd: 'site.customers.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`customers.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
