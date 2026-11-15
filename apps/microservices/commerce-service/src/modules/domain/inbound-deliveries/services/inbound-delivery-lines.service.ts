import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  type InboundDelivery,
  type InboundDeliveryLine,
  InboundDeliverySourceValues,
  inboundDeliveryLines,
  inventoryItems,
  PurchaseOrderReceiptStatusValues,
  PurchaseOrderStatusValues,
  purchaseOrders,
} from '@/db/schema';
import { InboundDeliveryLineDto } from '../dto/entity/inbound-delivery-line.dto';
import type { AddInboundDeliveryLinesDto } from '../dto/request/add-inbound-delivery-lines.dto';
import {
  type DeliverablePurchaseOrderItem,
  DeliverablePurchaseOrderItemsRepository,
} from '../repositories/deliverable-purchase-order-items.repository';
import type { InboundDeliveryRow } from '../repositories/inbound-deliveries.repository';
import {
  type InboundDeliveryLineRow,
  InboundDeliveryLinesDomainRepository,
} from '../repositories/inbound-delivery-lines.repository';
import { InboundDeliveriesDomainService } from './inbound-deliveries.service';

export type DeliveryTarget = Pick<InboundDelivery, 'id' | 'deliveryNumber' | 'supplierId' | 'siteId'>;

export interface PurchaseDeliveryLine {
  purchaseOrderItemId: string;
  quantity: number;
  primaryUomQty: number;
}

