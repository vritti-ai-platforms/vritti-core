import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type NewSupplierContact, type Supplier, type SupplierContact, supplierContacts, suppliers } from '@/db/schema';

@Injectable()
export class SupplierContactsRepository extends PrimaryBaseRepository<typeof supplierContacts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierContacts);
  }

  async findSupplierById(id: string): Promise<Supplier | undefined> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return row as Supplier | undefined;
  }

  async listBySupplierId(supplierId: string): Promise<SupplierContact[]> {
    return this.db
      .select()
      .from(supplierContacts)
      .where(eq(supplierContacts.supplierId, supplierId))
      .orderBy(desc(supplierContacts.isPrimary), desc(supplierContacts.createdAt));
  }

  async findBySupplierAndContactId(
    supplierId: string,
    contactId: string,
  ): Promise<SupplierContact | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierContacts)
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.id, contactId)))
      .limit(1);
    return row as SupplierContact | undefined;
  }

  async countBySupplierId(supplierId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(supplierContacts)
      .where(eq(supplierContacts.supplierId, supplierId));
    return Number(row.count);
  }

  async findPrimaryBySupplierId(supplierId: string): Promise<SupplierContact | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierContacts)
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.isPrimary, true)))
      .limit(1);
    return row as SupplierContact | undefined;
  }

  async createContact(data: NewSupplierContact): Promise<SupplierContact> {
    const [row] = await this.db.insert(supplierContacts).values(data).returning();
    return row as SupplierContact;
  }

  async updateContact(
    id: string,
    data: Partial<NewSupplierContact>,
  ): Promise<SupplierContact> {
    const [row] = await this.db
      .update(supplierContacts)
      .set(data)
      .where(eq(supplierContacts.id, id))
      .returning();
    return row as SupplierContact;
  }

  async deleteContact(id: string): Promise<void> {
    await this.db.delete(supplierContacts).where(eq(supplierContacts.id, id));
  }

  async clearPrimaryBySupplierId(supplierId: string): Promise<void> {
    await this.db
      .update(supplierContacts)
      .set({ isPrimary: false })
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.isPrimary, true)));
  }

  async syncSupplierPrimaryContact(
    supplierId: string,
    data: { name: string | null; phone: string; email: string | null },
  ): Promise<void> {
    await this.db
      .update(suppliers)
      .set({
        contactName: data.name,
        phone: data.phone,
        email: data.email,
      })
      .where(eq(suppliers.id, supplierId));
  }
}
