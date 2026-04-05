import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { type Category, categories } from '@/db/schema';

@Injectable()
export class CategoriesRepository extends PrimaryBaseRepository<typeof categories> {
  constructor(database: PrimaryDatabaseService) {
    super(database, categories);
  }

  // Returns all categories for a specific organization and business unit, ordered by sortOrder
  async findByBu(orgId: string, buId: string): Promise<Category[]> {
    return this.model.findMany({
      where: { organizationId: orgId, businessUnitId: buId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