export interface ReceivableDeliveryLine {
  inboundDeliveryLineId: string;
  purchaseOrderItemId: string;
  inventoryItemId: string;
  uomId: string;
  receivedQty: number;
  receivedPrimaryQty: number;
}

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
    private readonly deliverableRepository: DeliverablePurchaseOrderItemsRepository,
    private readonly deliveriesService: InboundDeliveriesDomainService,
  ) {}

  // Puts PO lines on an open delivery, each within what its order still has left to deliver in primary units
  async addLines(
    delivery: InboundDeliveryRow,
    dto: AddInboundDeliveryLinesDto,
    items: DeliverablePurchaseOrderItem[],
  ): Promise<SuccessResponseDto> {
    this.deliveriesService.assertEditable(delivery, 'Cannot Add Lines');
    const itemById = new Map(items.map((item) => [item.id, item]));
    const rows = dto.lines.map((line) => {
      const item = itemById.get(line.purchaseOrderItemId) as DeliverablePurchaseOrderItem;
      const primaryUomQty = new Decimal(line.quantity)
        .times(item.primaryUomQty)
        .div(item.uomQty)
        .toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
      if (primaryUomQty.gt(item.remainingPrimaryQty)) {
        throw new BadRequestException({
          label: 'More Than Open on Order',
          detail: `"${item.poNumber}" has only ${Decimal.max(0, item.remainingPrimaryQty).toString()} primary units of "${item.inventoryItemName}" left to deliver after its receipts and other deliveries.`,
          errors: [{ field: 'lines', message: 'More than open on order' }],
        });
      }
      return {
        inboundDeliveryId: delivery.id,
        purchaseOrderItemId: line.purchaseOrderItemId,
        quantity: line.quantity,
        primaryUomQty: primaryUomQty.toNumber(),
      };
    });

    await this.repository.insertMany(rows);
    this.logger.log(`Added ${rows.length} lines to inbound delivery ${delivery.deliveryNumber}`);
    return {
      success: true,
      message: `${pluralize('line', rows.length, true)} added to inbound delivery "${delivery.deliveryNumber}".`,
    };
  }

  // Puts the lines a purchase works out on a delivery it created behind a receipt or invoice, in the caller's transaction,
  // and returns them
  async addForPurchase(
    delivery: Pick<InboundDelivery, 'id' | 'deliveryNumber' | 'source'>,
    lines: PurchaseDeliveryLine[],
  ): Promise<InboundDeliveryLine[]> {
    if (delivery.source === InboundDeliverySourceValues.ANNOUNCED) {
      throw new ConflictException({
        label: 'Cannot Add Lines',
        detail: `"${delivery.deliveryNumber}" was entered in Inbound Deliveries; its lines are added there.`,
      });
    }
    const created = await this.repository.insertMany(
      lines.map((line) => ({ ...line, inboundDeliveryId: delivery.id })),
    );
    this.logger.log(`Added ${lines.length} lines to inbound delivery ${delivery.deliveryNumber} of its purchase`);
    return created;
  }

  // Changes a line's quantity, never below what is accepted against the delivery nor above what its order has left
  async updateLine(
    delivery: InboundDeliveryRow,
    line: InboundDeliveryLineRow,
    quantity: number,
  ): Promise<SuccessResponseDto> {
    this.deliveriesService.assertEditable(delivery, 'Cannot Edit Line');
    const lineDto = InboundDeliveryLineDto.from(line);
    const itemName = line.inventoryItemName ?? 'this item';
    const primaryUomQty = new Decimal(quantity)
      .times(line.poPrimaryUomQty)
      .div(line.poUomQty)
      .toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
    if (primaryUomQty.lt(line.acceptedOnDeliveryPrimaryQty)) {
      throw new BadRequestException({
        label: 'Below Received Quantity',
        detail: `${lineDto.receivedOnDeliveryQty} of "${itemName}" are already received against this delivery, so the line cannot go below that.`,
        errors: [{ field: 'quantity', message: `At least ${lineDto.receivedOnDeliveryQty}` }],
      });
    }
    const maxPrimary = Decimal.max(line.primaryUomQty, line.acceptedOnDeliveryPrimaryQty).plus(
      Decimal.max(0, line.remainingToDeliverPrimaryQty),
    );
    if (primaryUomQty.gt(line.primaryUomQty) && primaryUomQty.gt(maxPrimary)) {
      throw new BadRequestException({
        label: 'More Than Open on Order',
        detail: `"${line.poNumber}" has only ${lineDto.maxQuantity} of "${itemName}" left to deliver after its receipts and other deliveries.`,
        errors: [{ field: 'quantity', message: `At most ${lineDto.maxQuantity}` }],
      });
    }

    await this.repository.update(line.id, { quantity, primaryUomQty: primaryUomQty.toNumber() });
    this.logger.log(`Inbound delivery ${delivery.deliveryNumber} line ${line.id} quantity → ${quantity}`);
    return { success: true, message: `Line updated on inbound delivery "${delivery.deliveryNumber}".` };
  }

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

  // Returns the PO lines that can still go on a delivery, by PO number, with what is left to deliver in the line unit
  async findForSelectDeliverable(inboundDeliveryId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const result = await this.deliverableRepository.findForSelectDeliverable(inboundDeliveryId, {
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'poNumber',
      additionalKeys: query.additionalKeys,
      searchKeys: ['name', 'poNumber'],
      orderBy: { poNumber: 'asc', name: 'asc' },
    });
    return {
      ...result,
      options: result.options.map((option) => {
        const additionals = option.additionals ?? {};
        const primaryUomQty = new Decimal(String(additionals.primaryUomQty ?? 0));
        const deliverableQty = primaryUomQty.isZero()
          ? 0
          : new Decimal(String(additionals.deliverablePrimaryQty ?? 0))
              .times(String(additionals.uomQty ?? 0))
              .div(primaryUomQty)
              .toDecimalPlaces(3)
              .toNumber();
        return { ...option, additionals: { ...additionals, deliverableQty } };
      }),
    };
  }

  // Loads a line of the given delivery with its quantities, throwing when it is not on it
  async findOnDeliveryOrThrow(inboundDeliveryId: string, lineId: string): Promise<InboundDeliveryLineRow> {
    const line = await this.repository.findOnDelivery(inboundDeliveryId, lineId);
    if (!line) throw new NotFoundException('Inbound delivery line not found.');
    return line;
  }

  // Loads PO lines to put on a delivery, rejecting any that is missing, of another supplier or site, on an order not confirmed or already fully received, or already on it
  async findDeliverableOrThrow(
    delivery: DeliveryTarget,
    purchaseOrderItemIds: string[],
  ): Promise<DeliverablePurchaseOrderItem[]> {
    const items = await this.deliverableRepository.findForDelivery(delivery.id, purchaseOrderItemIds);
    if (items.length < new Set(purchaseOrderItemIds).size) {
      throw new NotFoundException({
        label: 'Purchase Order Line Not Found',
        detail: 'One of the purchase order lines no longer exists or is out of reach.',
        errors: [{ field: 'lines', message: 'Unknown purchase order line' }],
      });
    }
    this.assertSameSupplier(delivery, items);
    this.assertSameSite(delivery, items);
    this.assertOrdersOpen(items);
    this.assertNotOnDelivery(delivery, items);
    return items;
  }

  // Returns each line of the delivery still open on a confirmed order, at the least of what is left of it on the
  // delivery and on its PO line, throwing when none is
  async findReceivableOrThrow(
    delivery: Pick<InboundDeliveryRow, 'id' | 'deliveryNumber'>,
  ): Promise<ReceivableDeliveryLine[]> {
    const lines = await this.repository.findOnConfirmedOrders(delivery.id);
    const receivable = lines.flatMap((line) => {
      const openOnDelivery = new Decimal(line.primaryUomQty).minus(line.acceptedOnDeliveryPrimaryQty);
      const openOnOrder = new Decimal(line.poPrimaryUomQty)
        .plus(line.poFreePrimaryQty)
        .minus(line.poCancelledPrimaryQty)
        .minus(line.poReceivedPrimaryQty);
      const receivablePrimary = Decimal.min(openOnDelivery, openOnOrder);
      if (receivablePrimary.lte(0)) return [];
      return [
        {
          inboundDeliveryLineId: line.id,
          purchaseOrderItemId: line.purchaseOrderItemId,
          inventoryItemId: line.inventoryItemId,
          uomId: line.uomId,
          receivedQty: receivablePrimary
            .times(line.poUomQty)
            .div(line.poPrimaryUomQty)
            .toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
            .toNumber(),
          receivedPrimaryQty: receivablePrimary.toNumber(),
        },
      ];
    });
    if (receivable.length > 0) return receivable;
    throw new BadRequestException({
      label: 'Nothing Left to Receive',
      detail: `No line of "${delivery.deliveryNumber}" has quantity left to receive on a confirmed order.`,
    });
  }

  // Returns what each of the given PO lines still has free to put on an inbound delivery or receive, in primary units, keyed by line
  async findRemainingToDeliver(purchaseOrderItemIds: string[]): Promise<Map<string, number>> {
    const rows = await this.deliverableRepository.findRemainingToDeliver(purchaseOrderItemIds);
    return new Map(rows.map((row) => [row.id, row.remainingPrimaryQty]));
  }

  // Returns what deliveries created behind draft invoices carry of each PO line, in primary units, keyed by line; the given
  // deliveries are left out
  async findPendingOnSupplierInvoices(
    purchaseOrderItemIds: string[],
    excludeDeliveryIds: string[],
  ): Promise<Map<string, number>> {
    if (purchaseOrderItemIds.length === 0) return new Map();
    const rows = await this.repository.findPendingOnSupplierInvoices(purchaseOrderItemIds, excludeDeliveryIds);
    return new Map(rows.map((row) => [row.purchaseOrderItemId, row.primaryUomQty]));
  }

  // Removes a line no goods receipt counts
  async removeLine(delivery: InboundDeliveryRow, line: InboundDeliveryLineRow): Promise<SuccessResponseDto> {
    this.deliveriesService.assertEditable(delivery, 'Cannot Remove Line');
    if (line.goodsReceiptItemCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Remove Line',
        detail: `A goods receipt counts "${line.inventoryItemName ?? 'this item'}" against this delivery. Remove it from a draft receipt, or reduce the line to the received quantity instead.`,
      });
    }
    await this.repository.delete(line.id);
    this.logger.log(`Removed line ${line.id} from inbound delivery ${delivery.deliveryNumber}`);
    return { success: true, message: `Line removed from inbound delivery "${delivery.deliveryNumber}".` };
  }

  // Rejects a PO line ordered from another supplier than the delivery's
  private assertSameSupplier(delivery: DeliveryTarget, items: DeliverablePurchaseOrderItem[]): void {
    const otherSupplier = items.find((item) => item.supplierId !== delivery.supplierId);
    if (!otherSupplier) return;
    throw new BadRequestException({
      label: 'Different Supplier',
      detail: `"${otherSupplier.poNumber}" is ordered from another supplier; an inbound delivery carries the orders of its own supplier.`,
      errors: [{ field: 'lines', message: 'Another supplier' }],
    });
  }

  // Rejects a PO line ordered for another site than the one the delivery arrives at
  private assertSameSite(delivery: DeliveryTarget, items: DeliverablePurchaseOrderItem[]): void {
    const otherSite = items.find((item) => item.siteId !== delivery.siteId);
    if (!otherSite) return;
    throw new BadRequestException({
      label: 'Different Site',
      detail: `"${otherSite.poNumber}" is for another site; an inbound delivery carries the orders of the site it arrives at.`,
      errors: [{ field: 'lines', message: 'Another site' }],
    });
  }

  // Rejects a PO line whose order is not confirmed or is already fully received
  private assertOrdersOpen(items: DeliverablePurchaseOrderItem[]): void {
    const notConfirmed = items.find((item) => item.poStatus !== PurchaseOrderStatusValues.CONFIRMED);
    if (notConfirmed) {
      throw new BadRequestException({
        label: 'Purchase Order Not Confirmed',
        detail: `"${notConfirmed.poNumber}" is ${notConfirmed.poStatus}; confirm the order before creating its inbound delivery.`,
        errors: [{ field: 'lines', message: `Order is ${notConfirmed.poStatus}` }],
      });
    }
    const received = items.find((item) => item.poReceiptStatus === PurchaseOrderReceiptStatusValues.RECEIVED);
    if (!received) return;
    throw new BadRequestException({
      label: 'Purchase Order Received',
      detail: `"${received.poNumber}" is fully received, so nothing of it is left to deliver.`,
      errors: [{ field: 'lines', message: 'Order fully received' }],
    });
  }

  // Rejects a PO line already on the delivery
  private assertNotOnDelivery(delivery: DeliveryTarget, items: DeliverablePurchaseOrderItem[]): void {
    const alreadyOn = items.find((item) => item.isOnDelivery);
    if (!alreadyOn) return;
    throw new ConflictException({
      label: 'Already on Delivery',
      detail: `"${alreadyOn.inventoryItemName}" of "${alreadyOn.poNumber}" is already on "${delivery.deliveryNumber}". Change that line's quantity instead.`,
      errors: [{ field: 'lines', message: 'Already on this delivery' }],
    });
  }
}
