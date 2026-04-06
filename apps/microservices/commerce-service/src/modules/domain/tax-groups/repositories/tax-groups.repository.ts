import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { type TaxGroup, taxGroups } from '@/db/schema';

@Injectable()
export class TaxGroupsRepository extends PrimaryBaseRepository<typeof taxGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxGroups);
  }

  // Returns all tax groups for a specific organization and business unit, ordered by sortOrder
  async findByBu(orgId: string, buId: string): Promise<TaxGroup[]> {
    return this.model.findMany({
      where: { organizationId: orgId, businessUnitId: buId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
