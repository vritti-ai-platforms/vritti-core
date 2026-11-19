import type { InventoryItemLedgerDto } from '@domain/inventory-item-ledger/dto/entity/inventory-item-ledger.dto';
import { InventoryItemLedgerDomainService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { InventoryItemLedgerWithDisplayDto } from '../dto/entity/inventory-item-ledger-with-display.dto';

@Injectable()
export class InventoryItemsLedgerService {
  private readonly logger = new Logger(InventoryItemsLedgerService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly ledgerService: InventoryItemLedgerDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Returns paginated ledger entries for an inventory item data table
  async findForTable(
    inventoryItemId: string,
    state: TableState,
  ): Promise<{ result: InventoryItemLedgerWithDisplayDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    const { result, count } = await this.ledgerService.findForTable(inventoryItemId, state);
    return { result: result.map((entry) => this.withDisplay(entry)), count };
  }

  // Returns a keyset page of an item's ledger entries for the mobile feed
  async findFeed(
    inventoryItemId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemLedgerWithDisplayDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`findFeed — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    const { edges, pageInfo } = await this.ledgerService.findFeed(inventoryItemId, limit, cursor);
    return { edges: edges.map((edge) => ({ cursor: edge.cursor, node: this.withDisplay(edge.node) })), pageInfo };
  }

  // Swaps a ledger entry's display-unit ratios for its movement expressed in the display unit
  private withDisplay({ displayUnitRatios, ...entry }: InventoryItemLedgerDto): InventoryItemLedgerWithDisplayDto {
    return {
      ...entry,
      display: this.uomConversionsService.toDisplayUomQuantities({ quantity: entry.quantity }, displayUnitRatios),
    };
  }
}
