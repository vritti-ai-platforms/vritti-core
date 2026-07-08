import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, DataTableStateService, type SuccessResponseDto } from '@vritti/api-sdk';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AddSupplierItemDto } from '../dto/request/add-supplier-item.dto';
import type { BulkSetSupplierItemPreferredDto } from '../dto/request/bulk-set-supplier-item-preferred.dto';
import type { BulkSetSupplierItemSchemeDto } from '../dto/request/bulk-set-supplier-item-scheme.dto';
import type { BulkUnlinkSupplierItemsDto } from '../dto/request/bulk-unlink-supplier-items.dto';
import type { ChangeSupplierCurrencyDto } from '../dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { CreateSupplierContactDto } from '../dto/request/create-supplier-contact.dto';
import type { UpdateSupplierDto } from '../dto/request/update-supplier.dto';
import type { UpdateSupplierContactDto } from '../dto/request/update-supplier-contact.dto';
import type { UpdateSupplierItemDto } from '../dto/request/update-supplier-item.dto';
import type { SupplierContactResponseDto } from '../dto/response/supplier-contact-response.dto';
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
    this.logger.log('suppliers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-suppliers');

    const { result, count } = await this.nats.send<{ result: SupplierResponseDto[]; count: number }>(
      'commerce',
      'suppliers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }


  // Creates a new supplier
  async create(dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierResponseDto>> {
    this.logger.log(`suppliers.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'suppliers.create', dto);
  }

  // Finds a supplier by ID
  async findById(id: string): Promise<SupplierResponseDto> {
    this.logger.log('suppliers.findById');
    return this.nats.send('commerce', 'suppliers.findById', { id });
  }

  // Returns linked supplier items for the table
  async findItemsTable(supplierId: string, userId: string): Promise<SupplierItemTableResponseDto> {
    this.logger.log('suppliers.itemsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-${supplierId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierItemResponseDto[]; count: number }>(
      'commerce',
      'suppliers.itemsTable',
      { supplierId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns linked inventory item IDs for a supplier
  async findItemIds(supplierId: string): Promise<string[]> {
    this.logger.log('suppliers.itemIds');
    return this.nats.send('commerce', 'suppliers.itemIds', { supplierId });
  }

  // Returns supplier contacts
  async findContacts(supplierId: string): Promise<SupplierContactResponseDto[]> {
    this.logger.log('suppliers.contacts');
    return this.nats.send('commerce', 'suppliers.contacts', { supplierId });
  }

  // Updates a supplier by ID
  async update(id: string, dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.update');
    return this.nats.send('commerce', 'suppliers.update', { id, ...dto });
  }

  // Deletes a supplier by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.delete');
    return this.nats.send('commerce', 'suppliers.delete', { id });
  }

  // Changes supplier currency and reprices all supplier items
  async changeCurrency(id: string, dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.changeCurrency — id: ${id}, currency: ${dto.currencyCode}`);
    return this.nats.send('commerce', 'suppliers.changeCurrency', { id, ...dto });
  }

  // Adds an inventory item to a supplier
  async addItem(supplierId: string, dto: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemResponseDto>> {
    this.logger.log(`suppliers.addItem — item: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'suppliers.addItem', { supplierId, ...dto });
  }

  // Updates a supplier item link
  async updateItem(
    supplierId: string,
    supplierItemId: string,
    dto: UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.updateItem — id: ${supplierItemId}`);
    return this.nats.send('commerce', 'suppliers.updateItem', { supplierId, supplierItemId, ...dto });
  }

  // Unlinks an inventory item from a supplier
  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.unlinkItem');
    return this.nats.send('commerce', 'suppliers.unlinkItem', { supplierId, supplierItemId });
  }

  // Bulk-unlinks multiple inventory items from a supplier
  async bulkUnlinkItems(supplierId: string, dto: BulkUnlinkSupplierItemsDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkUnlinkItems');
    return this.nats.send('commerce', 'suppliers.bulkUnlinkItems', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
    });
  }

  // Bulk-sets the free-goods scheme on multiple supplier items
  async bulkSetItemScheme(supplierId: string, dto: BulkSetSupplierItemSchemeDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemScheme');
    return this.nats.send('commerce', 'suppliers.bulkSetItemScheme', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      schemeBuyQty: dto.schemeBuyQty,
      schemeFreeQty: dto.schemeFreeQty,
      hasScheme: dto.hasScheme,
    });
  }

  // Bulk-marks supplier items as preferred (or clears it)
  async bulkSetItemPreferred(supplierId: string, dto: BulkSetSupplierItemPreferredDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemPreferred');
    return this.nats.send('commerce', 'suppliers.bulkSetItemPreferred', {
      supplierId,
      supplierItemIds: dto.supplierItemIds,
      isPreferred: dto.isPreferred,
    });
  }

  // Adds a contact to a supplier
  async addContact(
    supplierId: string,
    dto: CreateSupplierContactDto,
  ): Promise<CreateResponseDto<SupplierContactResponseDto>> {
    this.logger.log('suppliers.addContact');
    return this.nats.send('commerce', 'suppliers.addContact', { supplierId, ...dto });
  }

  // Updates a supplier contact
  async updateContact(
    supplierId: string,
    contactId: string,
    dto: UpdateSupplierContactDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.updateContact');
    return this.nats.send('commerce', 'suppliers.updateContact', { supplierId, contactId, ...dto });
  }

  // Deletes a supplier contact
  async deleteContact(supplierId: string, contactId: string): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.deleteContact');
    return this.nats.send('commerce', 'suppliers.deleteContact', { supplierId, contactId });
  }

  // Marks a supplier contact as primary
  async markPrimaryContact(supplierId: string, contactId: string): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.markPrimaryContact');
    return this.nats.send('commerce', 'suppliers.markPrimaryContact', { supplierId, contactId });
  }

  // Returns the unit price for a supplier-item pair
  async findItemPrice(supplierId: string, inventoryItemId: string): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('suppliers.findItemPrice');
    return this.nats.send('commerce', 'suppliers.findItemPrice', { supplierId, inventoryItemId });
  }
}
