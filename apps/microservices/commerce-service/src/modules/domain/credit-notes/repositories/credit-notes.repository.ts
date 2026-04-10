import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type CreditNoteApplication,
  type NewCreditNoteApplication,
  creditNoteApplications,
  creditNotes,
} from '@/db/schema';

@Injectable()
export class CreditNotesRepository extends PrimaryBaseRepository<typeof creditNotes> {
  constructor(database: PrimaryDatabaseService) {
    super(database, creditNotes);
  }

  // Returns all applications for a credit note
  async findApplicationsByCreditNoteId(creditNoteId: string): Promise<CreditNoteApplication[]> {
    return this.db
      .select()
      .from(creditNoteApplications)
      .where(eq(creditNoteApplications.creditNoteId, creditNoteId));
  }

  // Creates a credit note application record
  async createApplication(data: NewCreditNoteApplication): Promise<CreditNoteApplication> {
    const results = await this.db.insert(creditNoteApplications).values(data).returning();
    return results[0] as CreditNoteApplication;
  }
}
