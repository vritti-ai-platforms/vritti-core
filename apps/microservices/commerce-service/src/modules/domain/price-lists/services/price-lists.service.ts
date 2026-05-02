import { PosTerminalsRepository } from '@domain/pos-terminals/repositories/pos-terminals.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { priceLists } from '@/db/schema';
import type { CreatePriceListDto } from '@/modules/price-lists/dto/request/create-price-list.dto';
import type { SavePriceListItemsDto } from '@/modules/price-lists/dto/request/save-price-list-items.dto';
import type { SaveTerminalPriceListsDto } from '@/modules/price-lists/dto/request/save-terminal-price-lists.dto';
import type { UpdatePriceListDto } from '@/modules/price-lists/dto/request/update-price-list.dto';
import { PriceListDto } from '../dto/entity/price-list.dto';
import { PriceListItemDto } from '../dto/entity/price-list-item.dto';
import { TerminalPriceListDto } from '../dto/entity/terminal-price-list.dto';
import { TerminalSellableItemDto } from '../dto/entity/terminal-sellable-item.dto';
import { PriceListsRepository } from '../repositories/price-lists.repository';

@Injectable()
export class PriceListsService {
  private readonly logger = new Logger(PriceListsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: priceLists.name, type: 'string' },
    code: { column: priceLists.code, type: 'string' },
    isActive: { column: priceLists.isActive, type: 'boolean' },
  };

  constructor(
    private readonly repository: PriceListsRepository,
    private readonly posTerminalsRepository: PosTerminalsRepository,
  ) {}

  // Returns paginated, filtered, and sorted price lists for the data table
  async findForTable(state: TableViewState): Promise<{ result: PriceListDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PriceListsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PriceListsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PriceListsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(priceLists.name)],
      limit,
      offset,
    });

    return {
      result: result.map((row) => PriceListDto.from(row)),
      count,
    };
  }

  // Returns paginated price list options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      where: {
        isActive: true,
      },
    });
  }

  // Returns available item variants for the price list select dropdown
  findItemVariantsForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findItemVariantsForSelect(query.search);
  }

  // Returns a single price list by ID
  async findById(id: string): Promise<PriceListDto> {
    const entity = await this.repository.findByIdWithStats(id);
    if (!entity) throw new NotFoundException('Price list not found.');
    return PriceListDto.from(entity);
  }

  // Creates a new price list
  async create(data: CreatePriceListDto): Promise<CreateResponseDto<PriceListDto>> {
    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      description: data.description || null,
      isActive: data.isActive ?? true,
    });

    const created = await this.repository.findByIdWithStats(entity.id);
    if (!created) throw new NotFoundException('Price list not found.');

    this.logger.log(`Created price list: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Price list "${entity.name}" (${entity.code}) created successfully.`,
      data: PriceListDto.from(created),
    };
  }

  // Updates an existing price list
  async update(id: string, data: UpdatePriceListDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Price list not found.');

    const updated = await this.repository.update(id, {
      ...data,
      description: data.description !== undefined ? data.description || null : undefined,
    });

    this.logger.log(`Updated price list: ${updated.name} (${id})`);
    return { success: true, message: `Price list "${updated.name}" updated successfully.` };
  }

  // Deletes a price list and cascades item/terminal assignments
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Price list not found.');

    await this.repository.delete(id);
    this.logger.log(`Deleted price list: ${existing.name} (${id})`);
    return { success: true, message: `Price list "${existing.name}" deleted successfully.` };
  }

  // Returns assigned inventory items for a price list
  async listPriceListItems(priceListId: string): Promise<PriceListItemDto[]> {
    await this.assertPriceListExists(priceListId);
    const rows = await this.repository.findPriceListItems(priceListId);
    return rows.map((row) => PriceListItemDto.from(row));
  }

  // Replaces item variant assignments for a price list
  async savePriceListItems(priceListId: string, data: SavePriceListItemsDto): Promise<SuccessResponseDto> {
    await this.assertPriceListExists(priceListId);

    const uniqueVariantIds = new Set(data.items.map((item) => item.itemVariantId));
    if (uniqueVariantIds.size !== data.items.length) {
      throw new BadRequestException('Duplicate item variants are not allowed in a price list.');
    }

    if (data.items.length > 0) {
      const variantRows = await this.repository.findItemVariantsByIds(Array.from(uniqueVariantIds));
      if (variantRows.length !== uniqueVariantIds.size) {
        throw new NotFoundException('One or more item variants do not exist.');
      }

      const unavailableVariants = variantRows.filter((variant) => variant.isAvailable !== true);
      if (unavailableVariants.length > 0) {
        throw new BadRequestException('Only available item variants can be assigned to price lists.');
      }
    }

    await this.repository.replacePriceListItems(
      priceListId,
      data.items.map((item, index) => ({
        itemVariantId: item.itemVariantId,
        sortOrder: item.sortOrder ?? index,
        isVisible: item.isVisible ?? true,
        priceOverride: item.priceOverride ?? null,
      })),
    );

    this.logger.log(`Saved ${data.items.length} price list items for price list: ${priceListId}`);
    return {
      success: true,
      message: 'Price list items updated successfully.',
    };
  }

  // Returns assigned price lists for a terminal
  async listTerminalPriceLists(terminalId: string): Promise<TerminalPriceListDto[]> {
    await this.assertTerminalExists(terminalId);
    const rows = await this.repository.findTerminalPriceLists(terminalId);
    return rows.map((row) => TerminalPriceListDto.from(row));
  }

  // Replaces price list assignments for a terminal
  async saveTerminalPriceLists(terminalId: string, data: SaveTerminalPriceListsDto): Promise<SuccessResponseDto> {
    await this.assertTerminalExists(terminalId);

    const uniquePriceListIds = new Set(data.priceLists.map((priceList) => priceList.priceListId));
    if (uniquePriceListIds.size !== data.priceLists.length) {
      throw new BadRequestException('Duplicate price lists are not allowed for a terminal.');
    }

    const defaultAssignments = data.priceLists.filter((priceList) => priceList.isDefault === true);
    if (defaultAssignments.length > 1) {
      throw new BadRequestException({
        label: 'Default Price List Conflict',
        detail: 'Only one price list can be marked as default per terminal.',
        errors: [{ field: 'isDefault', message: 'Only one allowed' }],
      });
    }

    if (data.priceLists.length > 0) {
      const existingPriceListIds = await this.repository.findExistingPriceListIds(Array.from(uniquePriceListIds));
      if (existingPriceListIds.length !== uniquePriceListIds.size) {
        throw new NotFoundException('One or more price lists do not exist.');
      }
    }

    await this.repository.replaceTerminalPriceLists(
      terminalId,
      data.priceLists.map((priceList, index) => ({
        priceListId: priceList.priceListId,
        priority: priceList.priority ?? index,
        isDefault: priceList.isDefault ?? false,
      })),
    );

    this.logger.log(`Saved ${data.priceLists.length} price list assignments for terminal: ${terminalId}`);
    return {
      success: true,
      message: 'Terminal price list assignments updated successfully.',
    };
  }

  // Returns deduplicated sellable inventory items for a terminal from assigned price lists
  async listTerminalSellableItems(terminalId: string): Promise<TerminalSellableItemDto[]> {
    await this.assertTerminalExists(terminalId);

    const rows = await this.repository.findTerminalSellableRows(terminalId);

    const dedupedRows = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!dedupedRows.has(row.itemVariantId)) {
        dedupedRows.set(row.itemVariantId, row);
      }
    }

    return Array.from(dedupedRows.values()).map((row) => TerminalSellableItemDto.from(row));
  }

  // Ensures price list exists before assignment operations
  private async assertPriceListExists(priceListId: string): Promise<void> {
    const priceList = await this.repository.findById(priceListId);
    if (!priceList) throw new NotFoundException('Price list not found.');
  }

  // Ensures terminal exists before price list assignment operations
  private async assertTerminalExists(terminalId: string): Promise<void> {
    const terminal = await this.posTerminalsRepository.findById(terminalId);
    if (!terminal) throw new NotFoundException('POS terminal not found.');
  }
}
