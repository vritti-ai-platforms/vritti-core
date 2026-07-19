import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type LeTaxRegistration, leTaxRegistrations, sites } from '@/db/schema';

@Injectable()
export class LeTaxRegistrationDomainRepository extends PrimaryBaseRepository<typeof leTaxRegistrations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, leTaxRegistrations);
  }

  // Finds all tax registrations for an organization ordered by creation time
  async findByOrg(orgId: string): Promise<LeTaxRegistration[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Finds all tax registrations for a legal entity ordered by creation time
  async findByLegalEntity(legalEntityId: string): Promise<LeTaxRegistration[]> {
    return this.model.findMany({
      where: { legalEntityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Finds a tax registration by legal entity and tax number
  async findByLegalEntityAndTaxNumber(
    legalEntityId: string,
    taxNumber: string,
  ): Promise<LeTaxRegistration | undefined> {
    return this.model.findFirst({
      where: { legalEntityId, taxNumber },
    });
  }

  // Counts tax registrations belonging to a legal entity
  async countByLegalEntity(legalEntityId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(leTaxRegistrations)
      .where(eq(leTaxRegistrations.legalEntityId, legalEntityId));
    return (result[0] as { count: number }).count;
  }

  // Counts sites linked to a tax registration
  async countSitesByRegistration(registrationId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.registrationId, registrationId));
    return (result[0] as { count: number }).count;
  }
}
