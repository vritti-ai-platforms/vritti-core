import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type NewVerification, type Verification, verifications } from '@/db/schema';

@Injectable()
export class VerificationRepository extends PrimaryBaseRepository<typeof verifications> {
  constructor(database: PrimaryDatabaseService) {
    super(database, verifications);
  }

  // Finds the latest verification record for a user
  async findByUserId(userId: string): Promise<Verification | undefined> {
    return this.model.findFirst({ where: { userId } });
  }

  // Deletes existing verification for the user and inserts a fresh one
  async upsert(data: NewVerification): Promise<Verification> {
    await this.db.delete(verifications).where(eq(verifications.userId, data.userId));
    return this.create(data);
  }
}
