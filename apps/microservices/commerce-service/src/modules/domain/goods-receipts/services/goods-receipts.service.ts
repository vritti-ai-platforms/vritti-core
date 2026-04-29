import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { GoodsReceiptStatusValues, goodsReceipts, purchaseOrders, suppliers } from '@/db/schema';
import type { CreateGoodsReceiptDto } from '@/modules/goods-receipts/dto/request/create-goods-receipt.dto';
import { GoodsReceiptDto } from '../dto/entity/goods-receipt.dto';
import { GoodsReceiptItemsRepository } from '../repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    grNumber: { column: goodsReceipts.grNumber, type: 'string' },
    supplierName: { column: suppliers.name, type: 'string' },
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: goodsReceipts.status, type: 'string' },
  };

  constructor(
    private readonly repository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly poRepository: PurchaseOrdersRepository,
  ) {}

  async create(data: CreateGoodsReceiptDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const supplier = await this.repository.findSupplierById(data.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const po = data.purchaseOrderId ? await this.poRepository.findById(data.purchaseOrderId) : null;
    if (data.purchaseOrderId && !po) throw new NotFoundException('Purchase order not found.');
    if (po && po.supplierId !== data.supplierId) {
      throw new BadRequestException('Purchase order does not belong to the provided supplier.');
    }

    const entity = await this.repository.create({
      supplierId: data.supplierId,
      status: GoodsReceiptStatusValues.DRAFT,
      purchaseOrderId: data.purchaseOrderId ?? null,
      receivedBy: data.receivedBy ?? null,
      receivedDate: data.receivedDate ?? new Date().toISOString().split('T')[0],
      notes: data.notes ?? null,
      publishedAt: null,
    });

    return {
      success: true,
      message: `Goods receipt "${entity.grNumber}" created.`,
      data: GoodsReceiptDto.from(entity, {
        supplierName: supplier.name,
        poId: po?.id ?? null,
        poNumber: po?.poNumber ?? null,
        poOrderDate: po?.orderDate ?? null,
        poExpectedBy: po?.expectedBy ?? null,
        poTotalAmount: po?.totalAmount ?? null,
        poCurrencyCode: po?.currencyCode ?? null,
      }),
    };
  }

  async findForTableByPoId(
    poId: string,
    state: TableViewState,
  ): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptsService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptsService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...GoodsReceiptsService.SEARCH_FIELD_MAP,
      ...GoodsReceiptsService.FILTER_FIELD_MAP,
      receivedDate: { column: goodsReceipts.receivedDate, type: 'string' },
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTableByPoId(poId, {
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(goodsReceipts.createdAt)],
      limit,
      offset,
    });

    const result = rows.map((row) =>
      GoodsReceiptDto.from(row, {
        supplierName: row.supplierName,
        poId: row.purchaseOrderId ?? null,
        poNumber: row.poNumber,
        poOrderDate: row.poOrderDate ?? null,
        poExpectedBy: row.poExpectedBy ?? null,
        poTotalAmount: row.poTotalAmount ?? null,
        poCurrencyCode: row.poCurrencyCode ?? null,
      }),
    );

    return { result, count };
  }

  async findForTable(state: TableViewState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptsService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptsService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...GoodsReceiptsService.SEARCH_FIELD_MAP,
      ...GoodsReceiptsService.FILTER_FIELD_MAP,
      receivedDate: { column: goodsReceipts.receivedDate, type: 'string' },
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(goodsReceipts.createdAt)],
      limit,
      offset,
    });

    const result = rows.map((row) =>
      GoodsReceiptDto.from(row, {
        supplierName: row.supplierName,
        poId: row.purchaseOrderId ?? null,
        poNumber: row.poNumber,
        poOrderDate: row.poOrderDate ?? null,
        poExpectedBy: row.poExpectedBy ?? null,
        poTotalAmount: row.poTotalAmount ?? null,
        poCurrencyCode: row.poCurrencyCode ?? null,
      }),
    );

    return { result, count };
  }

  async findById(id: string): Promise<GoodsReceiptDto> {
    const gr = await this.repository.findByIdWithRefs(id);
    if (!gr) throw new NotFoundException('Goods receipt not found.');
    const isPublishable = await this.isPublishable(id, gr.status);
    return GoodsReceiptDto.from(
      { ...gr, isPublishable },
      {
        supplierName: gr.supplierName,
        poId: gr.purchaseOrderId ?? null,
        poNumber: gr.poNumber,
        poOrderDate: gr.poOrderDate ?? null,
        poExpectedBy: gr.poExpectedBy ?? null,
        poTotalAmount: gr.poTotalAmount ?? null,
        poCurrencyCode: gr.poCurrencyCode ?? null,
      },
    );
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const gr = await this.repository.findById(id);
    if (!gr) throw new NotFoundException('Goods receipt not found.');
    if (gr.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT goods receipts can be deleted.');
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted DRAFT goods receipt ${gr.grNumber} (${id})`);
    return { success: true, message: `Goods receipt "${gr.grNumber}" deleted successfully.` };
  }

  // is_publishable: status='DRAFT' AND every item has accepted qty > 0 AND every line is balanced
  // AND (when PO is linked) PO cap respected. The lines.is_balanced flag captures the serial mismatch
  // case; the items query gives us acceptedQuantity (sum of lines) and PO totals.
  private async isPublishable(goodsReceiptId: string, status: string): Promise<boolean> {
    if (status !== GoodsReceiptStatusValues.DRAFT) return false;
    const items = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    if (items.length === 0) return false;
    return items.every((item) => {
      if (item.unbalancedLinesCount > 0) return false;
      if (item.acceptedQuantity <= 0) return false;
      if (item.poOrderedQuantity != null) {
        const remaining = Number(item.poOrderedQuantity) - Number(item.poReceivedQuantity ?? 0);
        if (item.acceptedQuantity > remaining + 1e-9) return false;
      }
      return true;
    });
  }
}
