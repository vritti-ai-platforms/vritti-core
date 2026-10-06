import type { WishlistAddResultDto, WishlistItemDto } from '@domain/wishlist/dto/entity/wishlist.dto';
import {
  AddWishlistItemDto,
  RemoveWishlistItemDto,
  WishlistScopeDto,
} from '@domain/wishlist/dto/request/wishlist-request.dto';
import { WishlistDomainService } from '@domain/wishlist/services/wishlist.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class WishlistController {
  private readonly logger = new Logger(WishlistController.name);

  constructor(private readonly service: WishlistDomainService) {}

  @MessagePattern({ cmd: 'org.wishlist.list' })
  list(@Payload() dto: WishlistScopeDto): Promise<WishlistItemDto[]> {
    this.logger.log(`wishlist.list — party: ${dto.partyId}`);
    return this.service.list(dto.appId, dto.partyId, dto.currencyCode, dto.siteId);
  }

  // Which products the shopper has saved — ids only, for a product page's Saved state
  @MessagePattern({ cmd: 'org.wishlist.variantIds' })
  variantIds(@Payload() data: { appId: string; partyId: string }): Promise<string[]> {
    this.logger.log(`org.wishlist.variantIds — party: ${data.partyId}`);
    return this.service.findVariantIds(data.appId, data.partyId);
  }

  @MessagePattern({ cmd: 'org.wishlist.add' })
  add(@Payload() dto: AddWishlistItemDto): Promise<WishlistAddResultDto> {
    this.logger.log(`wishlist.add — party: ${dto.partyId}, variant: ${dto.offeringVariantId}`);
    return this.service.add(dto);
  }

  @MessagePattern({ cmd: 'org.wishlist.remove' })
  remove(@Payload() dto: RemoveWishlistItemDto): Promise<WishlistItemDto[]> {
    this.logger.log(`wishlist.remove — party: ${dto.partyId}, variant: ${dto.offeringVariantId}`);
    return this.service.remove(dto.appId, dto.partyId, dto.offeringVariantId, dto.currencyCode, dto.siteId);
  }
}
