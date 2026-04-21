import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type PurchaseOrderStatus, PurchaseOrderStatusValues, purchaseOrderItems, purchaseOrders } from '@/db/schema';
import type { AddPurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { CreatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/update-purchase-order-item.dto';
import { PurchaseOrderDto, PurchaseOrderItemDto } from '../dto/entity/purchase-order.dto';
import { PurchaseOrderItemsRepository } from '../repositories/purchase-order-items.repository';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders.repository';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    status: { column: purchaseOrders.status, type: 'string' },
    supplierId: { column: purchaseOrders.supplierId, type: 'string' },
  };

  private static readonly STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    [PurchaseOrderStatusValues.DRAFT]: [PurchaseOrderStatusValues.SENT],
    [PurchaseOrderStatusValues.SENT]: [PurchaseOrderStatusValues.CONFIRMED, PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.CONFIRMED]: [
      PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
      PurchaseOrderStatusValues.RECEIVED,
      PurchaseOrderStatusValues.CANCELLED,
    ],
    [PurchaseOrderStatusValues.PARTIALLY_RECEIVED]: [
      PurchaseOrderStatusValues.RECEIVED,
      PurchaseOrderStatusValues.CANCELLED,
    ],
    [PurchaseOrderStatusValues.RECEIVED]: [],
    [PurchaseOrderStatusValues.CANCELLED]: [],
  };

  private static readonly ITEM_FIELD_MAP: FieldMap = {
    inventoryItemId: { column: purchaseOrderItems.inventoryItemId, type: 'string' },
    orderedQuantity: { column: purchaseOrderItems.orderedQuantity, type: 'number' },
    receivedQuantity: { column: purchaseOrderItems.receivedQuantity, type: 'number' },
    supplierUnitPrice: { column: purchaseOrderItems.supplierUnitPrice, type: 'number' },
    unitPrice: { column: purchaseOrderItems.unitPrice, type: 'number' },
    totalPrice: { column: purchaseOrderItems.totalPrice, type: 'number' },
  };

  constructor(
    private readonly repository: PurchaseOrdersRepository,
    private readonly poItemsRepository: PurchaseOrderItemsRepository,
    private readonly suppliersService: SuppliersService,
  ) {}

  // Returns paginated purchase order options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const { status, supplierId } = query as SelectOptionsQueryDto & { status?: string; supplierId?: string };
    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'poNumber',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      where: Object.keys(where).length > 0 ? where : undefined,
      orderByKey: query.orderByKey || 'poNumber',
      orderDirection: query.orderDirection || 'desc',
    });
  }

  // Returns paginated POs for the data table
  async findForTable(state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PurchaseOrdersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PurchaseOrdersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrdersService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrders.createdAt)],
      limit,
      offset,
    });

    return {
      result: rows.map((entity) => PurchaseOrderDto.from(entity, entity.supplierName, entity.supplierCurrencyCode)),
      count,
    };
  }

  // Creates a new PO with line items
  async create(data: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const supplier = await this.suppliersService.findById(data.supplierId);
    const supplierCurrencyCode = supplier.currencyCode;
    const isSameCurrency = supplierCurrencyCode === data.currencyCode;
    const conversionRate = isSameCurrency ? 1 : data.conversionRate;

    if (!isSameCurrency && (conversionRate == null || conversionRate <= 0)) {
      throw new BadRequestException({
        label: 'Invalid Conversion Rate',
        detail: `Conversion rate is required and must be greater than 0 when supplier currency (${supplierCurrencyCode}) differs from PO currency (${data.currencyCode}).`,
        errors: [{ field: 'conversionRate', message: 'Conversion rate must be greater than 0.' }],
      });
    }

    const poNumber = await this.repository.generatePoNumber();
    const entity = await this.repository.transaction(async (tx) => {
      const created = await this.repository.create(
        {
          supplierId: data.supplierId,
          poNumber,
          currencyCode: data.currencyCode,
          conversionRate: String(conversionRate ?? 1),
          orderDate: data.orderDate,
          expectedBy: data.expectedBy ?? null,
          notes: data.notes ?? null,
        },
        tx,
      );

      return created;
    });

    const detailed = await this.repository.findByIdWithSupplierName(entity.id);
    if (!detailed) throw new NotFoundException('Purchase order not found.');

    this.logger.log(`Created PO: ${entity.poNumber}`);
    return {
      success: true,
      message: `Purchase order "${entity.poNumber}" created successfully.`,
      data: PurchaseOrderDto.from(detailed, detailed.supplierName, detailed.supplierCurrencyCode),
    };
  }

  // Returns PO header/detail without line items
  async findById(id: string): Promise<PurchaseOrderDto> {
    const entity = await this.repository.findByIdWithSupplierName(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    return PurchaseOrderDto.from(entity, entity.supplierName, entity.supplierCurrencyCode);
  }

  // Adds a line item to a draft PO
  async addItem(id: string, data: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const existing = await this.repository.findByIdWithSupplierName(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const duplicate = await this.poItemsRepository.findItemByInventoryItemId(id, data.inventoryItemId);
    if (duplicate) {
      throw new BadRequestException({
        label: 'Duplicate Item',
        detail: 'This inventory item is already added to the purchase order.',
      });
    }

    const resolvedUnitPrice =
      data.unitPrice != null ? data.unitPrice : data.supplierUnitPrice * Number(existing.conversionRate);

    await this.poItemsRepository.create({
      purchaseOrderId: id,
      inventoryItemId: data.inventoryItemId,
      orderedQuantity: String(data.orderedQuantity),
      supplierUnitPrice: data.supplierUnitPrice,
      unitPrice: resolvedUnitPrice,
      totalPrice: resolvedUnitPrice * data.orderedQuantity,
    });

    this.logger.log(`Added PO item: ${existing.poNumber} (${existing.id})`);
    return {
      success: true,
      message: `Line item added to purchase order "${existing.poNumber}".`,
      data: PurchaseOrderDto.from(existing, existing.supplierName, existing.supplierCurrencyCode),
    };
  }

  // Updates a line item on a draft PO
  async updateItem(id: string, itemId: string, data: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const item = await this.poItemsRepository.findItemById(id, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');

    if (data.inventoryItemId && data.inventoryItemId !== item.inventoryItemId) {
      const duplicate = await this.poItemsRepository.findItemByInventoryItemId(id, data.inventoryItemId);
      if (duplicate) {
        throw new BadRequestException({
          label: 'Duplicate Item',
          detail: 'This inventory item is already added to the purchase order.',
        });
      }
    }

    const orderedQuantity = data.orderedQuantity ?? Number(item.orderedQuantity);
    const supplierUnitPrice = data.supplierUnitPrice !== undefined ? data.supplierUnitPrice : Number(item.supplierUnitPrice);
    const unitPrice =
      data.unitPrice != null
        ? data.unitPrice
        : item.unitPrice
          ? Number(item.unitPrice)
          : supplierUnitPrice * Number(existing.conversionRate);

    await this.poItemsRepository.update(itemId, {
      inventoryItemId: data.inventoryItemId,
      orderedQuantity: String(orderedQuantity),
      supplierUnitPrice,
      unitPrice,
      totalPrice: unitPrice * orderedQuantity,
    });

    this.logger.log(`Updated PO item: ${existing.poNumber} (${itemId})`);
    return { success: true, message: `Line item updated for purchase order "${existing.poNumber}".` };
  }

  // Removes a line item from a draft PO
  async removeItem(id: string, itemId: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const item = await this.poItemsRepository.findItemById(id, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');

    await this.poItemsRepository.delete(itemId);
    this.logger.log(`Removed PO item: ${existing.poNumber} (${itemId})`);
    return { success: true, message: `Line item removed from purchase order "${existing.poNumber}".` };
  }

  // Updates notes on a purchase order
  async updateNotes(id: string, notes: string | null): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    const entity = await this.repository.update(id, { notes: notes ?? null });
    this.logger.log(`Updated PO notes: ${entity.poNumber} (${entity.id})`);
    return { success: true, message: `Notes updated for purchase order "${entity.poNumber}".` };
  }

  // Changes supplier on a draft PO with no line items
  async changeSupplier(id: string, supplierId: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    const supplier = await this.suppliersService.findById(supplierId);
    const supplierName = supplier.name;
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Supplier can only be changed while the purchase order is in draft.',
      });
    }

    const currentItems = await this.poItemsRepository.findItemsByPoId(id);
    if (currentItems.length > 0) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Remove all line items before changing the supplier.',
      });
    }

    const entity = await this.repository.update(id, { supplierId });
    this.logger.log(`Changed PO supplier: ${entity.poNumber} (${entity.id})`);
    return {
      success: true,
      message: `Supplier changed to "${supplierName}" for purchase order "${entity.poNumber}".`,
    };
  }

  // Changes currency on a draft PO and recalculates line prices from supplier price
  async changeCurrency(id: string, currencyCode: string, conversionRate?: number): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Change Currency',
        detail: 'Currency can only be changed while the purchase order is in draft.',
      });
    }

    const supplier = await this.suppliersService.findById(existing.supplierId);
    const isSameCurrency = supplier.currencyCode === currencyCode;
    const nextConversionRate = isSameCurrency ? 1 : conversionRate;

    if (!isSameCurrency && (nextConversionRate == null || nextConversionRate <= 0)) {
      throw new BadRequestException({
        label: 'Invalid Conversion Rate',
        detail: `Conversion rate is required and must be greater than 0 when supplier currency (${supplier.currencyCode}) differs from PO currency (${currencyCode}).`,
        errors: [{ field: 'conversionRate', message: 'Conversion rate must be greater than 0.' }],
      });
    }

    await this.repository.transaction(async (tx) => {
      const resolvedConversionRate = Number(nextConversionRate ?? 1);
      await this.repository.updateCurrency(
        id,
        {
          currencyCode,
          conversionRate: String(resolvedConversionRate),
        },
        tx,
      );

      await this.poItemsRepository.recalculateLinePricingByPoId(id, resolvedConversionRate, tx);
    });

    this.logger.log(`Changed PO currency: ${existing.poNumber} (${id}) -> ${currencyCode}`);
    return {
      success: true,
      message: `Currency changed to "${currencyCode}" for purchase order "${existing.poNumber}".`,
    };
  }

  // Returns all line items for a PO
  async findItems(id: string): Promise<PurchaseOrderItemDto[]> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    const itemsWithNames = await this.poItemsRepository.findItemsByPoId(id);
    return itemsWithNames.map((item) => PurchaseOrderItemDto.from(item, item.inventoryItemName));
  }

  // Returns inventory item IDs for a PO
  async findItemIds(id: string): Promise<string[]> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    return this.poItemsRepository.findItemIdsByPoId(id);
  }

  // Returns paginated line items for a PO table
  async findItemsForTable(
    id: string,
    state: TableViewState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');

    const filterWhere = FilterProcessor.buildWhere(state.filters, PurchaseOrdersService.ITEM_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PurchaseOrdersService.ITEM_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrdersService.ITEM_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.poItemsRepository.findItemsForTable(id, {
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrderItems.inventoryItemId)],
      limit,
      offset,
    });

    return {
      result: result.map((item) => PurchaseOrderItemDto.from(item, item.inventoryItemName)),
      count,
    };
  }

  // Transitions PO status
  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    const allowedNext = PurchaseOrdersService.STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowedNext.includes(status)) {
      throw new BadRequestException(`Cannot transition purchase order status from ${existing.status} to ${status}.`);
    }
    const entity = await this.repository.update(id, { status });
    this.logger.log(`PO ${entity.poNumber} status → ${status}`);
    return { success: true, message: `Purchase order "${entity.poNumber}" status updated to ${status}.` };
  }

  // Deletes a PO (only if DRAFT)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Delete', detail: 'Only draft purchase orders can be deleted.' });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted PO: ${existing.poNumber} (${id})`);
    return { success: true, message: `Purchase order "${existing.poNumber}" deleted successfully.` };
  }
}
