import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type PurchaseOrderStatus, PurchaseOrderStatusValues, purchaseOrders } from '@/db/schema';
import type { CreatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/update-purchase-order.dto';
import { PurchaseOrderDetailDto, PurchaseOrderDto, PurchaseOrderItemDto } from '../dto/entity/purchase-order.dto';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders.repository';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    status: { column: purchaseOrders.status, type: 'string' },
    supplierId: { column: purchaseOrders.supplierId, type: 'string' },
  };

  constructor(private readonly repository: PurchaseOrdersRepository) {}

  // Returns paginated POs for the data table
  async findForTable(state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PurchaseOrdersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search ?? null, PurchaseOrdersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrdersService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination ?? {};

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
  async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrderDetailDto> {
    const poNumber = data.poNumber || (await this.repository.generatePoNumber());
    const entity = await this.repository.create({
      supplierId: data.supplierId,
      poNumber,
      orderDate: data.orderDate,
      expectedDate: data.expectedDate ?? null,
      notes: data.notes ?? null,
    });

    const items = await this.repository.createItems(
      (data.items ?? []).map((item) => ({
        purchaseOrderId: entity.id,
        inventoryItemId: item.inventoryItemId,
        orderedQuantity: String(item.orderedQuantity),
      })),
    );

    const itemsWithNames = await this.repository.findItemsByPoId(entity.id);
    const supplierName = await this.repository.findSupplierName(entity.supplierId);
    this.logger.log(`Created PO: ${entity.poNumber} with ${items.length} items`);
    return PurchaseOrderDetailDto.fromDetail(
      entity,
      supplierName,
      itemsWithNames.map((i) => PurchaseOrderItemDto.from(i, i.inventoryItemName)),
    );
  }

  // Returns PO detail with line items
  async findById(id: string): Promise<PurchaseOrderDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    const supplierName = await this.repository.findSupplierName(entity.supplierId);
    const itemsWithNames = await this.repository.findItemsByPoId(id);
    return PurchaseOrderDetailDto.fromDetail(
      entity,
      supplierName,
      itemsWithNames.map((i) => PurchaseOrderItemDto.from(i, i.inventoryItemName)),
    );
  }

  // Updates a PO (scalar fields + optionally replaces items)
  async update(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrderDetailDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.orderDate !== undefined) updatePayload.orderDate = data.orderDate;
    if (data.expectedDate !== undefined) updatePayload.expectedDate = data.expectedDate;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.totalAmount !== undefined)
      updatePayload.totalAmount = data.totalAmount != null ? String(data.totalAmount) : null;

    const entity = Object.keys(updatePayload).length > 0 ? await this.repository.update(id, updatePayload) : existing;

    if (data.items !== undefined) {
      await this.repository.deleteItemsByPoId(id);
      await this.repository.createItems(
        data.items.map((item) => ({
          purchaseOrderId: id,
          inventoryItemId: item.inventoryItemId,
          orderedQuantity: String(item.orderedQuantity),
        })),
      );
    }

    const supplierName = await this.repository.findSupplierName(entity.supplierId);
    const itemsWithNames = await this.repository.findItemsByPoId(id);
    this.logger.log(`Updated PO: ${entity.poNumber} (${entity.id})`);
    return PurchaseOrderDetailDto.fromDetail(
      entity,
      supplierName,
      itemsWithNames.map((i) => PurchaseOrderItemDto.from(i, i.inventoryItemName)),
    );
  }

  // Transitions PO status
  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrderDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
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
    this.logger.log(`Deleted PO: ${id}`);
    return { success: true, message: 'Purchase order deleted successfully.' };
  }
}
