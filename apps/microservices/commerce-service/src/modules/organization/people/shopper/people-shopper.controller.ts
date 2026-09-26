import type { StaffWishlistItemDto } from '@domain/wishlist/dto/entity/wishlist.dto';
import { WishlistDomainService } from '@domain/wishlist/services/wishlist.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

/**
 * A person's storefront basket and saved list, for staff looking at their record.
 *
 * Addressed by party alone, unlike the shopper-facing patterns which are scoped to one app: a
 * person may shop in several of the organization's storefronts, and "what is in their basket" is a
 * question about the person, not about one shop. Every row carries the app it belongs to.
 *
 * The wishlist is read-only here. A saved list is the shopper's own, and staff adding to it would be
 * putting words in their mouth; the basket is different, because staff take orders over the phone.
 */
@Controller()
export class PeopleShopperController {
  private readonly logger = new Logger(PeopleShopperController.name);

  constructor(
    private readonly wishlist: WishlistDomainService,
  ) {}

  @MessagePattern({ cmd: 'org.people.wishlist.list' })
  listWishlist(@Payload() data: { partyId: string; currencyCode: string }): Promise<StaffWishlistItemDto[]> {
    this.logger.log(`people.wishlist.list — partyId: ${data.partyId}`);
    return this.wishlist.findAllForParty(data.partyId, data.currencyCode);
  }
}
