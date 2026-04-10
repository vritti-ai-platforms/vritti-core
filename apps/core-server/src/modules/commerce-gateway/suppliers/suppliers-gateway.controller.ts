import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateSupplierDto } from './dto/request/create-supplier.dto';
import { LinkSupplierItemDto } from './dto/request/link-supplier-item.dto';
import { UpdateSupplierDto } from './dto/request/update-supplier.dto';
import type { SupplierResponseDto } from './dto/response/supplier-response.dto';
import type { SupplierTableResponseDto } from './dto/response/supplier-table-response.dto';
import { SuppliersGatewayService } from './services/suppliers-gateway.service';

@ApiTags('Commerce - Suppliers')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('suppliers')
export class SuppliersGatewayController {
  private readonly logger = new Logger(SuppliersGatewayController.name);

  constructor(private readonly suppliersGatewayService: SuppliersGatewayService) {}

  // Returns paginated suppliers for the data table with server-stored state
  @Get('table')
  getSupplierTable(@UserId() userId: string): Promise<SupplierTableResponseDto> {
    return this.suppliersGatewayService.findForTable(userId);
  }

  // Returns paginated supplier options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.suppliersGatewayService.select(query);
  }

  // Creates a new supplier
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    return this.suppliersGatewayService.create(dto);
  }

  // Returns a single supplier by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<SupplierResponseDto> {
    return this.suppliersGatewayService.findById(id);
  }

  // Updates a supplier by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    return this.suppliersGatewayService.update(id, dto);
  }

  // Deletes a supplier by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.suppliersGatewayService.delete(id);
  }

  // Links an inventory item to a supplier
  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  linkItem(@Param('id') supplierId: string, @Body() dto: LinkSupplierItemDto): Promise<{ success: boolean; message: string }> {
    return this.suppliersGatewayService.linkItem(supplierId, dto);
  }

  // Unlinks an inventory item from a supplier
  @Delete('items/:itemId')
  unlinkItem(@Param('itemId') itemId: string): Promise<{ success: boolean; message: string }> {
    return this.suppliersGatewayService.unlinkItem(itemId);
  }
}
