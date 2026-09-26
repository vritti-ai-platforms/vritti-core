import type { CartDetailDto, CartDto, StaffCartItemDto } from '@domain/carts/dto/entity/cart.dto';
import {
  AddCartItemDto,
  CartScopeDto,
  ClearCartDto,
  RemoveCartItemDto,
  UpdateCartItemDto,
} from '@domain/carts/dto/request/cart-request.dto';
import { CartsDomainService } from '@domain/carts/services/carts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

/**
 * A shopper's basket, for the organization's own storefronts.
 *
 * Every pattern is addressed by app and party rather than by a basket id — see the domain service
 * for why. The gateway is what fills those in, off the signed request.
 */
@Controller()
export class CartsController {
  private readonly logger = new Logger(CartsController.name);

  constructor(private readonly service: CartsDomainService) {}

  // Returns the open basket, or an empty one. Never creates.
  @MessagePattern({ cmd: 'site.carts.get' })
  get(@Payload() dto: CartScopeDto): Promise<CartDto> {
    this.logger.log(`site.carts.get — party: ${dto.partyId}`);
    return this.service.find(dto.partyId, dto.currencyCode, dto.catalogId, dto.siteId);
  }

  // Adds a listing, opening a basket if this is the first line
  @MessagePattern({ cmd: 'site.carts.items.add' })
  addItem(@Payload() dto: AddCartItemDto): Promise<CartDto> {
    this.logger.log(`site.carts.items.add — party: ${dto.partyId}, variant: ${dto.offeringVariantId}`);
    return this.service.addItem(dto);
  }

  // Sets a line to an exact quantity
  @MessagePattern({ cmd: 'site.carts.items.update' })
  updateItem(@Payload() dto: UpdateCartItemDto): Promise<CartDto> {
    this.logger.log(`site.carts.items.update — party: ${dto.partyId}, variant: ${dto.offeringVariantId}`);
    return this.service.updateItem(dto);
  }

  // Removes a line
  @MessagePattern({ cmd: 'site.carts.items.remove' })
  removeItem(@Payload() dto: RemoveCartItemDto): Promise<CartDto> {
    this.logger.log(`site.carts.items.remove — party: ${dto.partyId}, variant: ${dto.offeringVariantId}`);
    return this.service.removeItem(dto.partyId, dto.catalogId, dto.offeringVariantId, dto.currencyCode, dto.siteId);
  }

  // Returns paginated baskets open at this workspace, for the data table
  @MessagePattern({ cmd: 'site.carts.table' })
  table(@Payload() state: TableViewState): Promise<{ result: CartDetailDto[]; count: number }> {
    this.logger.log('site.carts.table');
    return this.service.findForTable(state);
  }

  // Returns a single basket by ID
  @MessagePattern({ cmd: 'site.carts.findById' })
  findById(@Payload() data: { id: string }): Promise<CartDetailDto> {
    this.logger.log(`site.carts.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Returns one basket's lines, priced by the caller's catalogue
  @MessagePattern({ cmd: 'site.carts.findItemsById' })
  findItemsById(
    @Payload() data: { id: string; currencyCode: string; catalogId: string; siteId?: string },
  ): Promise<CartDto> {
    this.logger.log(`site.carts.findItemsById — id: ${data.id}`);
    return this.service.findItemsById(data.id, data.currencyCode, data.catalogId, data.siteId);
  }

  // Opens a basket for a shopper, or hands back the one they already have here
  @MessagePattern({ cmd: 'site.carts.create' })
  create(@Payload() data: { partyId: string; channelId?: string }): Promise<CreateResponseDto<CartDetailDto>> {
    this.logger.log(`site.carts.create — party: ${data.partyId}`);
    return this.service.create(data);
  }

  // Closes a basket outright — the lines go with it
  @MessagePattern({ cmd: 'site.carts.delete' })
  deleteCart(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  // Staff add a product to a named basket
  @MessagePattern({ cmd: 'site.carts.items.addForCart' })
  addItemForCart(
    @Payload()
    data: {
      cartId: string;
      partyId: string;
      catalogId: string;
      offeringVariantId: string;
      quantity: number;
      currencyCode: string;
    },
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

  // Empties the basket, keeping it open
  @MessagePattern({ cmd: 'site.carts.clear' })
  clear(@Payload() dto: ClearCartDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.clear — party: ${dto.partyId}`);
    return this.service.clear(dto.partyId);
  }
}
