import type { SupplierDetailDto, SupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import type { ChangeSupplierCurrencyDto } from './dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from './dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from './dto/request/update-supplier.dto';
import { SuppliersRootService } from './services/suppliers-root.service';

@Controller()
export class SuppliersRootController {
  private readonly logger = new Logger(SuppliersRootController.name);

  constructor(
    private readonly service: SuppliersService,
    private readonly suppliersRootService: SuppliersRootService,
  ) {}

  @MessagePattern({ cmd: 'le.suppliers.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: SupplierDto[]; count: number }> {
    this.logger.log('suppliers.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'le.suppliers.create' })
  async create(@Payload() dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    this.logger.log(`suppliers.create — name: ${dto.name}`);
    return this.suppliersRootService.create(dto);
  }

  @MessagePattern({ cmd: 'le.suppliers.findById' })
  async findById(@Payload() data: { id: string }): Promise<SupplierDetailDto> {
    this.logger.log('suppliers.findById');
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'le.suppliers.update' })
  async update(@Payload() data: { id: string } & UpdateSupplierDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log('suppliers.update');
    return this.service.update(id, updateData);
  }

  @MessagePattern({ cmd: 'le.suppliers.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.delete');
    return this.service.delete(data.id);
  }

  @MessagePattern({ cmd: 'le.suppliers.changeCurrency' })
  async changeCurrency(@Payload() data: { id: string } & ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    this.logger.log(`suppliers.changeCurrency — id: ${id}, currency: ${dto.currencyCode}`);
    return this.suppliersRootService.changeCurrency(id, dto);
  }
}
