import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { StaffWishlistItemDto, WishlistAddResultDto, WishlistItemDto } from '../dto/entity/wishlist.dto';
import { WishlistDomainRepository } from '../repositories/wishlist.repository';

@Injectable()
export class WishlistDomainService {
  private readonly logger = new Logger(WishlistDomainService.name);

  constructor(private readonly repository: WishlistDomainRepository) {}

  async list(appId: string, partyId: string, currencyCode: string, siteId?: string): Promise<WishlistItemDto[]> {
    const rows = await this.repository.findForParty(appId, partyId, currencyCode, siteId);
    return rows.map((row) => WishlistItemDto.from(row));
  }

  // Saves a product, whether or not the shop can sell it today
  async add(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<WishlistAddResultDto> {
    await this.assertOurProduct(input.offeringVariantId);
    const created = await this.repository.insertIgnoring(input.appId, input.partyId, input.offeringVariantId);
    this.logger.log(
      created
        ? `saved ${input.offeringVariantId} for party ${input.partyId}`
        : `${input.offeringVariantId} was already on party ${input.partyId}'s wishlist`,
    );

    // The whole list back, not the one row: the caller is redrawing a list of hearts, and a single
    // row would have it guessing at the rest. The flag rides alongside so it can tell "saved" from
    // "already saved" without comparing what it had before.
    const wishlistItems = await this.list(input.appId, input.partyId, input.currencyCode, input.siteId);
    return WishlistAddResultDto.from(!created, wishlistItems);
  }

  // Refuses a product that is not this organization's
  private async assertOurProduct(offeringVariantId: string): Promise<void> {
    if (!(await this.repository.variantExists(offeringVariantId))) {
      throw new NotFoundException({
        label: 'Unknown Product',
        detail: 'That product does not exist.',
      });
    }
  }

  // Unmarks a product. Removing one that was never saved is the state the caller asked for
  async remove(
    appId: string,
    partyId: string,
    offeringVariantId: string,
    currencyCode: string,
    siteId?: string,
  ): Promise<WishlistItemDto[]> {
    // No listing to resolve: the row is keyed by the product, so removing it needs nothing from the
    // catalogue — which is also what lets a shopper unsave something the shop has since delisted.
    await this.repository.deleteForParty(appId, partyId, offeringVariantId);
    return this.list(appId, partyId, currencyCode, siteId);
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
  findVariantIds(appId: string, partyId: string): Promise<string[]> {
    return this.repository.findVariantIdsForParty(appId, partyId);
  }
}
