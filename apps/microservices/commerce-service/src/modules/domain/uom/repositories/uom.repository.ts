import { Injectable } from '@nestjs/common';
import { type FindForSelectConfig, PrimaryBaseRepository, PrimaryDatabaseService, type SelectQueryResult } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type Uom, uom } from '@/db/schema';

@Injectable()
export class UomRepository extends PrimaryBaseRepository<typeof uom> {
  constructor(database: PrimaryDatabaseService) {
    super(database, uom);
  }

  // Returns all UOMs ordered by name
  async findAll(): Promise<Uom[]> {
    return this.model.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Returns paginated UOM options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns the symbol for a given UOM ID (used to resolve base unit symbol)
  async findSymbolById(id: string): Promise<string | null> {
    const result = await this.db.select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, id));
    return result[0]?.symbol ?? null;
  }
}
