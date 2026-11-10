import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { ChangePurchaseOrderExchangeRateDto } from '@domain/purchase-orders/dto/request/change-purchase-order-exchange-rate.dto';
import { ChangePurchaseOrderSupplierDto } from '@domain/purchase-orders/dto/request/change-purchase-order-supplier.dto';
import { CreatePurchaseOrderDto } from '@domain/purchase-orders/dto/request/create-purchase-order.dto';
import { SetPurchaseOrderConversionRateDto } from '@domain/purchase-orders/dto/request/set-purchase-order-conversion-rate.dto';
import { UpdatePurchaseOrderNotesDto } from '@domain/purchase-orders/dto/request/update-purchase-order-notes.dto';
import { UpdatePurchaseOrderStatusDto } from '@domain/purchase-orders/dto/request/update-purchase-order-status.dto';
import { UpdatePurchaseOrderTaxDateDto } from '@domain/purchase-orders/dto/request/update-purchase-order-tax-date.dto';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders, RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PurchaseOrderProblemsDto } from './dto/entity/purchase-order-problems.dto';
import { PurchaseOrdersService } from './services/purchase-orders-root.service';

@Controller()
export class PurchaseOrdersRootController {
  private readonly logger = new Logger(PurchaseOrdersRootController.name);

  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly service: PurchaseOrdersService,
  ) {}

  // Returns one page of the site's purchase orders
  @MessagePattern({ cmd: 'site.purchaseOrders.table' })
  table(@Payload() state: TableState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    this.logger.log('site.purchaseOrders.table');
    return this.purchaseOrdersService.findForTable(state);
  }

  // Returns one purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseOrderDto> {
    this.logger.log(`site.purchaseOrders.findById — id: ${data.id}`);
    return this.purchaseOrdersService.findById(data.id);
  }

  // Returns the flags raised on a purchase order's receipts and invoices, grouped by order line
  @MessagePattern({ cmd: 'site.purchaseOrders.problems' })
  problems(@Payload() data: { id: string }): Promise<PurchaseOrderProblemsDto> {
    this.logger.log(`site.purchaseOrders.problems — id: ${data.id}`);
    return this.service.findProblems(data.id);
  }

  // Creates a purchase order at the site, in its timezone and against its legal entity's currency
  @MessagePattern({ cmd: 'site.purchaseOrders.create' })
  create(
    @Payload() dto: CreatePurchaseOrderDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`site.purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.service.create(dto, {
      siteId: headers.siteId,
      timezone: headers.siteTimezone,
      leCurrencyCode: headers.siteCurrencyCode,
    });
  }

  // Updates a purchase order's notes
  @MessagePattern({ cmd: 'site.purchaseOrders.updateNotes' })
  updateNotes(@Payload() dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateNotes — id: ${dto.id}`);
    return this.purchaseOrdersService.updateNotes(dto);
  }

  // Sets a purchase order's tax date and moves the lines that follow it
  @MessagePattern({ cmd: 'site.purchaseOrders.updateTaxDate' })
  updateTaxDate(@Payload() dto: UpdatePurchaseOrderTaxDateDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateTaxDate — id: ${dto.id}, date: ${dto.taxDate}`);
    return this.service.updateTaxDate(dto);
  }

  // Moves a draft purchase order to another supplier
  @MessagePattern({ cmd: 'site.purchaseOrders.changeSupplier' })
  changeSupplier(
    @Payload() dto: ChangePurchaseOrderSupplierDto,
    @RpcSiteCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.changeSupplier — id: ${dto.id}, supplier: ${dto.supplierId}`);
    return this.service.changeSupplier(dto, leCurrencyCode);
  }

  // Changes a foreign-currency purchase order's exchange rate
  @MessagePattern({ cmd: 'site.purchaseOrders.changeExchangeRate' })
  changeExchangeRate(
    @Payload() dto: ChangePurchaseOrderExchangeRateDto,
    @RpcSiteCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.changeExchangeRate — id: ${dto.id}, rate: ${dto.exchangeRate}`);
    return this.purchaseOrdersService.changeExchangeRate(dto, leCurrencyCode);
  }

  // Sets the rate from another of the supplier's currencies into the purchase order's
  @MessagePattern({ cmd: 'site.purchaseOrders.setConversionRate' })
  setConversionRate(@Payload() dto: SetPurchaseOrderConversionRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.setConversionRate — id: ${dto.id}, currency: ${dto.currencyCode}`);
    return this.service.setConversionRate(dto);
  }

  // Closes a purchase order short
  @MessagePattern({ cmd: 'site.purchaseOrders.closeShort' })
  closeShort(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.closeShort — id: ${data.id}`);
    return this.purchaseOrdersService.closeShort(data.id);
  }

  // Moves a purchase order along its manual workflow
  @MessagePattern({ cmd: 'site.purchaseOrders.updateStatus' })
  updateStatus(@Payload() dto: UpdatePurchaseOrderStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateStatus — id: ${dto.id}, status: ${dto.status}`);
    return this.purchaseOrdersService.updateStatus(dto);
  }

  // Deletes a draft purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.delete — id: ${data.id}`);
    return this.purchaseOrdersService.delete(data.id);
  }
}
