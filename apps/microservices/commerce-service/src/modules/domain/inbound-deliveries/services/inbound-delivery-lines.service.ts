import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import { inboundDeliveryLines, inventoryItems, purchaseOrders } from '@/db/schema';
import { InboundDeliveryLineDto } from '../dto/entity/inbound-delivery-line.dto';
import type { AddInboundDeliveryLinesDto } from '../dto/request/add-inbound-delivery-lines.dto';
import {
  type DeliverablePurchaseOrderItem,
  DeliverablePurchaseOrderItemsRepository,
  type OpenPurchaseOrderLine,
} from '../repositories/deliverable-purchase-order-items.repository';
import {
  InboundDeliveriesDomainRepository,
  type InboundDeliveryRow,
} from '../repositories/inbound-deliveries.repository';
import {
  type InboundDeliveryLineRow,
  InboundDeliveryLinesDomainRepository,
} from '../repositories/inbound-delivery-lines.repository';
import { ReceivablePurchaseOrdersRepository } from '../repositories/receivable-purchase-orders.repository';

@Injectable()
export class InboundDeliveryLinesDomainService {
  private readonly logger = new Logger(InboundDeliveryLinesDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
  };
  private static readonly SORT_FIELD_MAP: FieldMap = {
    ...InboundDeliveryLinesDomainService.SEARCH_FIELD_MAP,
    quantity: { column: inboundDeliveryLines.quantity, type: 'number' },
  };

  constructor(
    private readonly repository: InboundDeliveryLinesDomainRepository,
    private readonly deliveriesRepository: InboundDeliveriesDomainRepository,
    private readonly deliverableRepository: DeliverablePurchaseOrderItemsRepository,
    private readonly receivablePurchaseOrdersRepository: ReceivablePurchaseOrdersRepository,
  ) {}

  // Returns one page of a delivery's lines
  async findForTable(
    inboundDeliveryId: string,
    state: TableState,
  ): Promise<{ result: InboundDeliveryLineDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InboundDeliveryLinesDomainService.SORT_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(inboundDeliveryId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, InboundDeliveryLinesDomainService.SORT_FIELD_MAP),
        FilterProcessor.buildSearch(state.search, InboundDeliveryLinesDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(purchaseOrders.poNumber), asc(inventoryItems.name)],
      limit,
      offset,
    });
    return { result: result.map(InboundDeliveryLineDto.from), count };
  }

  // Returns the PO lines that can still go on a delivery, by PO number, for its line picker
  findForSelectDeliverable(inboundDeliveryId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.deliverableRepository.findForSelectDeliverable(inboundDeliveryId, {
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'poNumber',
      additionalKeys: query.additionalKeys,
      search: query.search,
      searchKeys: ['name', 'poNumber'],
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderBy: { poNumber: 'asc', name: 'asc' },
    });
  }

  // Returns the supplier's POs a goods receipt can receive, newest number first; with a receipt, only those of its site not already on it
  findForSelectReceivablePurchaseOrders(
    supplierId: string,
    query: SelectOptionsQueryDto,
    goodsReceiptId?: string,
  ): Promise<SelectQueryResult> {
    return this.receivablePurchaseOrdersRepository.findForSelectReceivable(
      supplierId,
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'poNumber',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        search: query.search,
        searchKeys: ['poNumber'],
        limit: query.limit,
        offset: query.offset,
        values: query.values,
        excludeIds: query.excludeIds,
        orderBy: { poNumber: 'desc' },
      },
      goodsReceiptId,
    );
  }

  // Mirrors receipt lines added to a goods receipt onto the delivery it created
  async mirrorReceiptAdditions(inboundDeliveryId: string, lines: OpenPurchaseOrderLine[]): Promise<void> {
    await this.repository.insertMany(
      lines.map((line) => ({
        inboundDeliveryId,
        purchaseOrderItemId: line.purchaseOrderItemId,
        quantity: line.quantity,
      })),
    );
  }

  // Mirrors a receipt line's received quantity onto the matching line of the delivery the receipt created
  async mirrorReceiptQuantity(inboundDeliveryId: string, purchaseOrderItemId: string, quantity: number): Promise<void> {
    await this.repository.setQuantityOfPurchaseOrderItem(inboundDeliveryId, purchaseOrderItemId, quantity);
  }

  // Mirrors a removed receipt line by removing the matching line of the delivery the receipt created
  async mirrorReceiptRemoval(inboundDeliveryId: string, purchaseOrderItemId: string): Promise<void> {
    await this.repository.deleteOfPurchaseOrderItem(inboundDeliveryId, purchaseOrderItemId);
  }

  // Puts PO lines on an open delivery, each within what its order still has left to deliver
  async addLines(
    delivery: InboundDeliveryRow,
    dto: AddInboundDeliveryLinesDto,
    items: DeliverablePurchaseOrderItem[],
  ): Promise<SuccessResponseDto> {
    this.deliveriesRepository.assertEditable(delivery, 'Cannot Add Lines');
    const quantityById = new Map(dto.lines.map((line) => [line.purchaseOrderItemId, line.quantity]));
    this.deliverableRepository.assertWithinRemaining(items, quantityById);

    await this.repository.insertMany(
      dto.lines.map((line) => ({
        inboundDeliveryId: delivery.id,
        purchaseOrderItemId: line.purchaseOrderItemId,
        quantity: line.quantity,
      })),
    );
    this.logger.log(`Added ${dto.lines.length} lines to inbound delivery ${delivery.deliveryNumber}`);
    return {
      success: true,
      message: `${pluralize('line', dto.lines.length, true)} added to inbound delivery "${delivery.deliveryNumber}".`,
    };
  }

  // Changes a line's quantity, never below what is received against the delivery nor above what its order has left
  async updateLine(
    delivery: InboundDeliveryRow,
    line: InboundDeliveryLineRow,
    quantity: number,
  ): Promise<SuccessResponseDto> {
    this.deliveriesRepository.assertEditable(delivery, 'Cannot Edit Line');
    this.repository.assertQuantityChange(line, quantity);
    await this.repository.update(line.id, { quantity });
    this.logger.log(`Inbound delivery ${delivery.deliveryNumber} line ${line.id} quantity → ${quantity}`);
    return { success: true, message: `Line updated on inbound delivery "${delivery.deliveryNumber}".` };
  }

  // Removes a line nothing has been received against
  async removeLine(delivery: InboundDeliveryRow, line: InboundDeliveryLineRow): Promise<SuccessResponseDto> {
    this.deliveriesRepository.assertEditable(delivery, 'Cannot Remove Line');
    this.repository.assertRemovable(line);
    await this.repository.delete(line.id);
    this.logger.log(`Removed line ${line.id} from inbound delivery ${delivery.deliveryNumber}`);
    return { success: true, message: `Line removed from inbound delivery "${delivery.deliveryNumber}".` };
  }
}
