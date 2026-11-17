import type { SiteItemStockDto } from '@domain/inventory-item-sites/dto/entity/item-site-stock.dto';
import { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseItemDto } from '@domain/purchase-items/dto/entity/purchase-item.dto';
import type {
  PurchaseItemFacets,
  PurchaseItemTableRowDto,
} from '@domain/purchase-items/dto/entity/purchase-item-table-row.dto';
import type { CreatePurchaseItemDto } from '@domain/purchase-items/dto/request/create-purchase-item.dto';
import type { UpdatePurchaseItemDto } from '@domain/purchase-items/dto/request/update-purchase-item.dto';
import type { QuotingScope } from '@domain/purchase-items/repositories/purchase-items.repository';
import { PurchaseItemsDomainRepository } from '@domain/purchase-items/repositories/purchase-items.repository';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import _ from '@vritti/api-sdk/lodash';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { formatISO } from 'date-fns';
import { PurchasesQuotationsService } from '../../quotations/services/purchases-quotations.service';
import { PurchaseItemAllocationRowDto } from '../dto/entity/purchase-item-allocation-row.dto';
import type { PurchaseItemComparisonDto } from '../dto/entity/purchase-item-detail.dto';
import { PurchaseItemQuoteDto, type PurchaseItemQuoteRowDto } from '../dto/entity/purchase-item-quote.dto';
import {
  PurchaseItemCountsDto,
  PurchaseItemDocumentDto,
  PurchaseItemProgressDto,
  PurchaseItemViewDto,
} from '../dto/entity/purchase-item-view.dto';
import { PurchaseSourcingAllocationDto } from '../dto/entity/purchase-sourcing-allocation.dto';

@Injectable()
export class PurchasesItemsService {
  private readonly logger = new Logger(PurchasesItemsService.name);

  constructor(
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly purchaseItemsRepository: PurchaseItemsDomainRepository,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly inventoryItemSitesRepository: InventoryItemSitesDomainRepository,
    private readonly inventoryItemSitesService: InventoryItemSitesDomainService,
    private readonly purchaseQuotationsService: PurchasesQuotationsService,
  ) {}

