import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { organizations } from '@/db/schema';

@Injectable()
export class OrganizationRepository extends PrimaryBaseRepository<typeof organizations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, organizations);
  }
}
