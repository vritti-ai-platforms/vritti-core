import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { suppliers } from '@/db/schema';

@Injectable()
export class SuppliersRepository extends PrimaryBaseRepository<typeof suppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, suppliers);
  }

  // Returns paginated supplier options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }
}
