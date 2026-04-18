import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type PurchaseOrderStatus, PurchaseOrderStatusValues, purchaseOrderItems, purchaseOrders } from '@/db/schema';
import type { CreatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/update-purchase-order.dto';
import { PurchaseOrderDto, PurchaseOrderItemDto } from '../dto/entity/purchase-order.dto';
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
    [PurchaseOrderStatusValues.DRAFT]: [PurchaseOrderStatusValues.SENT, PurchaseOrderStatusValues.CANCELLED],
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
    unitPrice: { column: purchaseOrderItems.unitPrice, type: 'number' },
    totalPrice: { column: purchaseOrderItems.totalPrice, type: 'number' },
  };

  constructor(private readonly repository: PurchaseOrdersRepository) {}

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
      groupId: query.groupIdKey,
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

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrders.createdAt)],
      limit,
      offset,
    });

    const dtos: PurchaseOrderDto[] = [];
    for (const entity of rows) {
      const supplierName = await this.repository.findSupplierName(entity.supplierId);
      dtos.push(PurchaseOrderDto.from(entity, supplierName));
    }

    return { result: dtos, count };
  }

  // Creates a new PO with line items
  async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrderDto> {
    const poNumber = await this.repository.generatePoNumber();
    const entity = await this.repository.transaction(async (tx) => {
      const created = await this.repository.create(
        {
          supplierId: data.supplierId,
          poNumber,
          orderDate: data.orderDate,
          expectedDate: data.expectedDate ?? null,
          notes: data.notes ?? null,
        },
        tx,
      );

      await this.repository.createItemsWithTx(
        tx,
        (data.items ?? []).map((item) => ({
          purchaseOrderId: created.id,
          inventoryItemId: item.inventoryItemId,
          orderedQuantity: String(item.orderedQuantity),
        })),
      );

      return created;
    });

    const supplierName = await this.repository.findSupplierName(entity.supplierId);
    this.logger.log(`Created PO: ${entity.poNumber}`);
    return PurchaseOrderDto.from(entity, supplierName);
  }

  // Returns PO header/detail without line items
  async findById(id: string): Promise<PurchaseOrderDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    const supplierName = await this.repository.findSupplierName(entity.supplierId);
    return PurchaseOrderDto.from(entity, supplierName);
  }

  // Updates a PO (scalar fields + optionally replaces items)
  async update(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrderDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.orderDate !== undefined) updatePayload.orderDate = data.orderDate;
    if (data.expectedDate !== undefined) updatePayload.expectedDate = data.expectedDate;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.totalAmount !== undefined)
      updatePayload.totalAmount = data.totalAmount != null ? String(data.totalAmount) : null;

    const entity = await this.repository.transaction(async (tx) => {
      const updated =
        Object.keys(updatePayload).length > 0 ? await this.repository.update(id, updatePayload, tx) : existing;

      if (data.items !== undefined) {
        await this.repository.deleteItemsByPoIdWithTx(tx, id);
        await this.repository.createItemsWithTx(
          tx,
          data.items.map((item) => ({
            purchaseOrderId: id,
            inventoryItemId: item.inventoryItemId,
            orderedQuantity: String(item.orderedQuantity),
            unitPrice: item.unitPrice != null ? String(item.unitPrice) : null,
            totalPrice: item.unitPrice != null ? String(Number(item.unitPrice) * item.orderedQuantity) : null,
          })),
        );
      }

      return updated;
    });

    const supplierName = await this.repository.findSupplierName(entity.supplierId);
    this.logger.log(`Updated PO: ${entity.poNumber} (${entity.id})`);
    return PurchaseOrderDto.from(entity, supplierName);
  }

  // Returns all line items for a PO
  async findItems(id: string): Promise<PurchaseOrderItemDto[]> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    const itemsWithNames = await this.repository.findItemsByPoId(id);
    return itemsWithNames.map((item) => PurchaseOrderItemDto.from(item, item.inventoryItemName));
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

    const { result, count } = await this.repository.findItemsForTable(id, {
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrderItems.inventoryItemId)],
      limit,
      offset,
    });

    const nameById = await this.repository.findInventoryItemNames(result.map((item) => item.inventoryItemId));

    return {
      result: result.map((item) => PurchaseOrderItemDto.from(item, nameById.get(item.inventoryItemId) ?? null)),
      count,
    };
  }

  // Transitions PO status
  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrderDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    const allowedNext = PurchaseOrdersService.STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowedNext.includes(status)) {
      throw new BadRequestException(`Cannot transition purchase order status from ${existing.status} to ${status}.`);
    }
    const entity = await this.repository.update(id, { status });
    const supplierName = await this.repository.findSupplierName(entity.supplierId);
    this.logger.log(`PO ${entity.poNumber} status → ${status}`);
    return PurchaseOrderDto.from(entity, supplierName);
  }

  // Deletes a PO (only if DRAFT)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Delete', detail: 'Only draft purchase orders can be deleted.' });
    }
    await this.repository.deleteItemsByPoId(id);
    await this.repository.delete(id);
    this.logger.log(`Deleted PO: ${existing.poNumber} (${id})`);
    return { success: true, message: `Purchase order "${existing.poNumber}" deleted successfully.` };
  }
}
