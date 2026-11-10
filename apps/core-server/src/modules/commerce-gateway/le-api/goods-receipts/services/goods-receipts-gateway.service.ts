import type { AddGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line.dto';
import type { AddGoodsReceiptLineItemDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line-item.dto';
import type { AddGoodsReceiptPurchaseOrderDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-purchase-order.dto';
import type { CreateGoodsReceiptFromDeliveryDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import type { CreateGoodsReceiptFromPurchaseOrdersDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt-from-purchase-orders.dto';
import type { LeAddGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/le-add-goods-receipt-lot.dto';
import type { LeUpdateGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/le-update-goods-receipt-lot.dto';
import type { UpdateGoodsReceiptDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt.dto';
import type { UpdateGoodsReceiptItemDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-item.dto';
import type { UpdateGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-line.dto';
import type { GoodsReceiptItemQuantsResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-quants-response.dto';
import type { GoodsReceiptItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-response.dto';
import type { GoodsReceiptItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-table-response.dto';
import type { GoodsReceiptItemsCostResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-items-cost-response.dto';
import type { GoodsReceiptLineItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-response.dto';
import type { GoodsReceiptLineItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-table-response.dto';
import type { GoodsReceiptLineResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-response.dto';
import type { GoodsReceiptLineTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-table-response.dto';
import type { GoodsReceiptLotResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-lot-response.dto';
import type { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTreeNodeResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-tree-response.dto';
import type { LeGoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/le-goods-receipt-response.dto';
import type { LeGoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/le-goods-receipt-table-response.dto';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class LeGoodsReceiptsGatewayService {
  private readonly logger = new Logger(LeGoodsReceiptsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

  // Creates a draft goods receipt of an announced inbound delivery, pre-filled with its open lines
  createFromDelivery(dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log(`le.goodsReceipts.createFromDelivery — inboundDeliveryId: ${dto.inboundDeliveryId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.createFromDelivery', dto);
  }

  // Creates an arrived inbound delivery of a supplier's purchase orders and a draft goods receipt of it
  createFromPurchaseOrders(
    dto: CreateGoodsReceiptFromPurchaseOrdersDto,
  ): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log(
      `le.goodsReceipts.createFromPurchaseOrders — supplierId: ${dto.supplierId}, purchaseOrders: ${dto.purchaseOrderIds.length}`,
    );
    return this.nats.send('commerce', 'le.goodsReceipts.createFromPurchaseOrders', dto);
  }

  // Adds the open lines of another purchase order of the supplier to a draft goods receipt and its inbound delivery
  addPurchaseOrder(goodsReceiptId: string, dto: AddGoodsReceiptPurchaseOrderDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.goodsReceipts.addPurchaseOrder — goodsReceiptId: ${goodsReceiptId}, purchaseOrderId: ${dto.purchaseOrderId}`,
    );
    return this.nats.send('commerce', 'le.goodsReceipts.addPurchaseOrder', { goodsReceiptId, ...dto });
  }

  // Returns the goods receipts of the legal entity's sites with site names
  async findForTable(userId: string, orgId: string): Promise<LeGoodsReceiptTableResponseDto> {
    this.logger.log('le.goodsReceipts.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-le-goods-receipts');
    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'le.goodsReceipts.table',
      state,
    );
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns one goods receipt with its site named
  async findById(id: string, orgId: string): Promise<LeGoodsReceiptResponseDto> {
    this.logger.log(`le.goodsReceipts.findById — id: ${id}`);
    const receipt = await this.nats.send<GoodsReceiptResponseDto>('commerce', 'le.goodsReceipts.findById', { id });
    const [named] = await this.ownerNames.withSiteNames(orgId, [receipt]);
    return named;
  }

  // Changes a draft goods receipt's notes and the supplier's delivery note on the inbound delivery it created
  update(id: string, dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.update — id: ${id}`);
    return this.nats.send('commerce', 'le.goodsReceipts.update', { id, ...dto });
  }

  // Returns a goods receipt's items with their lots and lines as a tree
  findTree(goodsReceiptId: string): Promise<GoodsReceiptTreeNodeResponseDto[]> {
    this.logger.log(`le.goodsReceipts.tree — goodsReceiptId: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.tree', { goodsReceiptId });
  }

  // Publishes a goods receipt, landing its stock at its site valued in the legal entity's currency
  async publish(id: string, legalEntityId: string | undefined): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`le.goodsReceipts.publish — id: ${id}`);
    return this.nats.send('commerce', 'le.goodsReceipts.publish', {
      id,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Deletes a draft goods receipt
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.goodsReceipts.delete', { id });
  }

  // Returns the inventory items counted on a goods receipt
  findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    this.logger.log(`le.goodsReceipts.inventoryItemIds — goodsReceiptId: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.inventoryItemIds', { goodsReceiptId });
  }

  // Returns the provisional cost of a goods receipt's items in the legal entity's currency
  async findItemsCost(
    goodsReceiptId: string,
    legalEntityId: string | undefined,
  ): Promise<GoodsReceiptItemsCostResponseDto> {
    this.logger.log(`le.goodsReceipts.itemsCost — goodsReceiptId: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.itemsCost', {
      goodsReceiptId,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Returns the quants a published goods receipt item landed in
  findItemQuants(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemQuantsResponseDto> {
    this.logger.log(`le.goodsReceipts.itemQuants — goodsReceiptId: ${goodsReceiptId}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.itemQuants', { goodsReceiptId, itemId });
  }

  // Returns a goods receipt's items for the data table with server-stored state
  async findItemsTable(goodsReceiptId: string, userId: string): Promise<GoodsReceiptItemTableResponseDto> {
    this.logger.log(`le.goodsReceipts.itemsTable — goodsReceiptId: ${goodsReceiptId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-goods-receipt-${goodsReceiptId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptItemResponseDto[]; count: number }>(
      'commerce',
      'le.goodsReceipts.itemsTable',
      { goodsReceiptId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns one item of a goods receipt
  findItemById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemResponseDto> {
    this.logger.log(`le.goodsReceipts.itemById — itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.itemById', { goodsReceiptId, itemId });
  }

  // Changes the received or rejected quantity of a goods receipt item
  updateItem(goodsReceiptId: string, itemId: string, dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.updateItem — itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.updateItem', { goodsReceiptId, itemId, ...dto });
  }

  // Removes an item from a goods receipt
  removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.removeItem — itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.removeItem', { goodsReceiptId, itemId });
  }

  // Returns the lots of a goods receipt item, their MRP in the legal entity's currency
  async findLots(
    goodsReceiptId: string,
    itemId: string,
    legalEntityId: string | undefined,
  ): Promise<GoodsReceiptLotResponseDto[]> {
    this.logger.log(`le.goodsReceipts.lots — itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.lots', {
      goodsReceiptId,
      itemId,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Adds a lot to a goods receipt item, its MRP in the legal entity's currency
  async addLot(
    goodsReceiptId: string,
    itemId: string,
    dto: LeAddGoodsReceiptLotDto,
    legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<GoodsReceiptLotResponseDto>> {
    this.logger.log(`le.goodsReceipts.addLot — itemId: ${itemId}, lot: ${dto.lotNumber}`);
    return this.nats.send('commerce', 'le.goodsReceipts.addLot', {
      goodsReceiptId,
      itemId,
      ...dto,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Changes a lot of a goods receipt item, its MRP in the legal entity's currency
  async updateLot(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    dto: LeUpdateGoodsReceiptLotDto,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.updateLot — lotId: ${lotId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.updateLot', {
      goodsReceiptId,
      itemId,
      lotId,
      ...dto,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Removes a lot from a goods receipt item
  removeLot(goodsReceiptId: string, itemId: string, lotId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.removeLot — lotId: ${lotId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.removeLot', { goodsReceiptId, itemId, lotId });
  }

  // Returns a goods receipt item's lines for the data table with server-stored state
  async findLinesTable(
    goodsReceiptId: string,
    itemId: string,
    userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`le.goodsReceipts.linesTable — itemId: ${itemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-goods-receipt-${goodsReceiptId}-item-${itemId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptLineResponseDto[]; count: number }>(
      'commerce',
      'le.goodsReceipts.linesTable',
      { goodsReceiptId, itemId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns the lines one lot of a goods receipt item is distributed to, for the data table
  async findLinesByLotTable(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`le.goodsReceipts.linesByLotTable — itemId: ${itemId}, lotId: ${lotId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-goods-receipt-${goodsReceiptId}-item-${itemId}-lot-${lotId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptLineResponseDto[]; count: number }>(
      'commerce',
      'le.goodsReceipts.linesByLotTable',
      { goodsReceiptId, itemId, lotId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns one line of a goods receipt item
  findLineById(goodsReceiptId: string, itemId: string, lineId: string): Promise<GoodsReceiptLineResponseDto> {
    this.logger.log(`le.goodsReceipts.lineById — lineId: ${lineId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.lineById', { goodsReceiptId, itemId, lineId });
  }

  // Adds a line to a goods receipt item
  addLine(
    goodsReceiptId: string,
    itemId: string,
    dto: AddGoodsReceiptLineDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineResponseDto>> {
    this.logger.log(`le.goodsReceipts.addLine — itemId: ${itemId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.addLine', { goodsReceiptId, itemId, ...dto });
  }

  // Changes a line of a goods receipt item
  updateLine(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    dto: UpdateGoodsReceiptLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.updateLine — lineId: ${lineId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.updateLine', { goodsReceiptId, itemId, lineId, ...dto });
  }

  // Removes a line from a goods receipt item
  removeLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.removeLine — lineId: ${lineId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.removeLine', { goodsReceiptId, itemId, lineId });
  }

  // Returns the serials registered on a goods receipt line, for the data table
  async findLineItemsTable(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    userId: string,
  ): Promise<GoodsReceiptLineItemTableResponseDto> {
    this.logger.log(`le.goodsReceipts.lineItemsTable — lineId: ${lineId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-goods-receipt-${goodsReceiptId}-line-${lineId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptLineItemResponseDto[]; count: number }>(
      'commerce',
      'le.goodsReceipts.lineItemsTable',
      { goodsReceiptId, itemId, lineId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Registers a serial on a goods receipt line
  addLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    dto: AddGoodsReceiptLineItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineItemResponseDto>> {
    this.logger.log(`le.goodsReceipts.addLineItem — lineId: ${lineId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.addLineItem', { goodsReceiptId, itemId, lineId, ...dto });
  }

  // Removes a serial from a goods receipt line
  removeLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    subItemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.removeLineItem — subItemId: ${subItemId}`);
    return this.nats.send('commerce', 'le.goodsReceipts.removeLineItem', {
      goodsReceiptId,
      itemId,
      lineId,
      subItemId,
    });
  }

  // Resolves the legal entity's currency that receipt costs and MRPs are kept in; an LE request carries no site context
  private async leCurrencyCode(legalEntityId: string | undefined): Promise<string> {
    const legalEntity = legalEntityId ? await this.siteRepository.findLegalEntityById(legalEntityId) : undefined;
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');
    return legalEntity.currencyCode;
  }
}
