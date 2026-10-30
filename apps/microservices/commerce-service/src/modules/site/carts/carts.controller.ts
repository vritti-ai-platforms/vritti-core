import type { CartDetailDto, CartDto, CartItemDto, StaffCartItemDto } from '@domain/carts/dto/entity/cart.dto';
import {
  AddCartItemDto,
  CartScopeDto,
  CartSitesScopeDto,
  ClearCartDto,
  RemoveCartItemDto,
  UpdateCartItemDto,
} from '@domain/carts/dto/request/cart-request.dto';
import { CartsDomainService } from '@domain/carts/services/carts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class CartsController {
  private readonly logger = new Logger(CartsController.name);

  constructor(private readonly service: CartsDomainService) {}

  // Returns the open cart, or an empty one. Never creates.
  @MessagePattern({ cmd: 'site.carts.get' })
  get(@Payload() dto: CartScopeDto): Promise<CartDto> {
    this.logger.log(`site.carts.get — party: ${dto.partyId}`);
    return this.service.find(dto.partyId, dto.currencyCode, dto.appId);
  }

  // Returns the party's carts at the given sites, each read under its own site's reach, empty ones left out
  @MessagePattern({ cmd: 'site.carts.findAtSites' })
  findAtSites(
    @Payload() dto: CartSitesScopeDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<{ siteId: string; cart: CartDto }[]> {
    this.logger.log(`site.carts.findAtSites — party: ${dto.partyId}, sites: ${dto.sites.length}`);
    return this.service.findAtSites(dto.partyId, dto.currencyCode, dto.appId, dto.sites, headers);
  }

  // Adds a listing, opening a cart if this is the first line
  @MessagePattern({ cmd: 'site.carts.items.add' })
  addItem(@Payload() dto: AddCartItemDto): Promise<CartDto> {
    this.logger.log(`site.carts.items.add — party: ${dto.partyId}, code: ${dto.code}`);
    return this.service.addItem(dto);
  }

  // Sets a line to an exact quantity
  @MessagePattern({ cmd: 'site.carts.items.update' })
  updateItem(@Payload() dto: UpdateCartItemDto): Promise<CartDto> {
    this.logger.log(`site.carts.items.update — party: ${dto.partyId}, code: ${dto.code}`);
    return this.service.updateItem(dto);
  }

  // Removes a line
  @MessagePattern({ cmd: 'site.carts.items.remove' })
  removeItem(@Payload() dto: RemoveCartItemDto): Promise<CartDto> {
    this.logger.log(`site.carts.items.remove — party: ${dto.partyId}, code: ${dto.code}`);
    return this.service.removeItem(dto.partyId, dto.code, dto.currencyCode, dto.appId);
  }

  // Returns paginated carts open at this workspace, for the data table
  @MessagePattern({ cmd: 'site.carts.table' })
  table(@Payload() state: TableViewState): Promise<{ result: CartDetailDto[]; count: number }> {
    this.logger.log('site.carts.table');
    return this.service.findForTable(state);
  }

  // Returns a single cart by ID
  @MessagePattern({ cmd: 'site.carts.findById' })
  findById(@Payload() data: { id: string }): Promise<CartDetailDto> {
    this.logger.log(`site.carts.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Returns one cart's lines, priced by the caller's catalogue How many of each product the shopper holds here — a
  // product page's stepper, without pricing
  @MessagePattern({ cmd: 'site.carts.quantities' })
  quantities(@Payload() data: { partyId: string }): Promise<{ code: string; quantity: number }[]> {
    this.logger.log(`site.carts.quantities — party: ${data.partyId}`);
    return this.service.findQuantities(data.partyId);
  }

  // Returns paginated, filtered and sorted items of one cart for the data table
  @MessagePattern({ cmd: 'site.carts.items.table' })
  itemsTable(
    @Payload()
    payload: { cartId: string; currencyCode: string; appId?: string | null } & TableViewState,
  ): Promise<{ result: CartItemDto[]; count: number }> {
    const { cartId, currencyCode, appId, ...state } = payload;
    this.logger.log(`site.carts.items.table — cart: ${cartId}`);
    return this.service.findItemsForTable(cartId, state, currencyCode, appId);
  }

  @MessagePattern({ cmd: 'site.carts.findItemsById' })
  findItemsById(@Payload() data: { id: string; currencyCode: string; appId?: string | null }): Promise<CartDto> {
    this.logger.log(`site.carts.findItemsById — id: ${data.id}`);
    return this.service.findItemsById(data.id, data.currencyCode, data.appId);
  }

  // Opens a cart for a shopper, or hands back the one they already have here
  @MessagePattern({ cmd: 'site.carts.create' })
  create(@Payload() data: { partyId: string }): Promise<CreateResponseDto<CartDetailDto>> {
    this.logger.log(`site.carts.create — party: ${data.partyId}`);
    return this.service.create(data);
  }

  // Closes a cart outright — the lines go with it
  @MessagePattern({ cmd: 'site.carts.delete' })
  deleteCart(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  // Staff add a product to a named cart
  @MessagePattern({ cmd: 'site.carts.items.addForCart' })
  addItemForCart(
    @Payload()
    data: { cartId: string; partyId: string; offeringVariantId: string; quantity: number; currencyCode: string },
  ): Promise<StaffCartItemDto[]> {
    this.logger.log(`site.carts.items.addForCart — cart: ${data.cartId}, variant: ${data.offeringVariantId}`);
    return this.service.addItemForCart(data);
  }

  @MessagePattern({ cmd: 'site.carts.items.updateForCart' })
  updateItemForCart(
    @Payload()
    data: { cartId: string; partyId: string; offeringVariantId: string; quantity: number; currencyCode: string },
  ): Promise<StaffCartItemDto[]> {
    this.logger.log(`site.carts.items.updateForCart — cart: ${data.cartId}, variant: ${data.offeringVariantId}`);
    return this.service.updateItemForCart(data);
  }

  @MessagePattern({ cmd: 'site.carts.items.removeForCart' })
  removeItemForCart(
    @Payload() data: { cartId: string; partyId: string; offeringVariantId: string; currencyCode: string },
  ): Promise<StaffCartItemDto[]> {
    this.logger.log(`site.carts.items.removeForCart — cart: ${data.cartId}, variant: ${data.offeringVariantId}`);
    return this.service.removeItemForCart(data);
  }

  // Empties the cart, keeping it open
  @MessagePattern({ cmd: 'site.carts.clear' })
  clear(@Payload() dto: ClearCartDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.clear — party: ${dto.partyId}`);
    return this.service.clear(dto.partyId);
  }
}
