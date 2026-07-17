import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AddSupplierItemDto } from '../dto/request/add-supplier-item.dto';
import type { BulkSetSupplierItemPreferredDto } from '../dto/request/bulk-set-supplier-item-preferred.dto';
import type { BulkSetSupplierItemSchemeDto } from '../dto/request/bulk-set-supplier-item-scheme.dto';
import type { BulkUnlinkSupplierItemsDto } from '../dto/request/bulk-unlink-supplier-items.dto';
import type { ChangeSupplierCurrencyDto } from '../dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { UpdateSupplierDto } from '../dto/request/update-supplier.dto';
import type { UpdateSupplierItemDto } from '../dto/request/update-supplier-item.dto';
import type { SupplierItemResponseDto } from '../dto/response/supplier-item-response.dto';
import type { SupplierItemTableResponseDto } from '../dto/response/supplier-item-table-response.dto';
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
    this.logger.log('le.suppliers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-le-suppliers');

    const { result, count } = await this.nats.send<{ result: SupplierResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new supplier
  async create(dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierResponseDto>> {
    this.logger.log(`le.suppliers.create — partyId: ${dto.partyId}, code: ${dto.code}`);
    return this.nats.send('commerce', 'le.suppliers.create', dto);
  }

  // Finds a supplier by ID
  async findById(id: string): Promise<SupplierResponseDto> {
    this.logger.log('le.suppliers.findById');
    return this.nats.send('commerce', 'le.suppliers.findById', { id });
  }

  // Returns linked supplier items for the table
  async findItemsTable(supplierId: string, userId: string): Promise<SupplierItemTableResponseDto> {
    this.logger.log('le.suppliers.itemsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-${supplierId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierItemResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.itemsTable',
      { supplierId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns linked inventory item IDs for a supplier
  async findItemIds(supplierId: string): Promise<string[]> {
    this.logger.log('le.suppliers.itemIds');
    return this.nats.send('commerce', 'le.suppliers.itemIds', { supplierId });
  }

  // Updates a supplier by ID
  async update(id: string, dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.update');
    return this.nats.send('commerce', 'le.suppliers.update', { id, ...dto });
  }

  // Deletes a supplier by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.delete');
    return this.nats.send('commerce', 'le.suppliers.delete', { id });
  }

  // Changes supplier currency and reprices all supplier items
  async changeCurrency(id: string, dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.changeCurrency — id: ${id}, currency: ${dto.currencyCode}`);
    return this.nats.send('commerce', 'le.suppliers.changeCurrency', { id, ...dto });
  }

  // Adds an inventory item to a supplier
  async addItem(supplierId: string, dto: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemResponseDto>> {
    this.logger.log(`le.suppliers.addItem — item: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'le.suppliers.addItem', { supplierId, ...dto });
  }

  // Updates a supplier item link
  async updateItem(
    supplierId: string,
    supplierItemId: string,
    dto: UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.updateItem — id: ${supplierItemId}`);
    return this.nats.send('commerce', 'le.suppliers.updateItem', { supplierId, supplierItemId, ...dto });
  }

  // Unlinks an inventory item from a supplier
  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.unlinkItem');
    return this.nats.send('commerce', 'le.suppliers.unlinkItem', { supplierId, supplierItemId });
  }

  // Bulk-unlinks multiple inventory items from a supplier
  async bulkUnlinkItems(supplierId: string, dto: BulkUnlinkSupplierItemsDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkUnlinkItems');
    return this.nats.send('commerce', 'le.suppliers.bulkUnlinkItems', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
    });
  }

  // Bulk-sets the free-goods scheme on multiple supplier items
  async bulkSetItemScheme(supplierId: string, dto: BulkSetSupplierItemSchemeDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemScheme');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemScheme', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      schemeBuyQty: dto.schemeBuyQty,
      schemeFreeQty: dto.schemeFreeQty,
      hasScheme: dto.hasScheme,
    });
  }

  // Bulk-marks supplier items as preferred (or clears it)
  async bulkSetItemPreferred(supplierId: string, dto: BulkSetSupplierItemPreferredDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.bulkSetItemPreferred');
    return this.nats.send('commerce', 'le.suppliers.bulkSetItemPreferred', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      isPreferred: dto.isPreferred,
    });
  }

  // Returns the unit price for a supplier-item pair
  async findItemPrice(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('le.suppliers.findItemPrice');
    return this.nats.send('commerce', 'le.suppliers.findItemPrice', { supplierId, inventoryItemId, uomId });
  }
}
