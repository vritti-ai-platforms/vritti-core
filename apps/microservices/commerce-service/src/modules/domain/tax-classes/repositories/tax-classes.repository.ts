import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type TaxClass, taxClasses } from '@/db/schema';

@Injectable()
export class TaxClassesRepository extends PrimaryBaseRepository<typeof taxClasses> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxClasses);
  }

  // Paginated tax-class options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Lookup by `code` within an org for exact-string matching
  async findByCode(code: string): Promise<TaxClass | undefined> {
    const [row] = await this.db.select().from(taxClasses).where(eq(taxClasses.code, code)).limit(1);
    return row as TaxClass | undefined;
  }
}
