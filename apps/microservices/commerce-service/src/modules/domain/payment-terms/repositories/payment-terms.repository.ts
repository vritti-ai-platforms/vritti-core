import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, ne, type SQL, sql, sum } from '@vritti/api-sdk/drizzle-orm';
import { type PaymentTerm, paymentTermRules, paymentTerms, supplierEnrollments, suppliers } from '@/db/schema';

export type PaymentTermDetail = PaymentTerm & {
  ruleCount: number;
  totalPercent: string;
  supplierCount: number;
  enrollmentCount: number;
};

@Injectable()
export class PaymentTermsDomainRepository extends PrimaryBaseRepository<typeof paymentTerms> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentTerms);
  }

  // Loads a payment term with its rule count, rule total and how many suppliers and enrollments use it
  findDetail(id: string): Promise<PaymentTermDetail | undefined> {
    return this.findById<PaymentTermDetail>(id, { select: this.selection() });
  }

  // Loads a payment term only while it is a draft
  findDraft(id: string): Promise<PaymentTerm | undefined> {
    return this.findById(id, { where: eq(paymentTerms.isPublished, false) });
  }

  // Whether another payment term of the org already has the name, compared case-insensitively
  isNameTaken(name: string, excludeId?: string): Promise<boolean> {
    return this.exists(
      and(
        sql`lower(${paymentTerms.name}) = lower(${name})`,
        excludeId ? ne(paymentTerms.id, excludeId) : undefined,
      ) as SQL,
    );
  }

  // Selects a payment term with its rule count, rule total and the suppliers and enrollments that use it
  private selection() {
    const ownRules = eq(paymentTermRules.paymentTermId, paymentTerms.id);
    return {
      ...getColumns(paymentTerms),
      ruleCount: this.db.$count(paymentTermRules, ownRules),
      totalPercent: sql<string>`(${this.db
        .select({ total: sql`coalesce(${sum(paymentTermRules.percent)}, 0)` })
        .from(paymentTermRules)
        .where(ownRules)})`,
      supplierCount: this.db.$count(suppliers, eq(suppliers.defaultPaymentTermId, paymentTerms.id)),
      enrollmentCount: this.db.$count(supplierEnrollments, eq(supplierEnrollments.paymentTermId, paymentTerms.id)),
    };
  }
}
