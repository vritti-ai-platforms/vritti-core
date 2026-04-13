import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { type Category, categories } from '@/db/schema';

@Injectable()
export class CategoriesRepository extends PrimaryBaseRepository<typeof categories> {
  constructor(database: PrimaryDatabaseService) {
    super(database, categories);
  }

  // Returns all categories ordered by sortOrder (RLS scopes to org + BU)
  async findAll(): Promise<Category[]> {
    return this.model.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Returns paginated category options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }
}
