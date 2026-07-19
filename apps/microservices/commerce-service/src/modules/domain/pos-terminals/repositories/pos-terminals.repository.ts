import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { locations, type PosTerminal, posTerminals } from '@/db/schema';

@Injectable()
export class PosTerminalsDomainRepository extends PrimaryBaseRepository<typeof posTerminals> {
  constructor(database: PrimaryDatabaseService) {
    super(database, posTerminals);
  }

  // Returns paginated POS terminal options for select dropdowns
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns paginated POS terminals with storage location name for table display
  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (PosTerminal & { locationName: string | null; locationPath: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount<PosTerminal & { locationName: string | null; locationPath: string | null }>({
      select: {
        id: posTerminals.id,
        organizationId: posTerminals.organizationId,
        siteId: posTerminals.siteId,
        name: posTerminals.name,
        code: posTerminals.code,
        locationId: posTerminals.locationId,
        catalogId: posTerminals.catalogId,
        description: posTerminals.description,
        isActive: posTerminals.isActive,
        createdAt: posTerminals.createdAt,
        updatedAt: posTerminals.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
      },
      leftJoins: [{ table: locations, on: eq(posTerminals.locationId, locations.id) }],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns a POS terminal with joined storage location name
  async findByIdWithLocationName(
    id: string,
  ): Promise<(PosTerminal & { locationName: string | null; locationPath: string | null }) | undefined> {
    const rows = await this.db
      .select({
        id: posTerminals.id,
        organizationId: posTerminals.organizationId,
        siteId: posTerminals.siteId,
        name: posTerminals.name,
        code: posTerminals.code,
        locationId: posTerminals.locationId,
        catalogId: posTerminals.catalogId,
        description: posTerminals.description,
        isActive: posTerminals.isActive,
        createdAt: posTerminals.createdAt,
        updatedAt: posTerminals.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
      })
      .from(posTerminals)
      .leftJoin(locations, eq(posTerminals.locationId, locations.id))
      .where(eq(posTerminals.id, id));

    return rows[0] as (PosTerminal & { locationName: string | null; locationPath: string | null }) | undefined;
  }
}
