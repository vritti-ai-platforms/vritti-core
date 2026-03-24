import { Body, Controller, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { UserId } from '@vritti/api-sdk';
import { UserService } from '@domain/user/services/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type Observable, firstValueFrom } from 'rxjs';
import { AddOrderItemsDto } from '../dto/request/add-order-items.dto';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { UpdateItemStatusDto } from '../dto/request/update-item-status.dto';
import { UpdateOrderStatusDto } from '../dto/request/update-order-status.dto';
import { OrderGatewayService } from '../services/order-gateway.service';

@ApiTags('Commerce — Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderGatewayController {
  private readonly logger = new Logger(OrderGatewayController.name);

  constructor(private readonly orderGatewayService: OrderGatewayService,
    private readonly userService: UserService,
  ) {}

  // Lists orders for an org+bu with optional status/source filters
  @Get()
  async findAll(
    @UserId() userId: string,
    @Query('businessUnitId') businessUnitId: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
  ): Promise<unknown> {
    this.logger.log('GET /commerce-api/orders');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.orderGatewayService.findAll({ organizationId: user.organizationId, businessUnitId, status, source }));
  }

  // Returns a single order with items
  @Get(':id')
  findById(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`GET /commerce-api/orders/${id}`);
    return this.orderGatewayService.findById(id);
  }

  // Creates a new order with items
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateOrderDto): Promise<unknown> {
    this.logger.log('POST /commerce-api/orders');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.orderGatewayService.create({ ...dto, organizationId: user.organizationId }));
  }

  // Updates the order status
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto): Observable<unknown> {
    this.logger.log(`PATCH /commerce-api/orders/${id}/status`);
    return this.orderGatewayService.updateStatus(id, dto.status);
  }

  // Adds items to an existing order
  @Post(':id/items')
  addItems(@Param('id') id: string, @Body() dto: AddOrderItemsDto): Observable<unknown> {
    this.logger.log(`POST /commerce-api/orders/${id}/items`);
    return this.orderGatewayService.addItems(id, dto);
  }

  // Updates a single order item's status
  @Patch(':id/items/:itemId')
  updateItemStatus(@Param('itemId') itemId: string, @Body() dto: UpdateItemStatusDto): Observable<unknown> {
    this.logger.log(`PATCH /commerce-api/orders/items/${itemId}`);
    return this.orderGatewayService.updateItemStatus(itemId, dto.status);
  }
}
