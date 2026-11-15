import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { ChangePurchaseOrderExchangeRateDto } from '@domain/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import { ChangePurchaseOrderSupplierDto } from '@domain/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import { SetPurchaseOrderConversionRateDto } from '@domain/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import { UpdatePurchaseOrderNotesDto } from '@domain/purchase-orders/dto/request/update-purchase-order-notes.dto';
import { UpdatePurchaseOrderStatusDto } from '@domain/purchase-orders/dto/request/update-purchase-order-status.dto';
import { UpdatePurchaseOrderTaxDateDto } from '@domain/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PurchaseOrderProblemsDto } from '@/modules/site/purchase-orders/root/dto/entity/purchase-order-problems.dto';
import { PurchaseOrdersService } from '@/modules/site/purchase-orders/root/services/purchase-orders-root.service';
import { LeCreatePurchaseOrderDto } from './dto/request/le-create-purchase-order.dto';

@Controller()
export class LePurchaseOrdersRootController {
  private readonly logger = new Logger(LePurchaseOrdersRootController.name);

  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly service: PurchaseOrdersService,
  ) {}

  // Creates a purchase order at one of the legal entity's sites
  @MessagePattern({ cmd: 'le.purchaseOrders.create' })
  create(
    @Payload() dto: LeCreatePurchaseOrderDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`le.purchaseOrders.create — supplier: ${dto.supplierId}, site: ${dto.siteId}`);
    const { siteId, ...purchaseOrder } = dto;
    return this.service.create(purchaseOrder, { siteId, leCurrencyCode });
  }

  // Updates a purchase order's notes
  @MessagePattern({ cmd: 'le.purchaseOrders.updateNotes' })
  updateNotes(@Payload() dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateNotes — id: ${dto.id}`);
    return this.purchaseOrdersService.updateNotes(dto);
  }

  // Sets a purchase order's tax date and moves the lines that follow it
  @MessagePattern({ cmd: 'le.purchaseOrders.updateTaxDate' })
  updateTaxDate(@Payload() dto: UpdatePurchaseOrderTaxDateDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateTaxDate — id: ${dto.id}, date: ${dto.taxDate}`);
    return this.service.updateTaxDate(dto);
  }

  // Moves a purchase order along its manual workflow: send, confirm or cancel
  @MessagePattern({ cmd: 'le.purchaseOrders.updateStatus' })
  updateStatus(@Payload() dto: UpdatePurchaseOrderStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.updateStatus — id: ${dto.id}, status: ${dto.status}`);
    return this.service.updateStatus(dto);
  }

  // Moves a draft purchase order to another supplier
  @MessagePattern({ cmd: 'le.purchaseOrders.changeSupplier' })
  changeSupplier(
    @Payload() dto: ChangePurchaseOrderSupplierDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.changeSupplier — id: ${dto.id}, supplier: ${dto.supplierId}`);
    return this.service.changeSupplier(dto, leCurrencyCode);
  }

  // Changes a foreign-currency purchase order's exchange rate
  @MessagePattern({ cmd: 'le.purchaseOrders.changeExchangeRate' })
  changeExchangeRate(
    @Payload() dto: ChangePurchaseOrderExchangeRateDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.changeExchangeRate — id: ${dto.id}, rate: ${dto.exchangeRate}`);
    return this.service.changeExchangeRate(dto, leCurrencyCode);
  }

  // Sets the rate from another of the supplier's currencies into the purchase order's
  @MessagePattern({ cmd: 'le.purchaseOrders.setConversionRate' })
  setConversionRate(@Payload() dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.setConversionRate — id: ${dto.id}, currency: ${dto.currencyCode}`);
    return this.service.setConversionRate(dto);
  }

  // Marks a confirmed purchase order delivery completed, cancelling what its lines still had to receive
  @MessagePattern({ cmd: 'le.purchaseOrders.completeDelivery' })
  completeDelivery(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.completeDelivery — id: ${data.id}`);
    return this.service.completeDelivery(data.id);
  }

  // Returns one purchase order
  @MessagePattern({ cmd: 'le.purchaseOrders.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseOrderDto> {
    this.logger.log(`le.purchaseOrders.findById — id: ${data.id}`);
    return this.purchaseOrdersService.findById(data.id);
  }

  // Returns one page of the purchase orders of the legal entity's sites
  @MessagePattern({ cmd: 'le.purchaseOrders.table' })
  table(@Payload() state: TableState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    this.logger.log('le.purchaseOrders.table');
    return this.purchaseOrdersService.findForTable(state);
  }

  // Returns the flags raised on a purchase order's receipts and the open holds on its invoices, grouped by order line
  @MessagePattern({ cmd: 'le.purchaseOrders.problems' })
  problems(@Payload() data: { id: string }): Promise<PurchaseOrderProblemsDto> {
    this.logger.log(`le.purchaseOrders.problems — id: ${data.id}`);
    return this.service.findProblems(data.id);
  }

  // Deletes a draft purchase order
  @MessagePattern({ cmd: 'le.purchaseOrders.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchaseOrders.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
