import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { bom } from '@/db/schema';
import type { CreateBomDto } from '@/modules/bom/dto/request/create-bom.dto';
import type { UpdateBomDto } from '@/modules/bom/dto/request/update-bom.dto';
import { BomDetailDto, BomDto, BomLineDto } from '../dto/entity/bom.dto';
import { BomRepository } from '../repositories/bom.repository';

@Injectable()
export class BomService {
  private readonly logger = new Logger(BomService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: bom.name, type: 'string' },
    code: { column: bom.code, type: 'string' },
    isActive: { column: bom.isActive, type: 'boolean' },
  };

  constructor(private readonly bomRepository: BomRepository) {}

  // Returns paginated, filtered, and sorted BOMs for the data table
  async findForTable(state: TableViewState): Promise<{ result: BomDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, BomService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, BomService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, BomService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.bomRepository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(bom.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(BomDto.from), count };
  }

  // Returns paginated BOM options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.bomRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      groupId: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Creates a new BOM with lines
  async create(data: CreateBomDto): Promise<BomDetailDto> {
    const entity = await this.bomRepository.create({
      name: data.name,
      code: data.code,
      isActive: data.isActive ?? true,
    });

    const lines = await this.bomRepository.createLines(
      (data.lines ?? []).map((line) => ({
        bomId: entity.id,
        inventoryItemId: line.inventoryItemId,
        requiredQuantity: String(line.requiredQuantity),
      })),
    );

    const linesWithNames = await this.bomRepository.findLinesByBomId(entity.id);
    this.logger.log(`Created BOM: ${entity.name} (${entity.code}) with ${lines.length} lines`);
    return BomDetailDto.fromDetail(
      entity,
      linesWithNames.map((l) => BomLineDto.from(l, l.inventoryItemName)),
    );
  }

  // Returns BOM detail with lines
  async findById(id: string): Promise<BomDetailDto> {
    const entity = await this.bomRepository.findById(id);
    if (!entity) throw new NotFoundException('BOM not found.');
    const linesWithNames = await this.bomRepository.findLinesByBomId(id);
    return BomDetailDto.fromDetail(
      entity,
      linesWithNames.map((l) => BomLineDto.from(l, l.inventoryItemName)),
    );
  }

  // Updates a BOM and replaces lines if provided
  async update(id: string, data: UpdateBomDto): Promise<BomDetailDto> {
    const existing = await this.bomRepository.findById(id);
    if (!existing) throw new NotFoundException('BOM not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const entity =
      Object.keys(updatePayload).length > 0 ? await this.bomRepository.update(id, updatePayload) : existing;

    if (data.lines !== undefined) {
      await this.bomRepository.deleteLinesByBomId(id);
      await this.bomRepository.createLines(
        data.lines.map((line) => ({
          bomId: id,
          inventoryItemId: line.inventoryItemId,
          requiredQuantity: String(line.requiredQuantity),
        })),
      );
    }

    const linesWithNames = await this.bomRepository.findLinesByBomId(id);
    this.logger.log(`Updated BOM: ${entity.name} (${entity.id})`);
    return BomDetailDto.fromDetail(
      entity,
      linesWithNames.map((l) => BomLineDto.from(l, l.inventoryItemName)),
    );
  }

  // Deletes a BOM (cascades to lines)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.bomRepository.findById(id);
    if (!existing) throw new NotFoundException('BOM not found.');
    await this.bomRepository.delete(id);
    this.logger.log(`Deleted BOM: ${existing.name} (${id})`);
    return { success: true, message: `BOM "${existing.name}" deleted successfully.` };
  }
}
