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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_CARTS } from '@vritti/commerce-permissions/carts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  AddCartLineDto,
  CartsQueryDto,
  OpenCartDto,
  RemoveCartLineQueryDto,
  UpdateCartLineDto,
} from './dto/request/cart-request.dto';
import {
  type CartItemsTableResponse,
  type CartLinesResponse,
  type CartRow,
  type CartTableResponse,
  LeCartsGatewayService,
} from './services/carts-gateway.service';

/** The currency a basket is read in when the caller names none. */
const DEFAULT_CURRENCY = 'INR';

@ApiTags('Commerce - Company Carts')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_CARTS.featureCode)
@Controller('le/carts')
export class LeCartsGatewayController {
  private readonly logger = new Logger(LeCartsGatewayController.name);

  constructor(private readonly service: LeCartsGatewayService) {}

  // Returns paginated baskets for the data table with server-stored state
  @Get('table')
  @RequirePermission(LE_CARTS.view)
  findForTable(@UserId() userId: string): Promise<CartTableResponse> {
    this.logger.log('GET /commerce-api/le/carts/table');
    return this.service.findForTable(userId);
  }

  // Returns paginated items of one basket for the data table with server-stored state
  @Get(':id/items/table')
  @RequirePermission(LE_CARTS.view)
  findItemsForTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: CartsQueryDto,
    @UserId() userId: string,
  ): Promise<CartItemsTableResponse> {
    this.logger.log(`GET /commerce-api/le/carts/${id}/items/table`);
    return this.service.findItemsForTable(id, userId, query.currencyCode ?? DEFAULT_CURRENCY);
  }

  // Opens a basket for a party, or hands back the one they already have here
  @Post()
  @RequirePermission(LE_CARTS.add)
  open(@Body() dto: OpenCartDto): Promise<CreateResponseDto<CartRow>> {
    this.logger.log('POST /commerce-api/le/carts');
    return this.service.create({ partyId: dto.partyId });
  }

  @Get(':id')
  @RequirePermission(LE_CARTS.view)
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<CartRow> {
    this.logger.log(`GET /commerce-api/le/carts/${id}`);
    return this.service.findById(id);
  }

  // Returns the basket's lines, priced through this outlet's channel
  @Get(':id/items')
  @RequirePermission(LE_CARTS.view)
  findItems(@Param('id', new ParseUUIDPipe()) id: string, @Query() query: CartsQueryDto): Promise<CartLinesResponse> {
    this.logger.log(`GET /commerce-api/le/carts/${id}/items`);
    return this.service.findItems(id, query.currencyCode ?? DEFAULT_CURRENCY);
  }

  // Adds a product to the basket
  @Post(':id/items')
  @RequirePermission(LE_CARTS.add)
  @HttpCode(HttpStatus.OK)
  addItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddCartLineDto,
    @Query() query: CartsQueryDto,
  ): Promise<CartLinesResponse> {
    this.logger.log(`POST /commerce-api/le/carts/${id}/items`);
    return this.service.addItem(id, { ...dto, currencyCode: query.currencyCode ?? DEFAULT_CURRENCY });
  }

  /**
   * A line is addressed by its basket and its product.
   *
   * Not by a listing id: which catalogue offers a product is answered per outlet, so the pair that
   * names a line the same way everywhere is the cart it sits in and the variant it holds.
   */
  @Patch(':id/items/:offeringVariantId')
  @RequirePermission(LE_CARTS.edit)
  updateItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('offeringVariantId', new ParseUUIDPipe()) offeringVariantId: string,
    @Body() dto: UpdateCartLineDto,
    @Query() query: CartsQueryDto,
  ): Promise<CartLinesResponse> {
    this.logger.log(`PATCH /commerce-api/le/carts/${id}/items/${offeringVariantId}`);
    return this.service.updateItem(id, offeringVariantId, {
      ...dto,
      currencyCode: query.currencyCode ?? DEFAULT_CURRENCY,
    });
  }

  @Delete(':id/items/:offeringVariantId')
  @RequirePermission(LE_CARTS.delete)
  removeItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('offeringVariantId', new ParseUUIDPipe()) offeringVariantId: string,
    @Query() query: RemoveCartLineQueryDto,
  ): Promise<CartLinesResponse> {
    this.logger.log(`DELETE /commerce-api/le/carts/${id}/items/${offeringVariantId}`);
    return this.service.removeItem(id, offeringVariantId, {
      partyId: query.partyId,
      currencyCode: query.currencyCode ?? DEFAULT_CURRENCY,
    });
  }

  // Closes the basket outright — the lines go with it
  @Delete(':id')
  @RequirePermission(LE_CARTS.delete)
  close(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/carts/${id}`);
    return this.service.delete(id);
  }
}
