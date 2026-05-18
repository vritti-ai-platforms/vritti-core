import type { PriceListDto } from '@domain/price-lists/dto/entity/price-list.dto';
import type { PriceListItemDto } from '@domain/price-lists/dto/entity/price-list-item.dto';
import type { TerminalPriceListDto } from '@domain/price-lists/dto/entity/terminal-price-list.dto';
import type { TerminalSellableItemDto } from '@domain/price-lists/dto/entity/terminal-sellable-item.dto';
import { PriceListsService } from '@domain/price-lists/services/price-lists.service';
import { PosTerminalsRepository } from '@domain/pos-terminals/repositories/pos-terminals.repository';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import { NotFoundException } from '@vritti/api-sdk';
import type { CreatePriceListDto } from './dto/request/create-price-list.dto';
import type { SavePriceListItemsDto } from './dto/request/save-price-list-items.dto';
import type { SaveTerminalPriceListsDto } from './dto/request/save-terminal-price-lists.dto';
import type { UpdatePriceListDto } from './dto/request/update-price-list.dto';

@Controller()
export class PriceListsController {
  private readonly logger = new Logger(PriceListsController.name);

  constructor(
    private readonly priceListsService: PriceListsService,
    private readonly posTerminalsRepository: PosTerminalsRepository,
  ) {}

  // Returns paginated price lists for the data table
  @MessagePattern({ cmd: 'priceLists.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PriceListDto[]; count: number }> {
    this.logger.log('priceLists.table');
    return this.priceListsService.findForTable(state);
  }

  // Returns paginated price list options for select dropdowns
  @MessagePattern({ cmd: 'priceLists.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('priceLists.select');
    return this.priceListsService.findForSelect(data);
  }

  // Returns available item variants for price list assignment dropdowns
  @MessagePattern({ cmd: 'priceLists.itemVariantsSelect' })
  async itemVariantsSelect(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('priceLists.itemVariantsSelect');
    return this.priceListsService.findItemVariantsForSelect(data);
  }

  // Returns a single price list by ID
  @MessagePattern({ cmd: 'priceLists.findById' })
  async findById(@Payload() data: { id: string }): Promise<PriceListDto> {
    this.logger.log(`priceLists.findById — id: ${data.id}`);
    return this.priceListsService.findById(data.id);
  }

  // Creates a new price list
  @MessagePattern({ cmd: 'priceLists.create' })
  async create(@Payload() dto: CreatePriceListDto): Promise<CreateResponseDto<PriceListDto>> {
    this.logger.log(`priceLists.create — name: ${dto.name}, code: ${dto.code}`);
    return this.priceListsService.create(dto);
  }

  // Updates an existing price list
  @MessagePattern({ cmd: 'priceLists.update' })
  async update(@Payload() data: { id: string } & UpdatePriceListDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`priceLists.update — id: ${id}`);
    return this.priceListsService.update(id, updateData);
  }

  // Deletes a price list
  @MessagePattern({ cmd: 'priceLists.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`priceLists.delete — id: ${data.id}`);
    return this.priceListsService.delete(data.id);
  }

  // Returns inventory item assignments for a price list
  @MessagePattern({ cmd: 'priceLists.items.list' })
  async listPriceListItems(@Payload() data: { priceListId: string }): Promise<PriceListItemDto[]> {
    this.logger.log(`priceLists.items.list — priceListId: ${data.priceListId}`);
    return this.priceListsService.listPriceListItems(data.priceListId);
  }

  // Replaces inventory item assignments for a price list
  @MessagePattern({ cmd: 'priceLists.items.save' })
  async savePriceListItems(
    @Payload() data: { priceListId: string } & SavePriceListItemsDto,
  ): Promise<SuccessResponseDto> {
    const { priceListId, ...dto } = data;
    this.logger.log(`priceLists.items.save — priceListId: ${priceListId}, items: ${dto.items.length}`);
    return this.priceListsService.savePriceListItems(priceListId, dto);
  }

  // Returns price list assignments for a POS terminal
  @MessagePattern({ cmd: 'priceLists.terminalPriceLists.list' })
  async listTerminalPriceLists(@Payload() data: { terminalId: string }): Promise<TerminalPriceListDto[]> {
    this.logger.log(`priceLists.terminalPriceLists.list — terminalId: ${data.terminalId}`);
    const terminal = await this.posTerminalsRepository.findById(data.terminalId);
    if (!terminal) throw new NotFoundException('POS terminal not found.');
    return this.priceListsService.listTerminalPriceLists(data.terminalId);
  }

  // Replaces price list assignments for a POS terminal
  @MessagePattern({ cmd: 'priceLists.terminalPriceLists.save' })
  async saveTerminalPriceLists(
    @Payload() data: { terminalId: string } & SaveTerminalPriceListsDto,
  ): Promise<SuccessResponseDto> {
    const { terminalId, ...dto } = data;
    this.logger.log(
      `priceLists.terminalPriceLists.save — terminalId: ${terminalId}, priceLists: ${dto.priceLists.length}`,
    );
    const terminal = await this.posTerminalsRepository.findById(terminalId);
    if (!terminal) throw new NotFoundException('POS terminal not found.');
    return this.priceListsService.saveTerminalPriceLists(terminalId, dto);
  }

  // Returns resolved sellable inventory items for a terminal from its assigned price lists
  @MessagePattern({ cmd: 'priceLists.terminalSellableItems.list' })
  async listTerminalSellableItems(@Payload() data: { terminalId: string }): Promise<TerminalSellableItemDto[]> {
    this.logger.log(`priceLists.terminalSellableItems.list — terminalId: ${data.terminalId}`);
    const terminal = await this.posTerminalsRepository.findById(data.terminalId);
    if (!terminal) throw new NotFoundException('POS terminal not found.');
    return this.priceListsService.listTerminalSellableItems(data.terminalId);
  }
}
