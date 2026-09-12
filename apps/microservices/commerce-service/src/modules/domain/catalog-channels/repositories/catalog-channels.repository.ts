import { Injectable } from '@nestjs/common';
import { MAX_PAGE_SIZE, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type CatalogChannel,
  type CatalogChannelType,
  catalogChannels,
  catalogs,
  type NewCatalogChannel,
  posTerminals,
} from '@/db/schema';
import type { CatalogChannelRow } from '../dto/entity/catalog-channel.dto';

@Injectable()
export class CatalogChannelsDomainRepository extends PrimaryBaseRepository<typeof catalogChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogChannels);
  }

  private selection() {
    return {
      id: catalogChannels.id,
      catalogId: catalogChannels.catalogId,
      catalogName: catalogs.name,
      catalogIsActive: catalogs.isActive,
      type: catalogChannels.type,
      legalEntityId: catalogChannels.legalEntityId,
      siteId: catalogChannels.siteId,
      appId: catalogChannels.appId,
      terminalId: catalogChannels.terminalId,
      terminalName: posTerminals.name,
      createdAt: catalogChannels.createdAt,
      updatedAt: catalogChannels.updatedAt,
    };
  }

  private joins() {
    return [
      { table: catalogs, on: eq(catalogs.id, catalogChannels.catalogId) },
      { table: posTerminals, on: eq(posTerminals.id, catalogChannels.terminalId) },
    ];
  }

  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: CatalogChannelRow[]; count: number }> {
    return this.findAllAndCount<CatalogChannelRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Every channel pointing at one catalog — the read-only tab on the catalog detail
  async findByCatalog(catalogId: string): Promise<CatalogChannelRow[]> {
    const { result } = await this.findAllAndCount<CatalogChannelRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(catalogChannels.catalogId, catalogId),
      orderBy: [asc(catalogChannels.type)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  async findByIdWithRefs(id: string): Promise<CatalogChannelRow | undefined> {
    const { result } = await this.findAllAndCount<CatalogChannelRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(catalogChannels.id, id),
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  async findById(id: string): Promise<CatalogChannel | undefined> {
    return this.model.findFirst({ where: { id } });
  }

  async insertChannel(row: NewCatalogChannel): Promise<CatalogChannel> {
    const [created] = (await this.db.insert(catalogChannels).values(row).returning()) as CatalogChannel[];
    return created;
  }

  async repoint(id: string, catalogId: string): Promise<void> {
    await this.db.update(catalogChannels).set({ catalogId }).where(eq(catalogChannels.id, id));
  }

  async deleteChannel(id: string): Promise<void> {
    await this.db.delete(catalogChannels).where(eq(catalogChannels.id, id));
  }

  // Every binding that could serve this context. A NULL scope column applies everywhere, so the
  // caller's own scope and the wildcards both match; the service then picks the most specific.
  async findCandidates(context: {
    type: CatalogChannelType;
    legalEntityId?: string | null;
    siteId?: string | null;
    appId?: string | null;
    terminalId?: string | null;
  }): Promise<CatalogChannelRow[]> {
    const scopeMatches = (column: typeof catalogChannels.legalEntityId, value: string | null | undefined) =>
      value ? or(isNull(column), eq(column, value)) : isNull(column);

    const { result } = await this.findAllAndCount<CatalogChannelRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: and(
        eq(catalogChannels.type, context.type),
        eq(catalogs.isActive, true),
        scopeMatches(catalogChannels.legalEntityId, context.legalEntityId),
        scopeMatches(catalogChannels.siteId, context.siteId),
        scopeMatches(catalogChannels.appId, context.appId),
        scopeMatches(catalogChannels.terminalId, context.terminalId),
      ) as SQL,
      orderBy: [asc(catalogChannels.createdAt)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  // The catalog a channel points at, for the resolve response
  async findCatalog(catalogId: string) {
    const [row] = await this.db
      .select({ id: catalogs.id, name: catalogs.name, taxInclusive: catalogs.taxInclusive })
      .from(catalogs)
      .where(eq(catalogs.id, catalogId))
      .limit(1);
    return row;
  }

  async countForCatalog(catalogId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(catalogChannels)
      .where(eq(catalogChannels.catalogId, catalogId));
    return row?.n ?? 0;
  }
}
