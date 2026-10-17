import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { StaffWishlistItemDto, WishlistAddResultDto, WishlistItemDto } from '../dto/entity/wishlist.dto';
import { WishlistDomainRepository } from '../repositories/wishlist.repository';

@Injectable()
export class WishlistDomainService {
  private readonly logger = new Logger(WishlistDomainService.name);

  constructor(private readonly repository: WishlistDomainRepository) {}

  async list(appId: string, partyId: string, currencyCode: string): Promise<WishlistItemDto[]> {
    const rows = await this.repository.findForParty(appId, partyId, currencyCode);
    return rows.map((row) => WishlistItemDto.from(row));
  }

  // Saves a product, whether or not the shop offers it today
  async add(input: {
    appId: string;
    partyId: string;
    code: string;
    currencyCode: string;
  }): Promise<WishlistAddResultDto> {
    const created = await this.repository.insertIgnoring(input.appId, input.partyId, input.code);
    this.logger.log(
      created
        ? `saved ${input.code} for party ${input.partyId}`
        : `${input.code} was already on party ${input.partyId}'s wishlist`,
    );

    // The whole list back, not the one row: the caller is redrawing a list of hearts, and a single
    // row would have it guessing at the rest. The flag rides alongside so it can tell "saved" from
    // "already saved" without comparing what it had before.
    const wishlistItems = await this.list(input.appId, input.partyId, input.currencyCode);
    return WishlistAddResultDto.from(!created, wishlistItems);
  }

  // Unmarks a product. Removing one that was never saved is the state the caller asked for
  async remove(appId: string, partyId: string, code: string, currencyCode: string): Promise<WishlistItemDto[]> {
    // No listing to resolve: the row is keyed by the product, so removing it needs nothing from the
    // catalogue — which is also what lets a shopper unsave something the shop has since delisted.
    await this.repository.deleteForParty(appId, partyId, code);
    return this.list(appId, partyId, currencyCode);
  }

  // Everything a person has saved, for the staff view on their record
  async findAllForParty(partyId: string, currencyCode: string): Promise<StaffWishlistItemDto[]> {
    const rows = await this.repository.findAllForParty(partyId, currencyCode);
    return rows.map((row) => StaffWishlistItemDto.fromStaffRow(row));
  }

  // Clears the whole list — for an account being wound down rather than ordinary use
  async clear(appId: string, partyId: string): Promise<SuccessResponseDto> {
    await this.repository.deleteAllForParty(appId, partyId);
    return { success: true, message: 'Wishlist cleared.' };
  }

  // Which products the party has saved in this storefront, for a product page's toggle
  findCodes(appId: string, partyId: string): Promise<string[]> {
    return this.repository.findCodesForParty(appId, partyId);
  }
}
