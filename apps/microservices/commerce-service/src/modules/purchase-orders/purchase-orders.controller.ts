import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import type { PurchaseOrderDto, PurchaseOrderItemDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SuppliersRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { PurchaseOrdersItemsService } from './services/purchase-orders-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import { NotFoundException } from '@vritti/api-sdk';
import { PurchaseOrderStatus } from '@/db/schema';
import type { AddPurchaseOrderItemDto } from './dto/request/add-purchase-order-item.dto';
import type { ChangePurchaseOrderCurrencyDto } from './dto/request/change-purchase-order-currency.dto';
import type { ChangePurchaseOrderSupplierDto } from './dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from './dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderItemDto } from './dto/request/update-purchase-order-item.dto';
import type { UpdatePurchaseOrderNotesDto } from './dto/request/update-purchase-order-notes.dto';

@Controller()
export class PurchaseOrdersController {
  private readonly logger = new Logger(PurchaseOrdersController.name);

  constructor(
    private readonly service: PurchaseOrdersService,
    private readonly itemsService: PurchaseOrdersItemsService,
    private readonly goodsReceiptsService: GoodsReceiptsService,
    private readonly suppliersRepository: SuppliersRepository,
  ) {}

  @MessagePattern({ cmd: 'purchaseOrders.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    this.logger.log('purchaseOrders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'purchaseOrders.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('purchaseOrders.select');
    return this.service.findForSelect(data);
  }

  @MessagePattern({ cmd: 'purchaseOrders.create' })
  async create(@Payload() dto: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return this.service.create(dto, supplier.currencyCode);
  }

  @MessagePattern({ cmd: 'purchaseOrders.findById' })
  async findById(@Payload() data: { id: string }): Promise<PurchaseOrderDto> {
    this.logger.log(`purchaseOrders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'purchaseOrders.addItem' })
  async addItem(
    @Payload() data: { id: string } & AddPurchaseOrderItemDto,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`purchaseOrders.addItem — id: ${data.id}, inventoryItemId: ${data.inventoryItemId}`);
    return this.itemsService.addItem(data.id, data);
  }

  @MessagePattern({ cmd: 'purchaseOrders.updateItem' })
  async updateItem(
    @Payload() data: { id: string; itemId: string } & UpdatePurchaseOrderItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateItem — id: ${data.id}, itemId: ${data.itemId}`);
    return this.service.updateItem(data.id, data.itemId, data);
  }

  @MessagePattern({ cmd: 'purchaseOrders.removeItem' })
  async removeItem(@Payload() data: { id: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.removeItem — id: ${data.id}, itemId: ${data.itemId}`);
    return this.service.removeItem(data.id, data.itemId);
  }

  @MessagePattern({ cmd: 'purchaseOrders.updateNotes' })
  async updateNotes(@Payload() data: { id: string } & UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateNotes — id: ${data.id}`);
    return this.service.updateNotes(data.id, data.notes ?? null);
  }

  @MessagePattern({ cmd: 'purchaseOrders.changeSupplier' })
  async changeSupplier(@Payload() data: { id: string } & ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeSupplier — id: ${data.id}, supplier: ${data.supplierId}`);
    const supplier = await this.suppliersRepository.findById(data.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return this.service.changeSupplier(data.id, data.supplierId, supplier.name);
  }

  @MessagePattern({ cmd: 'purchaseOrders.changeCurrency' })
  async changeCurrency(@Payload() data: { id: string } & ChangePurchaseOrderCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeCurrency — id: ${data.id}, currency: ${data.currencyCode}`);
    const po = await this.service.findById(data.id);
    const supplier = await this.suppliersRepository.findById(po.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return this.service.changeCurrency(data.id, data.currencyCode, supplier.currencyCode, data.conversionRate);
  }

  @MessagePattern({ cmd: 'purchaseOrders.items' })
  async items(@Payload() data: { id: string }): Promise<PurchaseOrderItemDto[]> {
    this.logger.log(`purchaseOrders.items — id: ${data.id}`);
    return this.service.findItems(data.id);
  }

  @MessagePattern({ cmd: 'purchaseOrders.itemIds' })
  async itemIds(@Payload() data: { id: string }): Promise<string[]> {
    this.logger.log(`purchaseOrders.itemIds — id: ${data.id}`);
    return this.service.findItemIds(data.id);
  }

  @MessagePattern({ cmd: 'purchaseOrders.itemsTable' })
  async itemsTable(
    @Payload() data: { id: string } & TableViewState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    this.logger.log(`purchaseOrders.itemsTable — id: ${data.id}`);
    const { id, ...state } = data;
    return this.service.findItemsForTable(id, state);
  }

  @MessagePattern({ cmd: 'purchaseOrders.updateStatus' })
  async updateStatus(@Payload() data: { id: string; status: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateStatus — id: ${data.id}, status: ${data.status}`);
    return this.service.updateStatus(data.id, data.status as PurchaseOrderStatus);
  }

  @MessagePattern({ cmd: 'purchaseOrders.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  @MessagePattern({ cmd: 'purchaseOrders.goodsReceipts' })
  async goodsReceipts(
    @Payload() data: { purchaseOrderId: string } & TableViewState,
  ): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log(`purchaseOrders.goodsReceipts — id: ${data.purchaseOrderId}`);
    const { purchaseOrderId, ...state } = data;
    return this.goodsReceiptsService.findForTableByPoId(purchaseOrderId, state);
  }
}
