import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import {
  GoodsReceiptStatusValues,
  goodsReceipts,
  purchaseOrders,
  suppliers,
} from '@/db/schema';
import type { CreateGoodsReceiptDto } from '@/modules/goods-receipts/dto/request/create-goods-receipt.dto';
import { GoodsReceiptDto, GoodsReceiptItemDto } from '../dto/entity/goods-receipt.dto';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);
  private static readonly FIELD_MAP: FieldMap = {
    grNumber: { column: goodsReceipts.grNumber, type: 'string' },
    supplierName: { column: suppliers.name, type: 'string' },
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    receivedDate: { column: goodsReceipts.receivedDate, type: 'string' },
  };

  constructor(
    private readonly repository: GoodsReceiptsRepository,
    private readonly poRepository: PurchaseOrdersRepository,
  ) {}

  // Creates a DRAFT goods receipt header
  async create(data: CreateGoodsReceiptDto): Promise<GoodsReceiptDto> {
    this.logger.log(`create — incoming data: ${JSON.stringify(data)}`);
    const supplier = await this.repository.findSupplierById(data.supplierId);
    this.logger.log(`create — supplier lookup result: ${JSON.stringify(supplier)}`);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const po = data.purchaseOrderId ? await this.poRepository.findById(data.purchaseOrderId) : null;
    this.logger.log(`create — PO lookup result: ${JSON.stringify(po)}`);
    if (data.purchaseOrderId && !po) throw new NotFoundException('Purchase order not found.');
    if (po && po.supplierId !== data.supplierId) {
      this.logger.warn(`create — PO supplierId mismatch: po.supplierId=${po.supplierId}, data.supplierId=${data.supplierId}`);
      throw new BadRequestException('Purchase order does not belong to the provided supplier.');
    }
    this.logger.log(`create — inserting GR with receivedDate: ${data.receivedDate}`);
    const entity = await this.repository.create({
      supplierId: data.supplierId,
      status: GoodsReceiptStatusValues.DRAFT,
      purchaseOrderId: data.purchaseOrderId ?? null,
      receivedBy: data.receivedBy ?? null,
      receivedDate: data.receivedDate ?? new Date().toISOString().split('T')[0],
      notes: data.notes ?? null,
    });

    this.logger.log(`create — entity inserted: ${JSON.stringify(entity)}`);
    this.logger.log(`Created DRAFT GR ${entity.id}`);
    return GoodsReceiptDto.from(entity, [], {
      supplierName: supplier.name,
      poId: po?.id ?? null,
      poNumber: po?.poNumber ?? null,
      poOrderDate: po?.orderDate ?? null,
      poExpectedBy: po?.expectedBy ?? null,
      poTotalAmount: po?.totalAmount ?? null,
      poCurrencyCode: po?.currencyCode ?? null,
    });
  }

  // Returns all GRs for a PO
  async findByPoId(poId: string): Promise<GoodsReceiptDto[]> {
    const grs = await this.repository.findByPoId(poId);
    const result: GoodsReceiptDto[] = [];
    for (const gr of grs) {
      const refs = await this.repository.findByIdWithRefs(gr.id);
      const itemsWithNames = await this.repository.findItemsByGrId(gr.id);
      result.push(
        GoodsReceiptDto.from(
          gr,
          itemsWithNames.map((i) => GoodsReceiptItemDto.from(i, i.inventoryItemName)),
          {
            supplierName: refs?.supplierName ?? null,
            poId: gr.purchaseOrderId ?? null,
            poNumber: refs?.poNumber ?? null,
            poOrderDate: refs?.poOrderDate ?? null,
            poExpectedBy: refs?.poExpectedBy ?? null,
            poTotalAmount: refs?.poTotalAmount ?? null,
            poCurrencyCode: refs?.poCurrencyCode ?? null,
          },
        ),
      );
    }
    return result;
  }

  // Returns paginated goods receipts for table
  async findForTable(state: TableViewState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, GoodsReceiptsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(goodsReceipts.createdAt)],
      limit,
      offset,
    });

    return {
      result: rows.map((row) =>
        GoodsReceiptDto.from(row, [], {
          supplierName: row.supplierName,
          poId: row.purchaseOrderId ?? null,
          poNumber: row.poNumber,
          poOrderDate: row.poOrderDate ?? null,
          poExpectedBy: row.poExpectedBy ?? null,
          poTotalAmount: row.poTotalAmount ?? null,
          poCurrencyCode: row.poCurrencyCode ?? null,
        }),
      ),
      count,
    };
  }

  // Returns goods receipt detail by ID
  async findById(id: string): Promise<GoodsReceiptDto> {
    const gr = await this.repository.findByIdWithRefs(id);
    if (!gr) throw new NotFoundException('Goods receipt not found.');
    const itemsWithNames = await this.repository.findItemsByGrId(id);
    return GoodsReceiptDto.from(
      gr,
      itemsWithNames.map((item) => GoodsReceiptItemDto.from(item, item.inventoryItemName)),
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
}
