import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { type NewSupplierContact, supplierContacts, suppliers } from '@/db/schema';

@Injectable()
export class SupplierContactsRepository extends PrimaryBaseRepository<typeof supplierContacts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierContacts);
  }

  async findSupplierById(id: string): Promise<(typeof suppliers.$inferSelect) | undefined> {
    const rows = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return rows[0] as (typeof suppliers.$inferSelect) | undefined;
  }

  async listBySupplierId(supplierId: string): Promise<(typeof supplierContacts.$inferSelect)[]> {
    return this.db
      .select()
      .from(supplierContacts)
      .where(eq(supplierContacts.supplierId, supplierId))
      .orderBy(desc(supplierContacts.isPrimary), desc(supplierContacts.createdAt));
  }

  async findBySupplierAndContactId(
    supplierId: string,
    contactId: string,
  ): Promise<(typeof supplierContacts.$inferSelect) | undefined> {
    const rows = await this.db
      .select()
      .from(supplierContacts)
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.id, contactId)))
      .limit(1);
    return rows[0] as (typeof supplierContacts.$inferSelect) | undefined;
  }

  async countBySupplierId(supplierId: string): Promise<number> {
    const rows = await this.db
      .select()
      .from(supplierContacts)
      .where(eq(supplierContacts.supplierId, supplierId));
    return rows.length;
  }

  async findPrimaryBySupplierId(supplierId: string): Promise<(typeof supplierContacts.$inferSelect) | undefined> {
    const rows = await this.db
      .select()
      .from(supplierContacts)
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.isPrimary, true)))
      .limit(1);
    return rows[0] as (typeof supplierContacts.$inferSelect) | undefined;
  }

  async createContact(
    data: NewSupplierContact,
    tx?: TypedDrizzleClient,
  ): Promise<(typeof supplierContacts.$inferSelect)> {
    const db = tx ?? this.db;
    const rows = await db.insert(supplierContacts).values(data).returning();
    return rows[0] as (typeof supplierContacts.$inferSelect);
  }

  async updateContact(
    id: string,
    data: Partial<NewSupplierContact>,
    tx?: TypedDrizzleClient,
  ): Promise<(typeof supplierContacts.$inferSelect)> {
    const db = tx ?? this.db;
    const rows = await db
      .update(supplierContacts)
      .set(data)
      .where(eq(supplierContacts.id, id))
      .returning();
    return rows[0] as (typeof supplierContacts.$inferSelect);
  }

  async deleteContact(id: string, tx?: TypedDrizzleClient): Promise<void> {
    const db = tx ?? this.db;
    await db.delete(supplierContacts).where(eq(supplierContacts.id, id));
  }

  async clearPrimaryBySupplierId(supplierId: string, tx?: TypedDrizzleClient): Promise<void> {
    const db = tx ?? this.db;
    await db
      .update(supplierContacts)
      .set({ isPrimary: false })
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.isPrimary, true)));
  }

  async syncSupplierPrimaryContact(
    supplierId: string,
    data: { name: string | null; phone: string; email: string | null },
    tx?: TypedDrizzleClient,
  ): Promise<void> {
    const db = tx ?? this.db;
    await db
      .update(suppliers)
      .set({
        contactName: data.name,
        phone: data.phone,
        email: data.email,
      })
      .where(eq(suppliers.id, supplierId));
  }
}
