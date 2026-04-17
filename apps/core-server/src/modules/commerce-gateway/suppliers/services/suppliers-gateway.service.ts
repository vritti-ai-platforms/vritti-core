import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { LinkSupplierItemDto } from '../dto/request/link-supplier-item.dto';
import type { UpdateSupplierDto } from '../dto/request/update-supplier.dto';
import type { SupplierResponseDto } from '../dto/response/supplier-response.dto';
import type { SupplierTableResponseDto } from '../dto/response/supplier-table-response.dto';

@Injectable()
export class SuppliersGatewayService {
  private readonly logger = new Logger(SuppliersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted suppliers for the data table
  async findForTable(userId: string): Promise<SupplierTableResponseDto> {
    this.logger.log('suppliers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-suppliers');

    const { result, count } = await this.nats.send<{ result: SupplierResponseDto[]; count: number }>(
      'commerce',
      'suppliers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated supplier options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('suppliers.select');
    return this.nats.send('commerce', 'suppliers.select', params);
  }

  // Creates a new supplier
  async create(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    this.logger.log(`suppliers.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'suppliers.create', dto);
  }

  // Finds a supplier by ID
  async findById(id: string): Promise<SupplierResponseDto> {
    this.logger.log(`suppliers.findById — id: ${id}`);
    return this.nats.send('commerce', 'suppliers.findById', { id });
  }

  // Updates a supplier by ID
  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    this.logger.log(`suppliers.update — id: ${id}`);
    return this.nats.send('commerce', 'suppliers.update', { id, ...dto });
  }

  // Deletes a supplier by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`suppliers.delete — id: ${id}`);
    return this.nats.send('commerce', 'suppliers.delete', { id });
  }

  // Links an inventory item to a supplier
  async linkItem(supplierId: string, dto: LinkSupplierItemDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`suppliers.linkItem — supplierId: ${supplierId}, itemId: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'suppliers.linkItem', { supplierId, ...dto });
  }

  // Unlinks an inventory item from a supplier
  async unlinkItem(supplierItemId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`suppliers.unlinkItem — supplierItemId: ${supplierItemId}`);
    return this.nats.send('commerce', 'suppliers.unlinkItem', { id: supplierItemId });
  }

  // Returns the unit price for a supplier-item pair
  async findItemPrice(supplierId: string, inventoryItemId: string): Promise<{ unitPrice: number | null }> {
    this.logger.log(`suppliers.findItemPrice — supplierId: ${supplierId}, itemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'suppliers.findItemPrice', { supplierId, inventoryItemId });
  }
}
