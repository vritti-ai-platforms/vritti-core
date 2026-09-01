import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { smsProviders } from '@/db/schema';

@Injectable()
export class SmsProvidersDomainRepository extends PrimaryBaseRepository<typeof smsProviders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, smsProviders);
  }
}
