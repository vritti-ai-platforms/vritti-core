import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, inArray, isNull, ne, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  type PartyTaxRegistration,
  partyTaxRegistrations,
  type TaxJurisdiction,
  type TaxRegistrationType,
  TaxRegistrationTypeValues,
  taxJurisdictions,
} from '@/db/schema';

export type PartyTaxRegistrationDetail = PartyTaxRegistration & {
  jurisdictionName: string | null;
};

export interface PartyRegistrationPlacement {
  partyId: string;
  countryCode: string;
  jurisdictionId: string | null;
  registrationNumber: string;
  registrationType: TaxRegistrationType;
}

@Injectable()
export class PartyTaxRegistrationsDomainRepository extends PrimaryBaseRepository<typeof partyTaxRegistrations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyTaxRegistrations);
  }

  // Returns paginated tax registrations with their jurisdiction's name, filtered by an already-built where clause
  findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PartyTaxRegistrationDetail[]; count: number }> {
    return this.findAllAndCount<PartyTaxRegistrationDetail>({
      select: this.selection(),
      leftJoins: this.leftJoins(),
      ...options,
    });
  }

  // Reports which unique keys a party registration would collide on, in one pass: a party holds one registration per
  // country and jurisdiction, and a number is recorded once per organization
  async findConflicts(
    registration: PartyRegistrationPlacement,
    excludeId?: string,
  ): Promise<{ placeTaken: boolean; numberTaken: boolean }> {
    const placeMatch = and(
      eq(partyTaxRegistrations.partyId, registration.partyId),
      eq(partyTaxRegistrations.countryCode, registration.countryCode),
      registration.jurisdictionId
        ? eq(partyTaxRegistrations.jurisdictionId, registration.jurisdictionId)
        : isNull(partyTaxRegistrations.jurisdictionId),
    );
    const numberMatch = eq(partyTaxRegistrations.registrationNumber, registration.registrationNumber);

    const [row] = await this.db
      .select({
        placeTaken: sql<boolean>`coalesce(bool_or(${placeMatch}), false)`,
        numberTaken: sql<boolean>`coalesce(bool_or(${numberMatch}), false)`,
      })
      .from(partyTaxRegistrations)
      .where(and(or(placeMatch, numberMatch), excludeId ? ne(partyTaxRegistrations.id, excludeId) : undefined));

    return row ?? { placeTaken: false, numberTaken: false };
  }

  // Rejects a party registration that would collide with another one of the party's or the organization's
  async assertNoConflicts(
    registration: PartyRegistrationPlacement,
    jurisdiction: TaxJurisdiction | null,
    excludeId?: string,
  ): Promise<void> {
    const { placeTaken, numberTaken } = await this.findConflicts(registration, excludeId);
    if (placeTaken) {
      throw new ConflictException({
        label: 'Already Registered There',
        detail: jurisdiction
          ? `This party already has a registration in ${jurisdiction.name}. Edit that registration instead.`
          : `This party already has a national registration in ${registration.countryCode}. Edit that registration instead.`,
        errors: [{ field: jurisdiction ? 'jurisdictionId' : 'countryCode', message: 'Already registered here' }],
      });
    }
    if (numberTaken) {
      throw new ConflictException({
        label: 'Already Registered',
        detail: `"${registration.registrationNumber}" is already recorded against a party in this organization.`,
        errors: [{ field: 'registrationNumber', message: 'Already in use' }],
      });
    }
  }

  // Returns a party's active tax registrations as select options, primary first; salesTaxOnly keeps GSTIN and VAT
  findOptionsForSelect(
    partyId: string,
    query: SelectOptionsQueryDto,
    options?: { salesTaxOnly?: boolean },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];
    if (options?.salesTaxOnly) {
      conditions.push(
        inArray(partyTaxRegistrations.registrationType, [
          TaxRegistrationTypeValues.GSTIN,
          TaxRegistrationTypeValues.VAT,
        ]),
      );
    }
    return this.findForSelect({
      ...selectPageOptions(query),
      value: 'id',
      label: 'registrationNumber',
      description: 'registrationType',
      additionalKeys: ['isPrimary', 'registrationType'],
      searchKeys: ['registrationNumber'],
      orderBy: { isPrimary: 'desc', registrationNumber: 'asc' },
      where: { partyId, isActive: true },
      conditions,
    });
  }

  // Selects a registration with its jurisdiction's name — null for a national registration
  private selection() {
    return {
      ...getColumns(partyTaxRegistrations),
      jurisdictionName: taxJurisdictions.name,
    };
  }

  // Joins the jurisdiction, which a national registration does not name
  private leftJoins() {
    return [{ table: taxJurisdictions, on: eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId) }];
  }
}
