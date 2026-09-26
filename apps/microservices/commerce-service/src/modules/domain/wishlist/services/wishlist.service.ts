import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { StaffWishlistItemDto, WishlistAddResultDto, WishlistItemDto } from '../dto/entity/wishlist.dto';
import { WishlistDomainRepository } from '../repositories/wishlist.repository';

/**
 * The things a shopper marked to come back to.
 *
 * Addressed by app and party, exactly as a basket is — a caller cannot reach someone else's list
 * because it cannot name a list at all, only its own.
 *
 * Adding and removing are both idempotent. A heart is a toggle somebody will double-tap, and a
 * second tap that errors is worse than one that agrees.
 */
@Injectable()
export class WishlistDomainService {
  private readonly logger = new Logger(WishlistDomainService.name);

  constructor(private readonly repository: WishlistDomainRepository) {}

  async list(
    appId: string,
    partyId: string,
    currencyCode: string,
    catalogId: string,
    siteId?: string,
  ): Promise<WishlistItemDto[]> {
    const rows = await this.repository.findForParty(appId, partyId, currencyCode, catalogId, siteId);
    return rows.map((row) => WishlistItemDto.from(row));
  }

  /**
   * Saves a product.
   *
   * Checked against the storefront's own catalogue first, for the reason `addItem` is: without it a
   * credential could file away something from a catalogue it does not sell and has no business
   * reading. The check proves the offer exists — the row stores the product, not the offer.
   */
  async add(input: {
    appId: string;
    partyId: string;
    catalogId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<WishlistAddResultDto> {
    await this.assertSoldHere(input.catalogId, input.offeringVariantId);
    const created = await this.repository.insertIgnoring(input.appId, input.partyId, input.offeringVariantId);
    this.logger.log(
      created
        ? `saved ${input.offeringVariantId} for party ${input.partyId}`
        : `${input.offeringVariantId} was already on party ${input.partyId}'s wishlist`,
    );

    // The whole list back, not the one row: the caller is redrawing a list of hearts, and a single
    // row would have it guessing at the rest. The flag rides alongside so it can tell "saved" from
    // "already saved" without comparing what it had before.
    const wishlistItems = await this.list(
      input.appId,
      input.partyId,
      input.currencyCode,
      input.catalogId,
      input.siteId,
    );
    return WishlistAddResultDto.from(!created, wishlistItems);
  }

  /**
   * Refuses a product this catalogue does not carry.
   *
   * Callers name the variant — stable across outlets — and this resolves the catalogue's offer of it
   * only to prove there is one. The listing id is thrown away: which catalogue offers a product is a
   * question each read answers, so storing one would pin the row to a catalogue it may outlive.
   */
  private async assertSoldHere(catalogId: string, offeringVariantId: string): Promise<void> {
    const listingId = await this.repository.findListingForVariant(catalogId, offeringVariantId);
    if (!listingId) {
      throw new NotFoundException({
        label: 'Not Sold Here',
        detail: 'This product is not available in this store.',
      });
    }
  }

  /** Unmarks a product. Removing one that was never saved is the state the caller asked for. */
  async remove(
    appId: string,
    partyId: string,
    catalogId: string,
    offeringVariantId: string,
    currencyCode: string,
    siteId?: string,
  ): Promise<WishlistItemDto[]> {
    // No listing to resolve: the row is keyed by the product, so removing it needs nothing from the
    // catalogue — which is also what lets a shopper unsave something the shop has since delisted.
    await this.repository.deleteForParty(appId, partyId, offeringVariantId);
    return this.list(appId, partyId, currencyCode, catalogId, siteId);
  }

  /**
   * Everything a person has saved, for the staff view on their record.
   *
   * Read only, and that is the whole staff surface for wishlistItems: a saved list is the shopper's
   * own, and staff adding to it would be putting words in their mouth.
   */
  async findAllForParty(partyId: string, currencyCode: string): Promise<StaffWishlistItemDto[]> {
    const rows = await this.repository.findAllForParty(partyId, currencyCode);
    return rows.map((row) => StaffWishlistItemDto.fromStaffRow(row));
  }

  /** Clears the whole list — for an account being wound down rather than ordinary use. */
  async clear(appId: string, partyId: string): Promise<SuccessResponseDto> {
    await this.repository.deleteAllForParty(appId, partyId);
    return { success: true, message: 'Wishlist cleared.' };
  }
}
