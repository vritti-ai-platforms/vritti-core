import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq, ilike, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type NewPartyTaxRegistration,
  type Party,
  type PartyAddress,
  type PartyTaxRegistration,
  parties,
  partyAddresses,
  partyRelationships,
  partyTaxRegistrations,
  suppliers,
  taxJurisdictions,
} from '@/db/schema';

@Injectable()
export class PartiesDomainRepository extends PrimaryBaseRepository<typeof parties> {
  constructor(database: PrimaryDatabaseService) {
    super(database, parties);
  }

  // Paginated party options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Whether any supplier references this party (the only FK that restricts party deletion;
  // party_* children cascade). Drives the delete guard.
  async isReferencedBySupplier(partyId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.partyId, partyId))
      .limit(1);
    return !!row;
  }

  // Whether this party is a contact of any company (child in a party relationship). Blocks person
  // deletion so a live company contact isn't silently unlinked.
  async isLinkedToCompany(partyId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: partyRelationships.id })
      .from(partyRelationships)
      .where(eq(partyRelationships.childPartyId, partyId))
      .limit(1);
    return !!row;
  }

  // Single-query party detail: the party joined to its primary address (most-recent fallback) plus a
  // supplier-reference flag for canDelete — one round-trip instead of three.
  async findByIdWithDetails(id: string): Promise<
    | {
        party: Party;
        primaryAddress: PartyAddress | null;
        referencedBySupplier: boolean;
        linkedToCompanies: boolean;
      }
    | undefined
  > {
    const primaryAddressSelectQuery = this.db
      .select()
      .from(partyAddresses)
      .where(eq(partyAddresses.partyId, parties.id))
      .orderBy(desc(partyAddresses.isPrimary), desc(partyAddresses.createdAt))
      .limit(1)
      .as('primary_address');

    const [row] = await this.db
      .select({
        party: parties,
        address: {
          id: primaryAddressSelectQuery.id,
          organizationId: primaryAddressSelectQuery.organizationId,
          partyId: primaryAddressSelectQuery.partyId,
          type: primaryAddressSelectQuery.type,
          line1: primaryAddressSelectQuery.line1,
          line2: primaryAddressSelectQuery.line2,
          city: primaryAddressSelectQuery.city,
          region: primaryAddressSelectQuery.region,
          postalCode: primaryAddressSelectQuery.postalCode,
          countryCode: primaryAddressSelectQuery.countryCode,
          isPrimary: primaryAddressSelectQuery.isPrimary,
          isActive: primaryAddressSelectQuery.isActive,
          createdAt: primaryAddressSelectQuery.createdAt,
          updatedAt: primaryAddressSelectQuery.updatedAt,
        },
        referencedBySupplier: sql<boolean>`exists (select 1 from ${suppliers} where ${suppliers.partyId} = ${parties.id})`,
        linkedToCompanies: sql<boolean>`exists (select 1 from ${partyRelationships} where ${partyRelationships.childPartyId} = ${parties.id})`,
      })
      .from(parties)
      .leftJoinLateral(primaryAddressSelectQuery, sql`true`)
      .where(eq(parties.id, id))
      .limit(1);

    if (!row) return undefined;
    return {
      party: row.party,
      primaryAddress: (row.address as PartyAddress | null) ?? null,
      referencedBySupplier: row.referencedBySupplier,
      linkedToCompanies: row.linkedToCompanies,
    };
  }

  // Returns paginated parties filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: Party[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns paginated tax registrations joined with the jurisdiction name
  async findRegistrationsForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: (PartyTaxRegistration & { jurisdictionName: string | null })[]; count: number }> {
    const rowsPromise = this.db
      .select({ registration: partyTaxRegistrations, jurisdictionName: taxJurisdictions.name })
      .from(partyTaxRegistrations)
      .leftJoin(taxJurisdictions, eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId))
      .where(options.where)
      .orderBy(...(options.orderBy ?? []))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(partyTaxRegistrations)
      .leftJoin(taxJurisdictions, eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId))
      .where(options.where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return {
      result: rows.map((row) => ({ ...row.registration, jurisdictionName: row.jurisdictionName ?? null })),
      count: countResult[0]?.count ?? 0,
    };
  }

  // Creates a party tax registration row
  async createRegistration(data: NewPartyTaxRegistration): Promise<PartyTaxRegistration> {
    const [row] = await this.db.insert(partyTaxRegistrations).values(data).returning();
    return row as PartyTaxRegistration;
  }

  // Loads a single party tax registration by id
  async findRegistrationById(id: string): Promise<PartyTaxRegistration | undefined> {
    const [row] = await this.db.select().from(partyTaxRegistrations).where(eq(partyTaxRegistrations.id, id)).limit(1);
    return row as PartyTaxRegistration | undefined;
  }

  // Updates a party tax registration row
  async updateRegistration(id: string, data: Partial<PartyTaxRegistration>): Promise<PartyTaxRegistration> {
    const [row] = await this.db
      .update(partyTaxRegistrations)
      .set(data)
      .where(eq(partyTaxRegistrations.id, id))
      .returning();
    return row as PartyTaxRegistration;
  }

  // Deletes a party tax registration row
  async deleteRegistration(id: string): Promise<void> {
    await this.db.delete(partyTaxRegistrations).where(eq(partyTaxRegistrations.id, id));
  }

  // Returns paginated active tax registration options of a party for the select component
  async findRegistrationOptionsForSelect(partyId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const conditions: SQL[] = [eq(partyTaxRegistrations.partyId, partyId), eq(partyTaxRegistrations.isActive, true)];
    if (query.search) {
      conditions.push(ilike(partyTaxRegistrations.registrationNumber, `%${query.search}%`));
    }

    const rows = await this.db
      .select({
        value: partyTaxRegistrations.id,
        label: partyTaxRegistrations.registrationNumber,
        description: partyTaxRegistrations.registrationType,
        isPrimary: partyTaxRegistrations.isPrimary,
        registrationType: partyTaxRegistrations.registrationType,
        totalCount: sql<number>`count(*) over()`.mapWith(Number),
      })
      .from(partyTaxRegistrations)
      .where(and(...conditions))
      .orderBy(desc(partyTaxRegistrations.isPrimary), asc(partyTaxRegistrations.registrationNumber))
      .limit(limit)
      .offset(offset);

    const totalCount = rows.length > 0 ? rows[0].totalCount : 0;
    return {
      options: rows.map((row) => ({
        value: row.value,
        label: row.label,
        description: row.description,
        additionals: { isPrimary: row.isPrimary, registrationType: row.registrationType },
      })),
      hasMore: offset + limit < totalCount,
      totalCount,
    };
  }
}
