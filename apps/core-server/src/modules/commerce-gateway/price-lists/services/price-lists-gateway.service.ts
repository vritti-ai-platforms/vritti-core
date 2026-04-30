import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  DataTableStateService,
  NatsClientService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreatePriceListDto } from '../dto/request/create-price-list.dto';
import type { SavePriceListItemsDto } from '../dto/request/save-price-list-items.dto';
import type { SaveTerminalPriceListsDto } from '../dto/request/save-terminal-price-lists.dto';
import type { UpdatePriceListDto } from '../dto/request/update-price-list.dto';
import type { PriceListItemResponseDto } from '../dto/response/price-list-item-response.dto';
import type { PriceListResponseDto } from '../dto/response/price-list-response.dto';
import type { PriceListTableResponseDto } from '../dto/response/price-list-table-response.dto';
import type { TerminalPriceListResponseDto } from '../dto/response/terminal-price-list-response.dto';
import type { TerminalSellableItemResponseDto } from '../dto/response/terminal-sellable-item-response.dto';

@Injectable()
export class PriceListsGatewayService {
  private readonly logger = new Logger(PriceListsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated price lists for the data table
  async findForTable(userId: string): Promise<PriceListTableResponseDto> {
    this.logger.log('priceLists.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-price-lists');

    const { result, count } = await this.nats.send<{ result: PriceListResponseDto[]; count: number }>(
      'commerce',
      'priceLists.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns price list options for select dropdowns
  select(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('priceLists.select');
    return this.nats.send('commerce', 'priceLists.select', query);
  }

  // Returns available item variants for price list assignment dropdowns
  selectItemVariants(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('priceLists.itemVariantsSelect');
    return this.nats.send('commerce', 'priceLists.itemVariantsSelect', query);
  }

  // Returns a single price list by ID
  findById(id: string): Promise<PriceListResponseDto> {
    this.logger.log(`priceLists.findById — id: ${id}`);
    return this.nats.send('commerce', 'priceLists.findById', { id });
  }

  // Creates a new price list
  create(dto: CreatePriceListDto): Promise<CreateResponseDto<PriceListResponseDto>> {
    this.logger.log(`priceLists.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'priceLists.create', dto);
  }

  // Updates an existing price list
  update(id: string, dto: UpdatePriceListDto): Promise<SuccessResponseDto> {
    this.logger.log(`priceLists.update — id: ${id}`);
    return this.nats.send('commerce', 'priceLists.update', { id, ...dto });
  }

  // Deletes a price list
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`priceLists.delete — id: ${id}`);
    return this.nats.send('commerce', 'priceLists.delete', { id });
  }

  // Returns item assignments for a price list
  listPriceListItems(priceListId: string): Promise<PriceListItemResponseDto[]> {
    this.logger.log(`priceLists.items.list — priceListId: ${priceListId}`);
    return this.nats.send('commerce', 'priceLists.items.list', { priceListId });
  }

  // Replaces item assignments for a price list
  savePriceListItems(priceListId: string, dto: SavePriceListItemsDto): Promise<SuccessResponseDto> {
    this.logger.log(`priceLists.items.save — priceListId: ${priceListId}`);
    return this.nats.send('commerce', 'priceLists.items.save', { priceListId, ...dto });
  }

  // Returns price list assignments for a terminal
  listTerminalPriceLists(terminalId: string): Promise<TerminalPriceListResponseDto[]> {
    this.logger.log(`priceLists.terminalPriceLists.list — terminalId: ${terminalId}`);
    return this.nats.send('commerce', 'priceLists.terminalPriceLists.list', { terminalId });
  }

  // Replaces price list assignments for a terminal
  saveTerminalPriceLists(terminalId: string, dto: SaveTerminalPriceListsDto): Promise<SuccessResponseDto> {
    this.logger.log(`priceLists.terminalPriceLists.save — terminalId: ${terminalId}`);
    return this.nats.send('commerce', 'priceLists.terminalPriceLists.save', { terminalId, ...dto });
  }

  // Returns resolved sellable items for a terminal
  listTerminalSellableItems(terminalId: string): Promise<TerminalSellableItemResponseDto[]> {
    this.logger.log(`priceLists.terminalSellableItems.list — terminalId: ${terminalId}`);
    return this.nats.send('commerce', 'priceLists.terminalSellableItems.list', { terminalId });
  }
}
