import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { payments } from '@/db/schema';

@Injectable()
export class PaymentsDomainRepository extends PrimaryBaseRepository<typeof payments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payments);
  }
}
