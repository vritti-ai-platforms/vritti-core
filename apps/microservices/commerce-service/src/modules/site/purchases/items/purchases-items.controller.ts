import type { PurchaseItemDto } from '@domain/purchase-items/dto/entity/purchase-item.dto';
import type { PurchaseItemFacets } from '@domain/purchase-items/dto/entity/purchase-item-table-row.dto';
import { CreatePurchaseItemDto } from '@domain/purchase-items/dto/request/create-purchase-item.dto';
import { UpdatePurchaseItemDto } from '@domain/purchase-items/dto/request/update-purchase-item.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PurchaseItemAllocationRowDto } from '@/modules/site/purchases/items/dto/entity/purchase-item-allocation-row.dto';
import type { PurchaseItemComparisonDto } from '@/modules/site/purchases/items/dto/entity/purchase-item-detail.dto';
import type { PurchaseItemQuoteRowDto } from '@/modules/site/purchases/items/dto/entity/purchase-item-quote.dto';
import type { PurchaseItemRowDto } from '@/modules/site/purchases/items/dto/entity/purchase-item-row.dto';
import type { PurchaseItemSiteStockDto } from '@/modules/site/purchases/items/dto/entity/purchase-item-site-stock.dto';
import type {
  PurchaseItemCountsDto,
  PurchaseItemDocumentDto,
  PurchaseItemProgressDto,
  PurchaseItemViewDto,
} from '@/modules/site/purchases/items/dto/entity/purchase-item-view.dto';
import { PurchasesItemsService } from './services/purchases-items.service';

@Controller()
export class PurchasesItemsController {
  private readonly logger = new Logger(PurchasesItemsController.name);

  constructor(private readonly service: PurchasesItemsService) {}

  // Adds a purchase item, refusing an item the purchase already has
  @MessagePattern({ cmd: 'site.purchases.items.create' })
  create(@Payload() dto: CreatePurchaseItemDto): Promise<CreateResponseDto<PurchaseItemDto>> {
    this.logger.log(`site.purchases.items.create — id: ${dto.id}, item: ${dto.inventoryItemId}`);
    return this.service.create(dto);
  }

  // Changes a purchase item
  @MessagePattern({ cmd: 'site.purchases.items.update' })
  update(@Payload() dto: UpdatePurchaseItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.update — id: ${dto.id}, item: ${dto.itemId}`);
    return this.service.update(dto);
  }

  // Returns one purchase item as its own page shows it
  @MessagePattern({ cmd: 'site.purchases.items.findById' })
  findById(@Payload() data: { id: string; itemId: string }): Promise<PurchaseItemViewDto> {
    this.logger.log(`site.purchases.items.findById — id: ${data.id}, item: ${data.itemId}`);
    return this.service.findById(data.id, data.itemId);
  }

  // Returns one page of a purchase's items with how far each has got
  @MessagePattern({ cmd: 'site.purchases.items.table' })
  table(@Payload() data: { id: string } & TableState): Promise<{ result: PurchaseItemRowDto[]; count: number }> {
    const { id, ...state } = data;
    this.logger.log(`site.purchases.items.table — id: ${id}`);
    return this.service.findForTable(id, state);
  }

  // Returns one page of a purchase item's allocations
  @MessagePattern({ cmd: 'site.purchases.items.allocations.table' })
  allocationsTable(
    @Payload() data: { id: string; itemId: string } & TableState,
  ): Promise<{ result: PurchaseItemAllocationRowDto[]; count: number }> {
    const { id, itemId, ...state } = data;
    this.logger.log(`site.purchases.items.allocations.table — id: ${id}, item: ${itemId}`);
    return this.service.findAllocationsTable(id, itemId, state);
  }

  // Returns one page of the quotation lines quoting a purchase item
  @MessagePattern({ cmd: 'site.purchases.items.quotes.table' })
  quotesTable(
    @Payload() data: { id: string; itemId: string } & TableState,
  ): Promise<{ result: PurchaseItemQuoteRowDto[]; count: number }> {
    const { id, itemId, ...state } = data;
    this.logger.log(`site.purchases.items.quotes.table — id: ${id}, item: ${itemId}`);
    return this.service.findQuotesTable(id, itemId, state);
  }

  // Returns one page of the document lines that move a purchase item
  @MessagePattern({ cmd: 'site.purchases.items.documents.table' })
  documentsTable(
    @Payload() data: { id: string; itemId: string } & TableState,
  ): Promise<{ result: PurchaseItemDocumentDto[]; count: number }> {
    const { id, itemId, ...state } = data;
    this.logger.log(`site.purchases.items.documents.table — id: ${id}, item: ${itemId}`);
    return this.service.findDocumentsTable(id, itemId, state);
  }

  // Counts a purchase's items in each bucket of the items table
  @MessagePattern({ cmd: 'site.purchases.items.findFacets' })
  findFacets(@Payload() data: { id: string }): Promise<PurchaseItemFacets> {
    this.logger.log(`site.purchases.items.findFacets — id: ${data.id}`);
    return this.service.findFacets(data.id);
  }

  // Returns one page of a purchase's items, each with the quotation lines that quote it and its allocations
  @MessagePattern({ cmd: 'site.purchases.items.findComparison' })
  findComparison(
    @Payload() data: { id: string } & TableState,
  ): Promise<{ result: PurchaseItemComparisonDto[]; count: number }> {
    const { id, ...state } = data;
    this.logger.log(`site.purchases.items.findComparison — id: ${id}`);
    return this.service.findComparison(id, state);
  }

  // Counts what a purchase item's page lists
  @MessagePattern({ cmd: 'site.purchases.items.findCounts' })
  findCounts(@Payload() data: { id: string; itemId: string }): Promise<PurchaseItemCountsDto> {
    this.logger.log(`site.purchases.items.findCounts — id: ${data.id}, item: ${data.itemId}`);
    return this.service.findCounts(data.id, data.itemId);
  }

  // Returns how far a purchase item has got, in all and per supplier
  @MessagePattern({ cmd: 'site.purchases.items.findProgress' })
  findProgress(@Payload() data: { id: string; itemId: string }): Promise<PurchaseItemProgressDto> {
    this.logger.log(`site.purchases.items.findProgress — id: ${data.id}, item: ${data.itemId}`);
    return this.service.findProgress(data.id, data.itemId);
  }

  // Returns the purchase item's stock at the purchase's site, or null while the site does not carry it
  @MessagePattern({ cmd: 'site.purchases.items.findSiteStock' })
  findSiteStock(
    @Payload() data: { id: string; itemId: string },
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<PurchaseItemSiteStockDto | null> {
    this.logger.log(`site.purchases.items.findSiteStock — id: ${data.id}, item: ${data.itemId}`);
    return this.service.findSiteStock(data.id, data.itemId, leCurrencyCode as CurrencyCode);
  }

  // Removes a purchase item
  @MessagePattern({ cmd: 'site.purchases.items.delete' })
  delete(@Payload() data: { id: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.delete — id: ${data.id}, item: ${data.itemId}`);
    return this.service.delete(data.id, data.itemId);
  }
}
