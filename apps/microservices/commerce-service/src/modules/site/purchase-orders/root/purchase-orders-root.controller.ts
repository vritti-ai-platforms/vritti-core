import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import { ChangePurchaseOrderExchangeRateDto } from './dto/request/change-purchase-order-exchange-rate.dto';
import { ChangePurchaseOrderSupplierDto } from './dto/request/change-purchase-order-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/request/create-purchase-order.dto';
import { UpdatePurchaseOrderNotesDto } from './dto/request/update-purchase-order-notes.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/request/update-purchase-order-status.dto';
import { PurchaseOrdersRootService } from './services/purchase-orders-root.service';

@Controller()
export class PurchaseOrdersRootController {
  private readonly logger = new Logger(PurchaseOrdersRootController.name);

  constructor(
    private readonly service: PurchaseOrdersService,
    private readonly appService: PurchaseOrdersRootService,
  ) {}

  @MessagePattern({ cmd: 'site.purchaseOrders.table' })
  table(@Payload() state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    this.logger.log('purchaseOrders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseOrderDto> {
    this.logger.log(`purchaseOrders.findById — id: ${data.id}`);
    return this.appService.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.create' })
  create(
    @Payload() dto: CreatePurchaseOrderDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.appService.create(dto, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.updateNotes' })
  updateNotes(@Payload() dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateNotes — id: ${dto.id}`);
    return this.service.updateNotes(dto.id, dto.notes ?? null);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.changeSupplier' })
  changeSupplier(@Payload() dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeSupplier — id: ${dto.id}, supplier: ${dto.supplierId}`);
    return this.appService.changeSupplier(dto.id, dto);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.changeExchangeRate' })
  changeExchangeRate(
    @Payload() dto: ChangePurchaseOrderExchangeRateDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeExchangeRate — id: ${dto.id}, type: ${dto.exchangeRateType}`);
    return this.appService.changeExchangeRate(dto.id, dto, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.closeShort' })
  closeShort(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.closeShort — id: ${data.id}`);
    return this.service.closeShort(data.id);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.updateStatus' })
  updateStatus(@Payload() dto: UpdatePurchaseOrderStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateStatus — id: ${dto.id}, status: ${dto.status}`);
    return this.service.updateStatus(dto.id, dto.status);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
