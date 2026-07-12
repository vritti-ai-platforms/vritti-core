import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { CreateOrderDto } from './dto/request/create-order.dto';
import { UpdateOrderStatusDto } from './dto/request/update-order-status.dto';
import type { OrderDetailResponseDto, OrderResponseDto } from './dto/response/order-response.dto';
import type { OrderTableResponseDto } from './dto/response/order-table-response.dto';
import { OrdersGatewayService } from './services/orders-gateway.service';

@ApiTags('Commerce - Orders')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('orders')
export class OrdersGatewayController {
  constructor(private readonly ordersGatewayService: OrdersGatewayService) {}

  // Returns paginated orders for the data table with server-stored state
  @Get('table')
  getOrderTable(@UserId() userId: string): Promise<OrderTableResponseDto> {
    return this.ordersGatewayService.findForTable(userId);
  }

  // Creates a new order
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersGatewayService.create(dto);
  }

  // Returns a single order by ID with items and modifiers
  @Get(':id')
  findById(@Param('id') id: string): Promise<OrderDetailResponseDto> {
    return this.ordersGatewayService.findById(id);
  }

  // Updates the status of an order
  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    return this.ordersGatewayService.updateStatus(id, dto);
  }
}
