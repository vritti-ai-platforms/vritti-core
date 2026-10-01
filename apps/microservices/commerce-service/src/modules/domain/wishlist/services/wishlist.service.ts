import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
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
   * Saves a product, whether or not the shop can sell it today.
   *
   * Unlike `addItem` on a basket, which must refuse what it cannot sell: a wishlist is the one list
   * whose purpose includes things that are not for sale right now — "tell me when this is back" is
   * why somebody saves rather than buys — so refusing a delisted product refuses the feature. The
   * read path reports those as unavailable and unpriced, which is the honest answer; the save is
   * not the place to argue with it.
   */
  async add(input: {
    appId: string;
    partyId: string;
    catalogId: string;
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
   * Refuses a product that is not this organization's.
   *
   * All a save needs to prove. The stronger check this replaced — that the storefront's catalogue
   * carries it — made the wishlist unable to hold anything sold out, which is most of what a
   * wishlist is for, and it broke the moment a product was delisted under a shopper who was looking
   * at it.
   *
   * RLS is what does the work: the variant is only visible to the organization that owns it, so an
   * id belonging to someone else does not resolve and this refuses it. Which catalogue offers the
   * product, and at what price, is a question every read answers for itself.
   */
  private async assertOurProduct(offeringVariantId: string): Promise<void> {
    if (!(await this.repository.variantExists(offeringVariantId))) {
      throw new NotFoundException({
        label: 'Unknown Product',
        detail: 'That product does not exist.',
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

  /** Which products the party has saved in this storefront, for a product page's toggle. */
  findVariantIds(appId: string, partyId: string): Promise<string[]> {
    return this.repository.findVariantIdsForParty(appId, partyId);
  }
}
