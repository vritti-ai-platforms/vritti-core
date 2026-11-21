import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, ne, type SQL, sql, sum } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type PaymentTerm, paymentTermRules, paymentTerms, supplierEnrollments, suppliers } from '@/db/schema';

export type PaymentTermCounts = {
  ruleCount: number;
};

export type PaymentTermDetail = PaymentTerm &
  PaymentTermCounts & {
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

  // Counts a payment term's rules, throwing when it is out of reach
  async findCountsOrThrow(id: string): Promise<PaymentTermCounts> {
    const counts = await this.findById<PaymentTermCounts>(id, { select: this.counts() });
    if (!counts) throw new NotFoundException('Payment term not found.');
    return counts;
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
      ...this.counts(),
      totalPercent: sql<string>`(${this.db
        .select({ total: sql`coalesce(${sum(paymentTermRules.percent)}, 0)` })
        .from(paymentTermRules)
        .where(ownRules)})`,
      supplierCount: this.db.$count(suppliers, eq(suppliers.defaultPaymentTermId, paymentTerms.id)),
      enrollmentCount: this.db.$count(supplierEnrollments, eq(supplierEnrollments.paymentTermId, paymentTerms.id)),
    };
  }

  // Counts the rows each of a payment term's tabs lists: its rules
  private counts() {
    return {
      ruleCount: this.db.$count(paymentTermRules, eq(paymentTermRules.paymentTermId, paymentTerms.id)),
    };
  }
}
