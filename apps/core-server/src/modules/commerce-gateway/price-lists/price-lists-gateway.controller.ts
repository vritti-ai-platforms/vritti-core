import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  UserId,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreate,
  ApiDelete,
  ApiFindById,
  ApiListPriceListItems,
  ApiListTerminalPriceLists,
  ApiListTerminalSellableItems,
  ApiSavePriceListItems,
  ApiSaveTerminalPriceLists,
  ApiSelect,
  ApiSelectItemVariants,
  ApiTable,
  ApiUpdate,
} from './docs/price-lists-gateway.docs';
import { CreatePriceListDto } from './dto/request/create-price-list.dto';
import { SavePriceListItemsDto } from './dto/request/save-price-list-items.dto';
import { SaveTerminalPriceListsDto } from './dto/request/save-terminal-price-lists.dto';
import { UpdatePriceListDto } from './dto/request/update-price-list.dto';
import type { PriceListItemResponseDto } from './dto/response/price-list-item-response.dto';
import type { PriceListResponseDto } from './dto/response/price-list-response.dto';
import type { PriceListTableResponseDto } from './dto/response/price-list-table-response.dto';
import type { TerminalPriceListResponseDto } from './dto/response/terminal-price-list-response.dto';
import type { TerminalSellableItemResponseDto } from './dto/response/terminal-sellable-item-response.dto';
import { PriceListsGatewayService } from './services/price-lists-gateway.service';

@ApiTags('Commerce - Price Lists')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('price-lists')
export class PriceListsGatewayController {
  private readonly logger = new Logger(PriceListsGatewayController.name);

  constructor(private readonly priceListsGatewayService: PriceListsGatewayService) {}

  // Returns paginated price lists for the data table with server-stored state
  @Get('table')
  @ApiTable()
  table(@UserId() userId: string): Promise<PriceListTableResponseDto> {
    this.logger.log('GET /commerce-api/price-lists/table');
    return this.priceListsGatewayService.findForTable(userId);
  }

  // Returns paginated price list options for select dropdowns
  @Get('select')
  @ApiSelect()
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/price-lists/select');
    return this.priceListsGatewayService.select(query);
  }

  // Returns available item variants eligible for price list assignment
  @Get('item-variants/select')
  @ApiSelectItemVariants()
  selectItemVariants(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/price-lists/item-variants/select');
    return this.priceListsGatewayService.selectItemVariants(query);
  }

  // Returns price list assignments for a POS terminal
  @Get('terminals/:terminalId')
  @ApiListTerminalPriceLists()
  listTerminalPriceLists(
    @Param('terminalId', new ParseUUIDPipe()) terminalId: string,
  ): Promise<TerminalPriceListResponseDto[]> {
    this.logger.log(`GET /commerce-api/price-lists/terminals/${terminalId}`);
    return this.priceListsGatewayService.listTerminalPriceLists(terminalId);
  }

  // Replaces price list assignments for a POS terminal
  @Put('terminals/:terminalId')
  @ApiSaveTerminalPriceLists()
  saveTerminalPriceLists(
    @Param('terminalId', new ParseUUIDPipe()) terminalId: string,
    @Body() dto: SaveTerminalPriceListsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/price-lists/terminals/${terminalId}`);
    return this.priceListsGatewayService.saveTerminalPriceLists(terminalId, dto);
  }

  // Returns resolved sellable inventory items for a terminal from its assigned price lists
  @Get('terminals/:terminalId/sellable-items')
  @ApiListTerminalSellableItems()
  listTerminalSellableItems(
    @Param('terminalId', new ParseUUIDPipe()) terminalId: string,
  ): Promise<TerminalSellableItemResponseDto[]> {
    this.logger.log(`GET /commerce-api/price-lists/terminals/${terminalId}/sellable-items`);
    return this.priceListsGatewayService.listTerminalSellableItems(terminalId);
  }

  // Returns inventory item assignments for a price list
  @Get(':id/items')
  @ApiListPriceListItems()
  listPriceListItems(@Param('id', new ParseUUIDPipe()) id: string): Promise<PriceListItemResponseDto[]> {
    this.logger.log(`GET /commerce-api/price-lists/${id}/items`);
    return this.priceListsGatewayService.listPriceListItems(id);
  }

  // Replaces inventory item assignments for a price list
  @Put(':id/items')
  @ApiSavePriceListItems()
  savePriceListItems(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SavePriceListItemsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /commerce-api/price-lists/${id}/items`);
    return this.priceListsGatewayService.savePriceListItems(id, dto);
  }

  // Returns a single price list by ID
  @Get(':id')
  @ApiFindById()
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<PriceListResponseDto> {
    this.logger.log(`GET /commerce-api/price-lists/${id}`);
    return this.priceListsGatewayService.findById(id);
  }

  // Creates a new price list
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreate()
  create(@Body() dto: CreatePriceListDto): Promise<CreateResponseDto<PriceListResponseDto>> {
    this.logger.log('POST /commerce-api/price-lists');
    return this.priceListsGatewayService.create(dto);
  }

  // Updates an existing price list
  @Patch(':id')
  @ApiUpdate()
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePriceListDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/price-lists/${id}`);
    return this.priceListsGatewayService.update(id, dto);
  }

  // Deletes a price list
  @Delete(':id')
  @ApiDelete()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/price-lists/${id}`);
    return this.priceListsGatewayService.delete(id);
  }
}
