import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import { type TaxClass, taxClasses } from '@/db/schema';

@Injectable()
export class TaxClassesDomainRepository extends PrimaryBaseRepository<typeof taxClasses> {
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