  // Adds an item enabled at the purchase's site to its items, or adds the quantity to the line already requesting it
  async create(dto: CreatePurchaseItemDto): Promise<CreateResponseDto<PurchaseItemDto>> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    await this.inventoryItemSitesRepository.ensurePurchasable(
      [dto.inventoryItemId],
      'inventoryItemId',
      purchase.siteId,
    );
    const addition = await this.itemsService.add(purchase, dto);
    this.logger.log(`purchases.items.create — ${purchase.purchaseNumber}, item: ${dto.inventoryItemId}`);
    return {
      success: true,
      message: addition.isMerged
        ? `Quantity added to the item already on "${purchase.purchaseNumber}".`
        : `Item added to "${purchase.purchaseNumber}".`,
      data: await this.itemsService.findById(purchase.id, addition.item.id),
    };
  }

  // Changes a purchase item's quantity, needed-by date or note
  async update(dto: UpdatePurchaseItemDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    const item = await this.purchaseItemsRepository.findOnPurchaseOrThrow(purchase.id, dto.itemId);
    await this.itemsService.update(purchase, item, dto);
    return { success: true, message: `"${item.inventoryItemName}" updated on "${purchase.purchaseNumber}".` };
  }

  // Returns one purchase item as its own page shows it: the item with its category and tax class and what stops it being
  // bought at the purchase's site
  async findById(id: string, itemId: string): Promise<PurchaseItemViewDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const item = await this.purchaseItemsRepository.findViewOnPurchaseOrThrow(purchase.id, itemId, purchase.siteId);
    return PurchaseItemViewDto.fromView(item);
  }

  // Returns one page of a purchase's items with how far each has got, filtered by the bucket the table is on
  async findForTable(id: string, state: TableState): Promise<{ result: PurchaseItemTableRowDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    return this.itemsService.findForTable(purchase, this.quotingScopeOf(purchase), state);
  }

  // Returns one page of a purchase item's allocations, each with its supplier and leg state, the PO it became and whether
  // it may still change
  async findAllocationsTable(
    id: string,
    itemId: string,
    state: TableState,
  ): Promise<{ result: PurchaseItemAllocationRowDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const [page, legs] = await Promise.all([
      this.allocationsService.findForItemTable(purchase.id, itemId, state),
      this.legsService.findByPurchaseId(purchase.id),
    ]);
    const legsById = _.keyBy(legs, 'id');
    return {
      result: page.result.map((row) => {
        const leg = legsById[row.purchaseSupplierId];
        return PurchaseItemAllocationRowDto.fromRow(row, leg, this.allocationsService.isEditable(purchase, leg));
      }),
      count: page.count,
    };
  }

  // Returns one page of the quotation lines quoting a purchase item, priced per primary unit, the cheapest marked
  async findQuotesTable(
    id: string,
    itemId: string,
    state: TableState,
  ): Promise<{ result: PurchaseItemQuoteRowDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    return this.purchaseQuotationsService.findItemQuotesTable(purchase, itemId, state);
  }

  // Returns one page of the document lines that move a purchase item: its PO lines and the deliveries, receipts and
  // invoices on them
  async findDocumentsTable(
    id: string,
    itemId: string,
    state: TableState,
  ): Promise<{ result: PurchaseItemDocumentDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const item = await this.purchaseItemsRepository.findOnPurchaseOrThrow(purchase.id, itemId);
    const { result, count } = await this.itemsService.findDocumentsForTable(item.id, state);
    return { result: result.map(PurchaseItemDocumentDto.from), count };
  }

  // Counts a purchase's items in each bucket of the items table
  async findFacets(id: string): Promise<PurchaseItemFacets> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    return this.itemsService.findFacets(purchase, this.quotingScopeOf(purchase));
  }

  // Returns one page of a purchase's items, each with the quotation lines that quote it, cheapest per primary unit
  // first, and its allocations
  async findComparison(id: string, state: TableState): Promise<{ result: PurchaseItemComparisonDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const page = await this.itemsService.findForTable(purchase, this.quotingScopeOf(purchase), state);
    const itemIds = page.result.map((item) => item.id);
    const [allocations, quotations] = await Promise.all([
      this.describeAllocations(purchase, itemIds),
      this.purchaseQuotationsService.findForItems(purchase, itemIds),
    ]);
    return {
      result: page.result.map((item) => ({
        item,
        quotes: PurchaseItemQuoteDto.forItem(quotations, item.id),
        allocations: allocations.filter((allocation) => allocation.purchaseItemId === item.id),
      })),
      count: page.count,
    };
  }

  // Counts what a purchase item's page lists: its allocations, quotes and document lines
  async findCounts(id: string, itemId: string): Promise<PurchaseItemCountsDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    return PurchaseItemCountsDto.from(await this.purchaseItemsRepository.findCountsOrThrow(purchase.id, itemId));
  }

  // Returns how far a purchase item has got in primary units, in all and per supplier
  async findProgress(id: string, itemId: string): Promise<PurchaseItemProgressDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    return PurchaseItemProgressDto.from(await this.purchaseItemsRepository.findProgressOrThrow(purchase.id, itemId));
  }

  // Returns how the purchase's site carries the item and the stock it holds there, valued in the legal entity's currency;
  // null while the site does not carry it
  async findSiteStock(id: string, itemId: string, leCurrencyCode: CurrencyCode): Promise<SiteItemStockDto | null> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const item = await this.purchaseItemsRepository.findOnPurchaseOrThrow(purchase.id, itemId);
    return this.inventoryItemSitesService.findStockAtSite(item.inventoryItemId, purchase.siteId, leCurrencyCode);
  }

  // Removes an item from a purchase's items
  async delete(id: string, itemId: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const item = await this.purchaseItemsRepository.findOnPurchaseOrThrow(purchase.id, itemId);
    await this.itemsService.remove(purchase, item);
    return { success: true, message: `"${item.inventoryItemName}" removed from "${purchase.purchaseNumber}".` };
  }

  // Where the purchase's quotations count from: its site, valid today
  private quotingScopeOf(purchase: PurchaseRow): QuotingScope {
    return { siteId: purchase.siteId, onDate: formatISO(new Date(), { representation: 'date' }) };
  }

  // Shapes the allocations of the given items with the supplier and state of each one's leg and whether it may change
  private async describeAllocations(
    purchase: PurchaseRow,
    purchaseItemIds: string[],
  ): Promise<PurchaseSourcingAllocationDto[]> {
    const [allocations, legs] = await Promise.all([
      this.allocationsService.findByItemIds(purchaseItemIds),
      this.legsService.findByPurchaseId(purchase.id),
    ]);
    const legsById = _.keyBy(legs, 'id');
    return allocations.map((allocation) => {
      const leg = legsById[allocation.purchaseSupplierId];
      return PurchaseSourcingAllocationDto.fromAllocation(
        allocation,
        leg,
        this.allocationsService.isEditable(purchase, leg),
      );
    });
  }
}
