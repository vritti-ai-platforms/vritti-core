import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { type CreateResponseDto, RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { SessionTypeValues } from '@/db/schema';
import { AddSupplierItemDto } from './dto/request/add-supplier-item.dto';
import { BulkSetSupplierItemPreferredDto } from './dto/request/bulk-set-supplier-item-preferred.dto';
import { BulkSetSupplierItemSchemeDto } from './dto/request/bulk-set-supplier-item-scheme.dto';
import { BulkUnlinkSupplierItemsDto } from './dto/request/bulk-unlink-supplier-items.dto';
import { ChangeSupplierCurrencyDto } from './dto/request/change-supplier-currency.dto';
import { CreateSupplierDto } from './dto/request/create-supplier.dto';
import { CreateSupplierContactDto } from './dto/request/create-supplier-contact.dto';
import { UpdateSupplierDto } from './dto/request/update-supplier.dto';
import { UpdateSupplierContactDto } from './dto/request/update-supplier-contact.dto';
import { UpdateSupplierItemDto } from './dto/request/update-supplier-item.dto';
import type { SupplierContactResponseDto } from './dto/response/supplier-contact-response.dto';
import type { SupplierItemResponseDto } from './dto/response/supplier-item-response.dto';
import type { SupplierItemTableResponseDto } from './dto/response/supplier-item-table-response.dto';
import type { SupplierResponseDto } from './dto/response/supplier-response.dto';
import type { SupplierTableResponseDto } from './dto/response/supplier-table-response.dto';
import { SuppliersGatewayService } from './services/suppliers-gateway.service';

@ApiTags('Commerce - Suppliers')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('suppliers')
export class SuppliersGatewayController {
  private readonly logger = new Logger(SuppliersGatewayController.name);

  constructor(private readonly suppliersGatewayService: SuppliersGatewayService) {}

  // Returns paginated suppliers for the data table with server-stored state
  @Get('table')
  getSupplierTable(@UserId() userId: string): Promise<SupplierTableResponseDto> {
    this.logger.log('GET /commerce-api/suppliers/table');
    return this.suppliersGatewayService.findForTable(userId);
  }

  // Creates a new supplier
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierResponseDto>> {
    this.logger.log('POST /commerce-api/suppliers');
    return this.suppliersGatewayService.create(dto);
  }

  // Returns the unit price for a supplier-item link
  @Get('items/price')
  @ApiQuery({ name: 'supplierId', required: true, type: String })
  @ApiQuery({ name: 'inventoryItemId', required: true, type: String })
  getItemPrice(
    @Query('supplierId') supplierId: string,
    @Query('inventoryItemId') inventoryItemId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log(`GET /commerce-api/suppliers/items/price`);
    return this.suppliersGatewayService.findItemPrice(supplierId, inventoryItemId);
  }

  // Returns linked items for a supplier table
  @Get(':id/items/table')
  getSupplierItemsTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
  ): Promise<SupplierItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/suppliers/${supplierId}/items/table`);
    return this.suppliersGatewayService.findItemsTable(supplierId, userId);
  }

  // Returns linked inventory item IDs for a supplier
  @Get(':id/items/ids')
  getSupplierItemIds(@Param('id') supplierId: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/suppliers/${supplierId}/items/ids`);
    return this.suppliersGatewayService.findItemIds(supplierId);
  }

  // Returns contacts for a supplier
  @Get(':id/contacts')
  getSupplierContacts(@Param('id') supplierId: string): Promise<SupplierContactResponseDto[]> {
    this.logger.log(`GET /commerce-api/suppliers/${supplierId}/contacts`);
    return this.suppliersGatewayService.findContacts(supplierId);
  }

  // Returns a single supplier by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<SupplierResponseDto> {
    this.logger.log(`GET /commerce-api/suppliers/${id}`);
    return this.suppliersGatewayService.findById(id);
  }

  // Updates a supplier by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/suppliers/${id}`);
    return this.suppliersGatewayService.update(id, dto);
  }

  // Deletes a supplier by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/suppliers/${id}`);
    return this.suppliersGatewayService.delete(id);
  }

  // Changes supplier currency and reprices all supplier items
  @Post(':id/change-currency')
  @HttpCode(HttpStatus.OK)
  changeCurrency(@Param('id') id: string, @Body() dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/suppliers/${id}/change-currency`);
    return this.suppliersGatewayService.changeCurrency(id, dto);
  }

  // Adds an inventory item to a supplier
  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @Param('id') supplierId: string,
    @Body() dto: AddSupplierItemDto,
  ): Promise<CreateResponseDto<SupplierItemResponseDto>> {
    this.logger.log(`POST /commerce-api/suppliers/${supplierId}/items`);
    return this.suppliersGatewayService.addItem(supplierId, dto);
  }

  // Bulk-sets the free-goods scheme on multiple supplier items; declared before :itemId so "scheme" is not captured as an item id
  @Patch(':id/items/scheme')
  bulkSetItemScheme(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemSchemeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/suppliers/${supplierId}/items/scheme`);
    return this.suppliersGatewayService.bulkSetItemScheme(supplierId, dto);
  }

  // Bulk-marks supplier items as preferred; declared before :itemId so "preferred" is not captured as an item id
  @Patch(':id/items/preferred')
  bulkSetItemPreferred(
    @Param('id') supplierId: string,
    @Body() dto: BulkSetSupplierItemPreferredDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/suppliers/${supplierId}/items/preferred`);
    return this.suppliersGatewayService.bulkSetItemPreferred(supplierId, dto);
  }

  // Updates a supplier item link
  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/suppliers/${supplierId}/items/${itemId}`);
    return this.suppliersGatewayService.updateItem(supplierId, itemId, dto);
  }

  // Unlinks an inventory item from a supplier
  @Delete(':id/items/:itemId')
  unlinkItem(@Param('id') supplierId: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/suppliers/${supplierId}/items/${itemId}`);
    return this.suppliersGatewayService.unlinkItem(supplierId, itemId);
  }

  // Bulk-unlinks multiple inventory items from a supplier
  @Delete(':id/items')
  bulkUnlinkItems(
    @Param('id') supplierId: string,
    @Body() dto: BulkUnlinkSupplierItemsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/suppliers/${supplierId}/items`);
    return this.suppliersGatewayService.bulkUnlinkItems(supplierId, dto);
  }

  // Adds a contact to a supplier
  @Post(':id/contacts')
  @HttpCode(HttpStatus.CREATED)
  addContact(
    @Param('id') supplierId: string,
    @Body() dto: CreateSupplierContactDto,
  ): Promise<CreateResponseDto<SupplierContactResponseDto>> {
    this.logger.log(`POST /commerce-api/suppliers/${supplierId}/contacts`);
    return this.suppliersGatewayService.addContact(supplierId, dto);
  }

  // Updates a supplier contact
  @Patch(':id/contacts/:contactId')
  updateContact(
    @Param('id') supplierId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateSupplierContactDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/suppliers/${supplierId}/contacts/${contactId}`);
    return this.suppliersGatewayService.updateContact(supplierId, contactId, dto);
  }

  // Deletes a supplier contact
  @Delete(':id/contacts/:contactId')
  deleteContact(@Param('id') supplierId: string, @Param('contactId') contactId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/suppliers/${supplierId}/contacts/${contactId}`);
    return this.suppliersGatewayService.deleteContact(supplierId, contactId);
  }

  // Marks a supplier contact as primary
  @Post(':id/contacts/:contactId/mark-primary')
  markPrimaryContact(
    @Param('id') supplierId: string,
    @Param('contactId') contactId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/suppliers/${supplierId}/contacts/${contactId}/mark-primary`);
    return this.suppliersGatewayService.markPrimaryContact(supplierId, contactId);
  }
}
