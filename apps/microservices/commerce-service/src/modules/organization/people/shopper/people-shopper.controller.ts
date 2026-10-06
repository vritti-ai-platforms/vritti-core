import type { StaffWishlistItemDto } from '@domain/wishlist/dto/entity/wishlist.dto';
import { WishlistDomainService } from '@domain/wishlist/services/wishlist.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class PeopleShopperController {
  private readonly logger = new Logger(PeopleShopperController.name);

  constructor(private readonly wishlist: WishlistDomainService) {}

  @MessagePattern({ cmd: 'org.people.wishlist.list' })
  listWishlist(@Payload() data: { partyId: string; currencyCode: string }): Promise<StaffWishlistItemDto[]> {
    this.logger.log(`people.wishlist.list — partyId: ${data.partyId}`);
    return this.wishlist.findAllForParty(data.partyId, data.currencyCode);
  }
}
