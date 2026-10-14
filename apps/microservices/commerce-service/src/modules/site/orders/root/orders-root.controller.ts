import type { OrderDetailDto, OrderDto } from '@domain/orders/dto/entity/order.dto';
import type { CheckoutOrderDto, OrderPaymentStatusDto } from '@domain/orders/dto/entity/order-checkout.dto';
import { CancelUnpaidOrderDto } from '@domain/orders/dto/request/cancel-unpaid-order.dto';
import { CreateOrderDto } from '@domain/orders/dto/request/create-order.dto';
import { CreateOrderFromCartDto } from '@domain/orders/dto/request/create-order-from-cart.dto';
import { MarkOrderPaidDto } from '@domain/orders/dto/request/mark-order-paid.dto';
import { UpdateOrderStatusDto } from '@domain/orders/dto/request/update-order-status.dto';
import { OrdersDomainService } from '@domain/orders/services/orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import { SiteOrdersService } from './services/orders-root.service';

@Controller()
export class OrdersRootController {
  private readonly logger = new Logger(OrdersRootController.name);

  constructor(
    private readonly service: OrdersDomainService,
    private readonly appService: SiteOrdersService,
  ) {}

  @MessagePattern({ cmd: 'site.orders.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: OrderDto[]; count: number }> {
    this.logger.log('orders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'site.orders.create' })
  async create(@Payload() dto: CreateOrderDto): Promise<OrderDto> {
    this.logger.log(`orders.create — type: ${dto.type}, channel: ${dto.channel}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'site.orders.findById' })
  async findById(@Payload() data: { id: string }): Promise<OrderDetailDto> {
    this.logger.log(`orders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.orders.updateStatus' })
  async updateStatus(@Payload() dto: UpdateOrderStatusDto): Promise<OrderDto> {
    const { id, ...statusData } = dto;
    this.logger.log(`orders.updateStatus — id: ${id}, status: ${statusData.status}`);
    return this.service.updateStatus(id, statusData);
  }

  // Opens an online order from the shopper's basket, awaiting payment
  @MessagePattern({ cmd: 'site.orders.createFromCart' })
  createFromCart(@Payload() dto: CreateOrderFromCartDto, @RpcSiteId() siteId: string): Promise<CheckoutOrderDto> {
    this.logger.log(`orders.createFromCart — party: ${dto.partyId}, currency: ${dto.currencyCode}`);
    return this.appService.createFromCart(dto, siteId);
  }

  // Records a captured payment against an order
  @MessagePattern({ cmd: 'site.orders.markPaid' })
  markPaid(@Payload() dto: MarkOrderPaidDto, @RpcSiteId() siteId: string): Promise<OrderPaymentStatusDto> {
    this.logger.log(`orders.markPaid — order: ${dto.orderId}, intent: ${dto.paymentIntentId}, site: ${siteId}`);
    return this.appService.markPaid(dto, siteId);
  }

  // Abandons a checkout that was never paid
  @MessagePattern({ cmd: 'site.orders.cancelUnpaid' })
  cancelUnpaid(@Payload() dto: CancelUnpaidOrderDto, @RpcSiteId() siteId: string): Promise<OrderPaymentStatusDto> {
    this.logger.log(`orders.cancelUnpaid — order: ${dto.orderId}, site: ${siteId}`);
    return this.service.cancelUnpaid(dto, siteId);
  }
}
