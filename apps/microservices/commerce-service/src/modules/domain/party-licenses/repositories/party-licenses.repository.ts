import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type PartyLicense, type PartyLicenseType, parties, partyLicenses } from '@/db/schema';

@Injectable()
export class PartyLicensesDomainRepository extends PrimaryBaseRepository<typeof partyLicenses> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyLicenses);
  }

  // Returns paginated licenses filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: PartyLicense[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns true when the owning party exists
  async partyExists(partyId: string): Promise<boolean> {
    const [row] = await this.db.select({ id: parties.id }).from(parties).where(eq(parties.id, partyId)).limit(1);
    return Boolean(row);
  }

  // Looks up a license by type and number within the org
  async findByTypeNumber(licenseType: PartyLicenseType, licenseNumber: string): Promise<PartyLicense | undefined> {
    const [row] = await this.db
      .select()
      .from(partyLicenses)
      .where(and(eq(partyLicenses.licenseType, licenseType), eq(partyLicenses.licenseNumber, licenseNumber)))
      .limit(1);
    return row as PartyLicense | undefined;
  }
}
