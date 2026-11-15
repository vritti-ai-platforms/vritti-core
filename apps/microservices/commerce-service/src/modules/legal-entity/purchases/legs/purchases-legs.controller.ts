import { CloseSupplierDto } from '@domain/purchase-suppliers/dto/request/close-supplier.dto';
import { ConfirmLegPurchaseOrderDto } from '@domain/purchase-suppliers/dto/request/confirm-leg-purchase-order.dto';
import { CreateLegInboundDeliveryDto } from '@domain/purchase-suppliers/dto/request/create-leg-inbound-delivery.dto';
import { RejectPurchaseLegDto } from '@domain/purchase-suppliers/dto/request/reject-purchase-leg.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type PurchaseLegRef,
  PurchasesLegsService,
} from '@/modules/site/purchases/legs/services/purchases-legs.service';
import { LeCreateLegGoodsReceiptDto } from './dto/request/le-create-leg-goods-receipt.dto';
import { LeCreateLegPurchaseOrderDto } from './dto/request/le-create-leg-purchase-order.dto';

@Controller()
export class LePurchasesLegsController {
  private readonly logger = new Logger(LePurchasesLegsController.name);

  constructor(private readonly service: PurchasesLegsService) {}

  // Starts one leg still in sourcing, routing approval against the legal entity's currency
  @MessagePattern({ cmd: 'le.purchases.legs.submitSupplier' })
  submitSupplier(@Payload() data: PurchaseLegRef, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.submitSupplier — id: ${data.id}, leg: ${data.legId}`);
    return this.service.submitSupplier(data, headers, headers.leCurrencyCode);
  }

  // Approves a leg waiting for approval
  @MessagePattern({ cmd: 'le.purchases.legs.approve' })
  approve(@Payload() data: PurchaseLegRef, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.approve — id: ${data.id}, leg: ${data.legId}`);
    return this.service.approve(data, headers);
  }

  // Rejects a leg waiting for approval, returning only that leg to sourcing
  @MessagePattern({ cmd: 'le.purchases.legs.reject' })
  reject(@Payload() dto: RejectPurchaseLegDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.reject — id: ${dto.id}, leg: ${dto.legId}`);
    return this.service.reject(dto, headers);
  }

  // Creates a leg's purchase orders: one sent purchase order per currency of its allocations, rated against the legal entity's currency
  @MessagePattern({ cmd: 'le.purchases.legs.createPurchaseOrder' })
  createPurchaseOrder(
    @Payload() dto: LeCreateLegPurchaseOrderDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ purchaseOrderIds: string[] }>> {
    this.logger.log(
      `le.purchases.legs.createPurchaseOrder — id: ${dto.id}, leg: ${dto.legId}, orderDate: ${dto.orderDate}`,
    );
    const { timezone, ...order } = dto;
    return this.service.createPurchaseOrder(order, headers, {
      timezone: timezone ?? null,
      leCurrencyCode: headers.leCurrencyCode,
    });
  }

  // Confirms a sent purchase order of a leg
  @MessagePattern({ cmd: 'le.purchases.legs.confirmPurchaseOrder' })
  confirmPurchaseOrder(
    @Payload() dto: ConfirmLegPurchaseOrderDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.purchases.legs.confirmPurchaseOrder — id: ${dto.id}, leg: ${dto.legId}, PO: ${dto.purchaseOrderId}`,
    );
    return this.service.confirmPurchaseOrder(dto, headers);
  }

  // Creates an inbound delivery of a leg's confirmed purchase order lines
  @MessagePattern({ cmd: 'le.purchases.legs.createInboundDelivery' })
  createInboundDelivery(
    @Payload() dto: CreateLegInboundDeliveryDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ inboundDeliveryId: string }>> {
    this.logger.log(
      `le.purchases.legs.createInboundDelivery — id: ${dto.id}, leg: ${dto.legId}, lines: ${dto.lines.length}`,
    );
    return this.service.createInboundDelivery(dto, headers);
  }

  // Starts a draft goods receipt of a leg, from one of its deliveries or its open lines
  @MessagePattern({ cmd: 'le.purchases.legs.createGoodsReceipt' })
  createGoodsReceipt(
    @Payload() dto: LeCreateLegGoodsReceiptDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ goodsReceiptId: string }>> {
    this.logger.log(
      `le.purchases.legs.createGoodsReceipt — id: ${dto.id}, leg: ${dto.legId}, delivery: ${dto.inboundDeliveryId ?? 'none'}`,
    );
    const { timezone, ...receipt } = dto;
    return this.service.createGoodsReceipt(receipt, headers, {
      timezone: timezone ?? null,
      leCurrencyCode: headers.leCurrencyCode,
    });
  }

  // Closes a leg, completing delivery of its open purchase orders
  @MessagePattern({ cmd: 'le.purchases.legs.closeSupplier' })
  closeSupplier(@Payload() dto: CloseSupplierDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.legs.closeSupplier — id: ${dto.id}, leg: ${dto.legId}`);
    return this.service.closeSupplier(dto, headers);
  }
}
