import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { InventoryItemQuantWithDisplayDto } from '../dto/entity/inventory-item-quant-with-display.dto';

// Top-level service for inventory-item per-quant reads, each quant's quantities also expressed in the display unit.
@Injectable()
export class InventoryItemsQuantsService {
  private readonly logger = new Logger(InventoryItemsQuantsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly quantsService: InventoryItemQuantsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Returns one quant with its quantities also in the item's display unit
  async findById(id: string): Promise<InventoryItemQuantWithDisplayDto> {
    return this.withDisplay(await this.quantsService.findQuantById(id));
  }

  // Returns an item's quants for its table
  async findForTable(
    inventoryItemId: string,
    state: TableState,
  ): Promise<{ result: InventoryItemQuantWithDisplayDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    const { result, count } = await this.quantsService.findQuantsForTable(inventoryItemId, state);
    return { result: result.map((quant) => this.withDisplay(quant)), count };
  }

  // Returns a keyset page of an item's quants for the mobile feed
  async findFeed(
    inventoryItemId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemQuantWithDisplayDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`findFeed — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    const { edges, pageInfo } = await this.quantsService.findQuantsFeed(inventoryItemId, limit, cursor);
    return { edges: edges.map((edge) => ({ cursor: edge.cursor, node: this.withDisplay(edge.node) })), pageInfo };
  }

  // Swaps a quant's display-unit ratios for its quantities expressed in the display unit
  private withDisplay({ displayUnitRatios, ...quant }: InventoryItemQuantDto): InventoryItemQuantWithDisplayDto {
    return {
      ...quant,
      display: this.uomConversionsService.toDisplayUomQuantities(
        {
          quantity: quant.quantity,
          reservedQuantity: quant.reservedQuantity,
          availableQuantity: quant.availableQuantity,
        },
        displayUnitRatios,
      ),
    };
  }
}
