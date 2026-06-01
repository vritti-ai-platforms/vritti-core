import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { type CostCategory, type CostCategoryKind, costCategories } from '@/db/schema';

@Injectable()
export class CostCategoriesRepository extends PrimaryBaseRepository<typeof costCategories> {
  constructor(database: PrimaryDatabaseService) {
    super(database, costCategories);
  }

  // Paginated cost-category options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Lookup by `code` within an org. Used when the admin needs an exact-string match.
  async findByCode(code: string): Promise<CostCategory | undefined> {
    const rows = await this.db.select().from(costCategories).where(eq(costCategories.code, code)).limit(1);
    return rows[0] as CostCategory | undefined;
  }

  // Lookup by `kind`. The GR publish auto-associate uses `findByKind('ITEM')` to resolve the
  // supplier-price category; the partial unique index guarantees at most one ITEM-kind row per org,
  // so `.limit(1)` is enough.
  async findByKind(kind: CostCategoryKind): Promise<CostCategory | undefined> {
    const rows = await this.db.select().from(costCategories).where(eq(costCategories.kind, kind)).limit(1);
    return rows[0] as CostCategory | undefined;
  }

  // Cost categories no longer have any referencing cost rows, so hard delete is always allowed.
  async countReferences(_id: string): Promise<{ costRows: number }> {
    return { costRows: 0 };
  }

  // Sets isActive=false without touching anything else. Used by the deactivate flow when the
  // category is in use and hard delete is not permitted.
  async setActive(id: string, isActive: boolean): Promise<CostCategory> {
    const [row] = await this.db
      .update(costCategories)
      .set({ isActive })
      .where(and(eq(costCategories.id, id)))
      .returning();
    return row as CostCategory;
  }
}
