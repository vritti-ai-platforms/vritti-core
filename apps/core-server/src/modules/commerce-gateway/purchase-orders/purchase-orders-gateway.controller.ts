import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreatePurchaseOrderDto } from './dto/request/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/request/update-purchase-order.dto';
import type { PurchaseOrderResponseDto } from './dto/response/purchase-order-response.dto';
import type { PurchaseOrderTableResponseDto } from './dto/response/purchase-order-table-response.dto';
import { PurchaseOrdersGatewayService } from './services/purchase-orders-gateway.service';

@ApiTags('Commerce - Purchase Orders')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('purchase-orders')
export class PurchaseOrdersGatewayController {
  private readonly logger = new Logger(PurchaseOrdersGatewayController.name);

  constructor(private readonly service: PurchaseOrdersGatewayService) {}

  // Returns paginated purchase orders for the data table
  @Get('table')
  getTable(@UserId() userId: string): Promise<PurchaseOrderTableResponseDto> {
    return this.service.findForTable(userId);
  }

  // Creates a new purchase order
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.service.create(dto);
  }

  // Returns a single purchase order by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<PurchaseOrderResponseDto> {
    return this.service.findById(id);
  }

  // Updates a purchase order by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.service.update(id, dto);
  }

  // Updates the status of a purchase order
  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body('status') status: string): Promise<{ success: boolean; message: string }> {
    return this.service.updateStatus(id, status);
  }

  // Deletes a purchase order by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.service.delete(id);
  }
}
