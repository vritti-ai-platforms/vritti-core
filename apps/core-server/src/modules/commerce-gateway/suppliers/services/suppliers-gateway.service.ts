import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  DataTableStateService,
  NatsClientService,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreateSupplierContactDto } from '../dto/request/create-supplier-contact.dto';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { LinkSupplierItemDto } from '../dto/request/link-supplier-item.dto';
import type { UpdateSupplierContactDto } from '../dto/request/update-supplier-contact.dto';
import type { UpdateSupplierDto } from '../dto/request/update-supplier.dto';
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

  // Returns linked supplier items for the table
  async findItemsTable(supplierId: string, userId: string): Promise<SupplierItemTableResponseDto> {
    this.logger.log(`suppliers.itemsTable — supplierId: ${supplierId}`);
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
    this.logger.log(`suppliers.itemIds — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'suppliers.itemIds', { supplierId });
  }

  // Returns supplier contacts
  async findContacts(supplierId: string): Promise<SupplierContactResponseDto[]> {
    this.logger.log(`suppliers.contacts — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'suppliers.contacts', { supplierId });
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
  async linkItem(supplierId: string, dto: LinkSupplierItemDto): Promise<CreateResponseDto<SupplierItemResponseDto>> {
    this.logger.log(`suppliers.linkItem — supplierId: ${supplierId}, itemId: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'suppliers.linkItem', { supplierId, ...dto });
  }

  // Unlinks an inventory item from a supplier
  async unlinkItem(supplierId: string, supplierItemId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`suppliers.unlinkItem — supplierId: ${supplierId}, supplierItemId: ${supplierItemId}`);
    return this.nats.send('commerce', 'suppliers.unlinkItem', { supplierId, supplierItemId });
  }

  // Adds a contact to a supplier
  async addContact(supplierId: string, dto: CreateSupplierContactDto): Promise<SupplierContactResponseDto> {
    this.logger.log(`suppliers.addContact — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'suppliers.addContact', { supplierId, ...dto });
  }

  // Updates a supplier contact
  async updateContact(supplierId: string, contactId: string, dto: UpdateSupplierContactDto): Promise<SupplierContactResponseDto> {
    this.logger.log(`suppliers.updateContact — supplierId: ${supplierId}, contactId: ${contactId}`);
    return this.nats.send('commerce', 'suppliers.updateContact', { supplierId, contactId, ...dto });
  }

  // Deletes a supplier contact
  async deleteContact(supplierId: string, contactId: string): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.deleteContact — supplierId: ${supplierId}, contactId: ${contactId}`);
    return this.nats.send('commerce', 'suppliers.deleteContact', { supplierId, contactId });
  }

  // Marks a supplier contact as primary
  async markPrimaryContact(supplierId: string, contactId: string): Promise<SupplierContactResponseDto> {
    this.logger.log(`suppliers.markPrimaryContact — supplierId: ${supplierId}, contactId: ${contactId}`);
    return this.nats.send('commerce', 'suppliers.markPrimaryContact', { supplierId, contactId });
  }

  // Returns the unit price for a supplier-item pair
  async findItemPrice(supplierId: string, inventoryItemId: string): Promise<{ unitPrice: number | null }> {
    this.logger.log(`suppliers.findItemPrice — supplierId: ${supplierId}, itemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'suppliers.findItemPrice', { supplierId, inventoryItemId });
  }
}
