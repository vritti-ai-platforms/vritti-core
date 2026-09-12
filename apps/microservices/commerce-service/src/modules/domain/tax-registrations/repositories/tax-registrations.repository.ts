import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type TaxRegistration, taxJurisdictions, taxRegistrations } from '@/db/schema';

export type TaxRegistrationWithJurisdiction = TaxRegistration & {
  jurisdictionName: string | null;
  jurisdictionCode: string | null;
};

@Injectable()
export class TaxRegistrationsDomainRepository extends PrimaryBaseRepository<typeof taxRegistrations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxRegistrations);
  }

  private selection() {
    return {
      ...getColumns(taxRegistrations),
      jurisdictionName: taxJurisdictions.name,
      jurisdictionCode: taxJurisdictions.code,
    };
  }

  private joins() {
    return [{ table: taxJurisdictions, on: eq(taxJurisdictions.id, taxRegistrations.jurisdictionId) }];
  }

  // No id means the caller's own workspace entity, which the request already carries as a GUC
  async findByLegalEntity(legalEntityId?: string): Promise<TaxRegistrationWithJurisdiction[]> {
    const where = legalEntityId
      ? eq(taxRegistrations.legalEntityId, legalEntityId)
      : sql`${taxRegistrations.legalEntityId} = cast(current_setting('app.le_id') as uuid)`;
    const { result } = await this.findAllAndCount<TaxRegistrationWithJurisdiction>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: where as SQL,
      orderBy: [asc(taxJurisdictions.name)],
      limit: 200,
      offset: 0,
    });
    return result;
  }

  // Every registration in the organization — RLS scopes it, so the aggregate needs no org filter
  async findAllInOrg(): Promise<TaxRegistrationWithJurisdiction[]> {
    const { result } = await this.findAllAndCount<TaxRegistrationWithJurisdiction>({
      select: this.selection(),
      leftJoins: this.joins(),
      orderBy: [asc(taxJurisdictions.name)],
      limit: 500,
      offset: 0,
    });
    return result;
  }

  async findByIdWithJurisdiction(id: string): Promise<TaxRegistrationWithJurisdiction | undefined> {
    const { result } = await this.findAllAndCount<TaxRegistrationWithJurisdiction>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(taxRegistrations.id, id),
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  async findForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: TaxRegistrationWithJurisdiction[]; count: number }> {
    return this.findAllAndCount<TaxRegistrationWithJurisdiction>({
      select: this.selection(),
      leftJoins: this.joins(),
      ...options,
    });
  }

  // Clears the primary flag on an entity's other registrations, so at most one stays primary
  async clearPrimary(legalEntityId: string, exceptId?: string): Promise<void> {
    const where = exceptId
      ? and(eq(taxRegistrations.legalEntityId, legalEntityId), ne(taxRegistrations.id, exceptId))
      : eq(taxRegistrations.legalEntityId, legalEntityId);
    await this.db.update(taxRegistrations).set({ isPrimary: false }).where(where);
  }

  async findByNumber(registrationNumber: string): Promise<TaxRegistration | undefined> {
    const [row] = await this.db
      .select()
      .from(taxRegistrations)
      .where(eq(taxRegistrations.registrationNumber, registrationNumber))
      .limit(1);
    return row;
  }
}
