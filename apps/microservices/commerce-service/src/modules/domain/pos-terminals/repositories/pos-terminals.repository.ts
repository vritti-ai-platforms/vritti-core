import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type PosTerminal, posTerminals, storageLocations } from '@/db/schema';

@Injectable()
export class PosTerminalsRepository extends PrimaryBaseRepository<typeof posTerminals> {
  constructor(database: PrimaryDatabaseService) {
    super(database, posTerminals);
  }

  // Returns paginated POS terminal options for select dropdowns
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns paginated POS terminals with storage location name for table display
  async findForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: (PosTerminal & { storageLocationName: string | null })[]; count: number }> {
    return this.findAllAndCount<PosTerminal & { storageLocationName: string | null }>({
      select: {
        id: posTerminals.id,
        organizationId: posTerminals.organizationId,
        businessUnitId: posTerminals.businessUnitId,
        name: posTerminals.name,
        code: posTerminals.code,
        storageLocationId: posTerminals.storageLocationId,
        description: posTerminals.description,
        isActive: posTerminals.isActive,
        createdAt: posTerminals.createdAt,
        updatedAt: posTerminals.updatedAt,
        storageLocationName: storageLocations.name,
      },
      leftJoins: [{ table: storageLocations, on: eq(posTerminals.storageLocationId, storageLocations.id) }],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns a POS terminal with joined storage location name
  async findByIdWithLocationName(id: string): Promise<(PosTerminal & { storageLocationName: string | null }) | undefined> {
    const rows = await this.db
      .select({
        id: posTerminals.id,
        organizationId: posTerminals.organizationId,
        businessUnitId: posTerminals.businessUnitId,
        name: posTerminals.name,
        code: posTerminals.code,
        storageLocationId: posTerminals.storageLocationId,
        description: posTerminals.description,
        isActive: posTerminals.isActive,
        createdAt: posTerminals.createdAt,
        updatedAt: posTerminals.updatedAt,
        storageLocationName: storageLocations.name,
      })
      .from(posTerminals)
      .leftJoin(storageLocations, eq(posTerminals.storageLocationId, storageLocations.id))
      .where(eq(posTerminals.id, id));

    return rows[0] as (PosTerminal & { storageLocationName: string | null }) | undefined;
  }
}
