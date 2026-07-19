import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type TaxComponent, taxComponents } from '@/db/schema';

@Injectable()
export class TaxComponentsDomainRepository extends PrimaryBaseRepository<typeof taxComponents> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxComponents);
  }

  // Paginated tax-component options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Lookup by `code` within an org for exact-string matching
  async findByCode(code: string): Promise<TaxComponent | undefined> {
    const [row] = await this.db.select().from(taxComponents).where(eq(taxComponents.code, code)).limit(1);
    return row as TaxComponent | undefined;
  }
}
