import type { CartDetailDto, CartDto, StaffCartItemDto } from '@domain/carts/dto/entity/cart.dto';
import { CartsDomainService } from '@domain/carts/services/carts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

/**
 * Baskets as the company sees them.
 *
 * The staff surface only. A shopper's own operations are addressed by party and belong to the
 * outlet they are buying from, so they live on the site controller; what a company does with a
 * basket is look at it, open one, and invoice it.
 *
 * The domain service is shared and takes no workspace: `carts` owns its scope columns, so RLS
 * decides what this controller can reach. Reading downward through the workspace tree is what lets
 * a company see a basket filled at one of its tills.
 */
@Controller()
export class LeCartsController {
  private readonly logger = new Logger(LeCartsController.name);

  constructor(private readonly service: CartsDomainService) {}

  // Returns paginated baskets open at this workspace, for the data table
  @MessagePattern({ cmd: 'le.carts.table' })
  table(@Payload() state: TableViewState): Promise<{ result: CartDetailDto[]; count: number }> {
    this.logger.log('le.carts.table');
    return this.service.findForTable(state);
  }

  // Returns a single basket by ID
  @MessagePattern({ cmd: 'le.carts.findById' })
  findById(@Payload() data: { id: string }): Promise<CartDetailDto> {
    this.logger.log(`le.carts.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Returns one basket's lines, priced by the caller's catalogue
  @MessagePattern({ cmd: 'le.carts.findItemsById' })
  findItemsById(
    @Payload() data: { id: string; currencyCode: string; catalogId: string; siteId?: string },
  ): Promise<CartDto> {
    this.logger.log(`le.carts.findItemsById — id: ${data.id}`);
    return this.service.findItemsById(data.id, data.currencyCode, data.catalogId, data.siteId);
  }

  // Opens a basket for a shopper, or hands back the one they already have here
  @MessagePattern({ cmd: 'le.carts.create' })
  create(@Payload() data: { partyId: string; channelId?: string }): Promise<CreateResponseDto<CartDetailDto>> {
    this.logger.log(`le.carts.create — party: ${data.partyId}`);
    return this.service.create(data);
  }

  // Closes a basket outright — the lines go with it
  @MessagePattern({ cmd: 'le.carts.delete' })
  deleteCart(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.carts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  // Staff add a product to a named basket
  @MessagePattern({ cmd: 'le.carts.items.addForCart' })
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
    this.logger.log(`le.carts.items.addForCart — cart: ${data.cartId}, variant: ${data.offeringVariantId}`);
    return this.service.addItemForCart(data);
  }

  @MessagePattern({ cmd: 'le.carts.items.updateForCart' })
  updateItemForCart(
    @Payload()
    data: { cartId: string; partyId: string; offeringVariantId: string; quantity: number; currencyCode: string },
  ): Promise<StaffCartItemDto[]> {
    this.logger.log(`le.carts.items.updateForCart — cart: ${data.cartId}, variant: ${data.offeringVariantId}`);
    return this.service.updateItemForCart(data);
  }

  @MessagePattern({ cmd: 'le.carts.items.removeForCart' })
  removeItemForCart(
    @Payload() data: { cartId: string; partyId: string; offeringVariantId: string; currencyCode: string },
  ): Promise<StaffCartItemDto[]> {
    this.logger.log(`le.carts.items.removeForCart — cart: ${data.cartId}, variant: ${data.offeringVariantId}`);
    return this.service.removeItemForCart(data);
  }
}
