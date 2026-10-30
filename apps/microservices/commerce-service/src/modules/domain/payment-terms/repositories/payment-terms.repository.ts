import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  type NewPaymentTermLine,
  type PaymentTerm,
  type PaymentTermLine,
  PaymentTermStatusValues,
  paymentTermLines,
  paymentTerms,
  supplierSites,
  suppliers,
} from '@/db/schema';

@Injectable()
export class PaymentTermsDomainRepository extends PrimaryBaseRepository<typeof paymentTerms> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentTerms);
  }

  // Paginated payment-term options — active only unless `includeAll` asks for drafts and inactive terms too
  override findForSelect(config: FindForSelectConfig, options?: { includeAll?: boolean }): Promise<SelectQueryResult> {
    if (options?.includeAll) return super.findForSelect(config);
    return super.findForSelect({ ...config, conditions: [eq(paymentTerms.status, PaymentTermStatusValues.ACTIVE)] });
  }

  async findByCode(code: string): Promise<PaymentTerm | undefined> {
    const [row] = await this.db.select().from(paymentTerms).where(eq(paymentTerms.code, code)).limit(1);
    return row as PaymentTerm | undefined;
  }

  async findLines(paymentTermIds: string[]): Promise<PaymentTermLine[]> {
    if (paymentTermIds.length === 0) return [];
    const rows = await this.db
      .select()
      .from(paymentTermLines)
      .where(inArray(paymentTermLines.paymentTermId, paymentTermIds))
      .orderBy(asc(paymentTermLines.dueDays), asc(paymentTermLines.sortOrder));
    return rows as PaymentTermLine[];
  }

  async findLine(paymentTermId: string, id: string): Promise<PaymentTermLine | undefined> {
    const [row] = await this.db
      .select()
      .from(paymentTermLines)
      .where(and(eq(paymentTermLines.id, id), eq(paymentTermLines.paymentTermId, paymentTermId)))
      .limit(1);
    return row as PaymentTermLine | undefined;
  }

  // Appends a rule after the term's existing ones
  async addLine(
    paymentTermId: string,
    line: Omit<NewPaymentTermLine, 'organizationId' | 'paymentTermId' | 'sortOrder'>,
  ): Promise<void> {
    await this.db.insert(paymentTermLines).values({
      ...line,
      paymentTermId,
      sortOrder: sql`(SELECT coalesce(max(${paymentTermLines.sortOrder}) + 1, 0) FROM ${paymentTermLines} WHERE ${paymentTermLines.paymentTermId} = ${paymentTermId})`,
    });
  }

  async updateLine(
    id: string,
    line: Pick<NewPaymentTermLine, 'percent' | 'dueDays' | 'discountPercent' | 'discountDays'>,
  ): Promise<void> {
    await this.db.update(paymentTermLines).set(line).where(eq(paymentTermLines.id, id));
  }

  async deleteLine(id: string): Promise<void> {
    await this.db.delete(paymentTermLines).where(eq(paymentTermLines.id, id));
  }

  // Counts the suppliers and site enrollments that reference a term
  async countUsage(paymentTermId: string): Promise<{ suppliers: number; enrollments: number }> {
    const [row] = await this.db
      .select({
        suppliers: sql<number>`(
          SELECT count(*)::int FROM ${suppliers} s WHERE s.default_payment_term_id = ${paymentTermId}
        )`.mapWith(Number),
        enrollments: sql<number>`(
          SELECT count(*)::int FROM ${supplierSites} ss WHERE ss.payment_term_id = ${paymentTermId}
        )`.mapWith(Number),
      })
      .from(sql`(SELECT 1) AS one`);
    return row ?? { suppliers: 0, enrollments: 0 };
  }
}
