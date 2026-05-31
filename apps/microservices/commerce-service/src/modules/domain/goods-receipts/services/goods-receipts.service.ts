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
  ValidationException,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import {
  ExchangeRateTypeValues,
  GoodsReceiptStatusValues,
  goodsReceipts,
  purchaseOrders,
  suppliers,
} from '@/db/schema';
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

  async create(data: CreateGoodsReceiptDto, buCurrencyCode: string): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const supplier = await this.repository.findSupplierById(data.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const po = data.purchaseOrderId ? await this.poRepository.findById(data.purchaseOrderId) : null;
    if (data.purchaseOrderId && !po) throw new NotFoundException('Purchase order not found.');
    if (po && po.supplierId !== data.supplierId) {
      throw new BadRequestException('Purchase order does not belong to the provided supplier.');
    }

    const exchangeRate = this.resolveExchangeRate(supplier.currencyCode, po, data.exchangeRate, buCurrencyCode);

    const entity = await this.repository.create({
      supplierId: data.supplierId,
      status: GoodsReceiptStatusValues.DRAFT,
      purchaseOrderId: data.purchaseOrderId ?? null,
      exchangeRate,
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

  async findForTableByPoId(poId: string, state: TableViewState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
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

  hasGoodsReceiptForPo(poId: string): Promise<boolean> {
    return this.repository.existsByPoId(poId);
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
    const { isPublishable, canLinkPurchaseOrder, canUnlinkPurchaseOrder } = await this.computeDraftSignals(
      id,
      gr.status,
      gr.purchaseOrderId,
    );
    return GoodsReceiptDto.from(
      { ...gr, isPublishable, canLinkPurchaseOrder, canUnlinkPurchaseOrder },
      {
        supplierName: gr.supplierName,
        supplierCurrencyCode: gr.supplierCurrencyCode,
        poId: gr.purchaseOrderId ?? null,
        poNumber: gr.poNumber,
        poOrderDate: gr.poOrderDate ?? null,
        poExpectedBy: gr.poExpectedBy ?? null,
        poTotalAmount: gr.poTotalAmount ?? null,
        poCurrencyCode: gr.poCurrencyCode ?? null,
      },
    );
  }

  // Links a PO to a draft GR that has no items, requiring a matching supplier
  async linkPurchaseOrder(id: string, purchaseOrderId: string): Promise<SuccessResponseDto> {
    const gr = await this.repository.findById(id);
    if (!gr) throw new NotFoundException('Goods receipt not found.');
    if (gr.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Link Purchase Order',
        detail: 'Only draft goods receipts can be linked to a purchase order.',
      });
    }
    if (gr.purchaseOrderId) {
      throw new BadRequestException({
        label: 'Already Linked',
        detail: 'This goods receipt is already linked to a purchase order.',
      });
    }
    const itemsCount = await this.itemsRepository.countByReceiptId(id);
    if (itemsCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Link Purchase Order',
        detail: 'Remove all items before linking a purchase order.',
      });
    }

    const po = await this.poRepository.findById(purchaseOrderId);
    if (!po) throw new NotFoundException('Purchase order not found.');
    if (po.supplierId !== gr.supplierId) {
      throw new BadRequestException({
        label: 'Supplier Mismatch',
        detail: "Purchase order's supplier does not match the goods receipt's supplier.",
      });
    }

    await this.repository.update(id, { purchaseOrderId: po.id });
    this.logger.log(`Linked PO ${po.poNumber} to goods receipt ${gr.grNumber} (${id})`);
    return { success: true, message: `Purchase order "${po.poNumber}" linked to goods receipt "${gr.grNumber}".` };
  }

  // Unlinks the PO from a draft GR that has no items
  async unlinkPurchaseOrder(id: string): Promise<SuccessResponseDto> {
    const gr = await this.repository.findById(id);
    if (!gr) throw new NotFoundException('Goods receipt not found.');
    if (gr.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Unlink Purchase Order',
        detail: 'Only draft goods receipts can be unlinked from a purchase order.',
      });
    }
    if (!gr.purchaseOrderId) {
      throw new BadRequestException({
        label: 'Not Linked',
        detail: 'This goods receipt is not linked to a purchase order.',
      });
    }
    const itemsCount = await this.itemsRepository.countByReceiptId(id);
    if (itemsCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Unlink Purchase Order',
        detail: 'Remove all items before unlinking the purchase order.',
      });
    }

    await this.repository.update(id, { purchaseOrderId: null });
    this.logger.log(`Unlinked PO from goods receipt ${gr.grNumber} (${id})`);
    return { success: true, message: `Purchase order unlinked from goods receipt "${gr.grNumber}".` };
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

  // Resolves the supplier→BU exchange rate to snapshot on the new GR
  private resolveExchangeRate(
    supplierCurrencyCode: string,
    po: Awaited<ReturnType<PurchaseOrdersRepository['findById']>> | null,
    userExchangeRate: number | undefined,
    buCurrencyCode: string,
  ): number {
    if (supplierCurrencyCode === buCurrencyCode) return 1;

    if (po && po.exchangeRateType === ExchangeRateTypeValues.FIXED) {
      if (po.exchangeRate == null) {
        throw new BadRequestException('Linked purchase order is FIXED-rate but has no exchange rate set.');
      }
      return Number(po.exchangeRate);
    }

    // VARIABLE PO or un-linked GR — caller must supply the rate.
    if (userExchangeRate == null || userExchangeRate <= 0) {
      throw new ValidationException({
        detail: `Exchange rate is required (supplier currency ${supplierCurrencyCode} differs from business unit currency ${buCurrencyCode}).`,
        errors: [{ field: 'exchangeRate', message: 'Required when supplier currency differs from BU currency.' }],
      });
    }
    return userExchangeRate;
  }

  // Computes the publishable, link, and unlink draft signals from a single items fetch
  private async computeDraftSignals(
    goodsReceiptId: string,
    status: string,
    purchaseOrderId: string | null,
  ): Promise<{ isPublishable: boolean; canLinkPurchaseOrder: boolean; canUnlinkPurchaseOrder: boolean }> {
    if (status !== GoodsReceiptStatusValues.DRAFT) {
      return { isPublishable: false, canLinkPurchaseOrder: false, canUnlinkPurchaseOrder: false };
    }
    const items = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    const canLinkPurchaseOrder = !purchaseOrderId && items.length === 0;
    const canUnlinkPurchaseOrder = !!purchaseOrderId && items.length === 0;
    if (items.length === 0) return { isPublishable: false, canLinkPurchaseOrder, canUnlinkPurchaseOrder };
    const isPublishable = items.every((item) => {
      if (item.unbalancedLinesCount > 0) return false;
      if (item.acceptedQuantity <= 0) return false;
      // Balanced ⇔ the lines distribute exactly the declared item quantity.
      if (Math.abs(item.acceptedQuantity - Number(item.quantity)) > 1e-9) return false;
      return true;
    });
    return { isPublishable, canLinkPurchaseOrder, canUnlinkPurchaseOrder };
  }
}
