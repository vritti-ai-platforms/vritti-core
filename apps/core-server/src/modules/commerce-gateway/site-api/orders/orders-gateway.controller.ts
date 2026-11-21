import { CreateOrderDto } from '@commerce/orders/dto/request/create-order.dto';
import { UpdateOrderStatusDto } from '@commerce/orders/dto/request/update-order-status.dto';
import type { OrderCountsResponseDto } from '@commerce/orders/dto/response/order-counts-response.dto';
import type {
  OrderPaymentRefundCheckResponseDto,
  OrderPaymentResponseDto,
} from '@commerce/orders/dto/response/order-payment-response.dto';
import type { OrderDetailResponseDto, OrderResponseDto } from '@commerce/orders/dto/response/order-response.dto';
import type { OrderTableResponseDto } from '@commerce/orders/dto/response/order-table-response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_ORDERS } from '@vritti/commerce-permissions/orders';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { ApiFindOrderCounts } from './docs/orders-gateway.docs';
import { OrdersGatewayService } from './services/orders-gateway.service';

@ApiTags('Commerce - Orders')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_ORDERS.featureCode)
@Controller('site/orders')
export class OrdersGatewayController {
  constructor(private readonly ordersGatewayService: OrdersGatewayService) {}

  // Creates a new order
  @Post()
  @RequirePermission(SITE_ORDERS.add)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersGatewayService.create(dto);
  }

  // Updates the status of an order
  @Post(':id/status')
  @RequirePermission(SITE_ORDERS.edit)
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    return this.ordersGatewayService.updateStatus(id, dto);
  }

  // Retries the refund of a payment no order uses, after the gateway refused it
  @Post(':id/payments/:paymentIntentId/refund')
  @RequirePermission(SITE_ORDERS.payments.refund)
  @HttpCode(HttpStatus.OK)
  refundPayment(
    @Param('id') id: string,
    @Param('paymentIntentId') paymentIntentId: string,
  ): Promise<SuccessResponseDto> {
    return this.ordersGatewayService.refundPayment(id, paymentIntentId);
  }

  // Asks the gateway where a pending refund stands and records the answer
  @Post(':id/payments/:paymentIntentId/refund/check')
  @RequirePermission(SITE_ORDERS.payments.view)
  @HttpCode(HttpStatus.OK)
  checkRefund(
    @Param('id') id: string,
    @Param('paymentIntentId') paymentIntentId: string,
  ): Promise<OrderPaymentRefundCheckResponseDto> {
    return this.ordersGatewayService.checkRefund(id, paymentIntentId);
  }

  // Returns a single order by ID with items
  @Get(':id')
  @RequirePermission(SITE_ORDERS.view)
  findById(@Param('id') id: string): Promise<OrderDetailResponseDto> {
    return this.ordersGatewayService.findById(id);
  }

  // Returns paginated orders for the data table with server-stored state
  @Get('table')
  @RequirePermission(SITE_ORDERS.view)
  getOrderTable(@UserId() userId: string): Promise<OrderTableResponseDto> {
    return this.ordersGatewayService.findForTable(userId);
  }

  // Counts an order's items and payments, one per tab of its detail page
  @Get(':id/counts')
  @RequirePermission(SITE_ORDERS.view)
  @ApiFindOrderCounts()
  findCounts(@Param('id') id: string): Promise<OrderCountsResponseDto> {
    return this.ordersGatewayService.findCounts(id);
  }

  // Lists the payments of the order's checkout: the one the order uses, and any second payment to refund
  @Get(':id/payments')
  @RequirePermission(SITE_ORDERS.payments.view)
  listPayments(@Param('id') id: string): Promise<OrderPaymentResponseDto[]> {
    return this.ordersGatewayService.listPayments(id);
  }
}
