import type { SupplierDetailDto, SupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
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

  @MessagePattern({ cmd: 'suppliers.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: SupplierDto[]; count: number }> {
    this.logger.log('suppliers.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'suppliers.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('suppliers.select');
    return this.service.findForSelect(data);
  }

  @MessagePattern({ cmd: 'suppliers.create' })
  async create(@Payload() dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    this.logger.log(`suppliers.create — name: ${dto.name}`);
    return this.suppliersRootService.create(dto);
  }

  @MessagePattern({ cmd: 'suppliers.findById' })
  async findById(@Payload() data: { id: string }): Promise<SupplierDetailDto> {
    this.logger.log('suppliers.findById');
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'suppliers.update' })
  async update(@Payload() data: { id: string } & UpdateSupplierDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log('suppliers.update');
    return this.service.update(id, updateData);
  }

  @MessagePattern({ cmd: 'suppliers.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.delete');
    return this.service.delete(data.id);
  }
}
