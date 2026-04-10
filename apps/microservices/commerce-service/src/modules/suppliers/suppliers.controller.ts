import type { SupplierDetailDto, SupplierDto, SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SelectQueryResult, SortCondition } from '@vritti/api-sdk';
import type { CreateSupplierDto } from './dto/request/create-supplier.dto';
import type { LinkSupplierItemDto } from './dto/request/link-supplier-item.dto';
import type { UpdateSupplierDto } from './dto/request/update-supplier.dto';

@Controller()
export class SuppliersController {
  private readonly logger = new Logger(SuppliersController.name);

  constructor(private readonly service: SuppliersService) {}

  @MessagePattern({ cmd: 'suppliers.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: SupplierDto[]; count: number }> {
    this.logger.log('suppliers.table');
    return this.service.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  @MessagePattern({ cmd: 'suppliers.select' })
  async select(
    @Payload() data: { search?: string; limit?: number; offset?: number; values?: string; excludeIds?: string },
  ): Promise<SelectQueryResult> {
    this.logger.log('suppliers.select');
    return this.service.findForSelect(data);
  }

  @MessagePattern({ cmd: 'suppliers.create' })
  async create(@Payload() dto: CreateSupplierDto): Promise<SupplierDto> {
    this.logger.log(`suppliers.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'suppliers.findById' })
  async findById(@Payload() data: { id: string }): Promise<SupplierDetailDto> {
    this.logger.log(`suppliers.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'suppliers.update' })
  async update(@Payload() data: { id: string } & UpdateSupplierDto): Promise<SupplierDto> {
    const { id, ...updateData } = data;
    this.logger.log(`suppliers.update — id: ${id}`);
    return this.service.update(id, updateData);
  }

  @MessagePattern({ cmd: 'suppliers.delete' })
  async delete(@Payload() data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`suppliers.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  @MessagePattern({ cmd: 'suppliers.linkItem' })
  async linkItem(@Payload() data: { supplierId: string } & LinkSupplierItemDto): Promise<SupplierItemDto> {
    const { supplierId, ...itemData } = data;
    this.logger.log(`suppliers.linkItem — supplierId: ${supplierId}`);
    return this.service.linkItem(supplierId, itemData);
  }

  @MessagePattern({ cmd: 'suppliers.unlinkItem' })
  async unlinkItem(@Payload() data: { supplierItemId: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`suppliers.unlinkItem — id: ${data.supplierItemId}`);
    return this.service.unlinkItem(data.supplierItemId);
  }
}
