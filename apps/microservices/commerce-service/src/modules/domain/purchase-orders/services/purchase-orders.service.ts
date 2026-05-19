import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc, inArray } from '@vritti/api-sdk/drizzle-orm';
import { type CurrencyCode, majorToMinor, resolveCurrency } from '@vritti/api-sdk/money';
import {
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  purchaseOrderItems,
  purchaseOrders,
  suppliers,
} from '@/db/schema';
import type { AddPurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { CreatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/update-purchase-order-item.dto';
import { PurchaseOrderDto, PurchaseOrderItemDto } from '../dto/entity/purchase-order.dto';
import { PurchaseOrderItemsRepository } from '../repositories/purchase-order-items.repository';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders.repository';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    supplierName: { column: suppliers.name, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
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
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PurchaseOrdersRepository,
    private readonly poItemsRepository: PurchaseOrderItemsRepository,
  ) {}

  // Returns paginated purchase order options for select dropdowns.
  // `status` accepts a single value or a comma-separated list (e.g. "CONFIRMED,PARTIALLY_RECEIVED").
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const { status, supplierId } = query as SelectOptionsQueryDto & { status?: string; supplierId?: string };
    const where: Record<string, string> = {};
    if (supplierId) where.supplierId = supplierId;

    const statusList = status
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const conditions =
      statusList && statusList.length > 0
        ? [inArray(purchaseOrders.status, statusList as PurchaseOrderStatus[])]
        : undefined;

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
      conditions,
      orderByKey: query.orderByKey || 'poNumber',
      orderDirection: query.orderDirection || 'desc',
    });
  }

  // Returns paginated POs for the data table
  async findForTable(state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PurchaseOrdersService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PurchaseOrdersService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...PurchaseOrdersService.SEARCH_FIELD_MAP,
      ...PurchaseOrdersService.FILTER_FIELD_MAP,
      orderDate: { column: purchaseOrders.orderDate, type: 'string' },
    });
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

  // Creates a new PO with line items. App-layer fetches the supplier and passes currency context.
  async create(data: CreatePurchaseOrderDto, supplierCurrencyCode: string): Promise<CreateResponseDto<PurchaseOrderDto>> {
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
    const entity = await this.repository.create({
      supplierId: data.supplierId,
      poNumber,
      currencyCode: data.currencyCode,
      conversionRate: String(conversionRate ?? 1),
      orderDate: data.orderDate,
      expectedBy: data.expectedBy ?? null,
      notes: data.notes ?? null,
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

    const itemCurrencyCode = data.supplierUnitPrice.currency;
    const poCode = existing.currencyCode as CurrencyCode;
    const isSameCurrency = itemCurrencyCode === existing.currencyCode;

    // Auto-apply PO header rate when item currency matches PO currency; otherwise require a per-item rate
    let itemConversionRate: number;
    if (isSameCurrency) {
      itemConversionRate = Number(existing.conversionRate);
    } else {
      itemConversionRate = data.conversionRate as number;
      if (itemConversionRate == null || itemConversionRate <= 0) {
        throw new BadRequestException({
          label: 'Conversion Rate Required',
          detail: `Item currency (${itemCurrencyCode}) differs from PO currency (${existing.currencyCode}). A per-item conversion rate is required.`,
          errors: [{ field: 'conversionRate', message: 'Conversion rate must be greater than 0.' }],
        });
      }
    }

    if (data.unitPrice && data.unitPrice.currency !== poCode) {
      throw new BadRequestException({
        label: 'Currency Mismatch',
        detail: `unitPrice.currency must be ${poCode}.`,
      });
    }

    let supplierUnitPriceMinor: bigint;
    let unitPriceMinor: bigint;

    try {
      supplierUnitPriceMinor = majorToMinor(data.supplierUnitPrice.value, itemCurrencyCode as CurrencyCode);

      if (data.unitPrice != null) {
        unitPriceMinor = majorToMinor(data.unitPrice.value, poCode);
      } else {
        // Cross-currency scale: supplier_minor × rate × 10^poExp / 10^itemExp
        const itemExp = Number(resolveCurrency(itemCurrencyCode as CurrencyCode).exponent);
        const poExp = Number(resolveCurrency(poCode).exponent);
        const unitPriceNum = (Number(supplierUnitPriceMinor) * itemConversionRate * 10 ** poExp) / 10 ** itemExp;
        unitPriceMinor = BigInt(Math.round(unitPriceNum));
      }
    } catch (e) {
      throw new BadRequestException({
        label: 'Invalid Price',
        detail: e instanceof Error ? e.message : 'Invalid price value.',
      });
    }

    const totalPriceMinor = BigInt(Math.round(Number(unitPriceMinor) * data.orderedQuantity));

    await this.database.runInTransaction(async () => {
      await this.poItemsRepository.create({
        purchaseOrderId: id,
        inventoryItemId: data.inventoryItemId,
        orderedQuantity: String(data.orderedQuantity),
        supplierUnitPrice: Number(supplierUnitPriceMinor),
        unitPrice: Number(unitPriceMinor),
        totalPrice: Number(totalPriceMinor),
        itemCurrencyCode,
        conversionRate: String(itemConversionRate),
      });

      await this.repository.syncTotalAmount(id);
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
    const existing = await this.repository.findByIdWithSupplierName(id);
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

    const supplierCode = item.itemCurrencyCode as CurrencyCode;
    const poCode = existing.currencyCode as CurrencyCode;

    // Use provided per-item rate when currencies differ; otherwise keep the stored rate
    const conversionRate =
      data.conversionRate != null && supplierCode !== poCode ? data.conversionRate : Number(item.conversionRate);

    const orderedQuantity = data.orderedQuantity ?? Number(item.orderedQuantity);

    let supplierUnitPriceMinor: bigint;
    let unitPriceMinor: bigint;

    try {
      if (data.supplierUnitPrice !== undefined) {
        if (data.supplierUnitPrice.currency !== supplierCode) {
          throw new BadRequestException({
            label: 'Currency Mismatch',
            detail: `supplierUnitPrice.currency must be ${supplierCode}.`,
          });
        }
        supplierUnitPriceMinor = majorToMinor(data.supplierUnitPrice.value, supplierCode);
      } else {
        // Use existing minor value from DB directly
        supplierUnitPriceMinor = BigInt(item.supplierUnitPrice);
      }

      if (data.unitPrice != null) {
        if (data.unitPrice.currency !== poCode) {
          throw new BadRequestException({
            label: 'Currency Mismatch',
            detail: `unitPrice.currency must be ${poCode}.`,
          });
        }
        unitPriceMinor = majorToMinor(data.unitPrice.value, poCode);
      } else if (data.unitPrice === null) {
        // Explicitly cleared — derive from supplier price using item's conversion rate
        const itemExp = Number(resolveCurrency(supplierCode).exponent);
        const poExp = Number(resolveCurrency(poCode).exponent);
        const unitPriceNum = (Number(supplierUnitPriceMinor) * conversionRate * 10 ** poExp) / 10 ** itemExp;
        unitPriceMinor = BigInt(Math.round(unitPriceNum));
      } else {
        // data.unitPrice is undefined — keep existing minor value or derive if missing
        unitPriceMinor = item.unitPrice != null ? BigInt(item.unitPrice) : supplierUnitPriceMinor;
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException({
        label: 'Invalid Price',
        detail: e instanceof Error ? e.message : 'Invalid price value.',
      });
    }

    const totalPriceMinor = BigInt(Math.round(Number(unitPriceMinor) * orderedQuantity));

    await this.database.runInTransaction(async () => {
      await this.poItemsRepository.update(itemId, {
        inventoryItemId: data.inventoryItemId,
        orderedQuantity: String(orderedQuantity),
        supplierUnitPrice: Number(supplierUnitPriceMinor),
        unitPrice: Number(unitPriceMinor),
        totalPrice: Number(totalPriceMinor),
        conversionRate: String(conversionRate),
      });

      await this.repository.syncTotalAmount(id);
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

    await this.database.runInTransaction(async () => {
      await this.poItemsRepository.delete(itemId);
      await this.repository.syncTotalAmount(id);
    });
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

  // Changes supplier on a draft PO with no line items. App-layer fetches the supplier and passes name.
  async changeSupplier(id: string, supplierId: string, supplierName: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
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

  // Changes currency on a draft PO and recalculates line prices from supplier price.
  // App-layer fetches the supplier currency and passes it.
  async changeCurrency(id: string, currencyCode: string, supplierCurrencyCode: string, conversionRate?: number): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Change Currency',
        detail: 'Currency can only be changed while the purchase order is in draft.',
      });
    }

    const isSameCurrency = supplierCurrencyCode === currencyCode;
    const nextConversionRate = isSameCurrency ? 1 : conversionRate;

    if (!isSameCurrency && (nextConversionRate == null || nextConversionRate <= 0)) {
      throw new BadRequestException({
        label: 'Invalid Conversion Rate',
        detail: `Conversion rate is required and must be greater than 0 when supplier currency (${supplierCurrencyCode}) differs from PO currency (${currencyCode}).`,
        errors: [{ field: 'conversionRate', message: 'Conversion rate must be greater than 0.' }],
      });
    }

    const resolvedConversionRate = Number(nextConversionRate ?? 1);
    const newCurrencyCode = currencyCode as CurrencyCode;
    const poExp = Number(resolveCurrency(newCurrencyCode).exponent);

    const items = await this.poItemsRepository.findItemsByPoId(id);

    await this.database.runInTransaction(async () => {
      await this.repository.updateCurrency(id, {
        currencyCode,
        conversionRate: String(resolvedConversionRate),
      });

      for (const item of items) {
        // Items whose currency matches the new PO currency auto-adopt the PO header rate
        const itemRate =
          item.itemCurrencyCode === newCurrencyCode
            ? resolvedConversionRate
            : (conversionRate ?? Number(item.conversionRate));
        const itemExp = Number(resolveCurrency(item.itemCurrencyCode as CurrencyCode).exponent);
        await this.poItemsRepository.recalculateItemPricing(item.id, itemRate, poExp, itemExp);
      }

      await this.repository.syncTotalAmount(id);
    });
    this.logger.log(`Changed PO currency: ${existing.poNumber} (${id}) -> ${currencyCode}`);
    return {
      success: true,
      message: `Currency changed to "${currencyCode}" for purchase order "${existing.poNumber}".`,
    };
  }

  // Returns all line items for a PO
  async findItems(id: string): Promise<PurchaseOrderItemDto[]> {
    const entity = await this.repository.findByIdWithSupplierName(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    const itemsWithNames = await this.poItemsRepository.findItemsByPoId(id);
    return itemsWithNames.map((item) =>
      PurchaseOrderItemDto.from(item, item.inventoryItemName, entity.currencyCode),
    );
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
    const entity = await this.repository.findByIdWithSupplierName(id);
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
      result: result.map((item) =>
        PurchaseOrderItemDto.from(item, item.inventoryItemName, entity.currencyCode),
      ),
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
    if (status === PurchaseOrderStatusValues.SENT && Number(existing.totalAmount ?? 0) <= 0) {
      throw new BadRequestException({
        label: 'Cannot Mark as Sent',
        detail: 'Purchase order total amount must be greater than 0 before marking it as sent.',
      });
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
