import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type PartyFunctionType, type PartyRelationship, PartyFunctionTypeValues } from '@/db/schema';
import type { PartyFunctionAssignmentInput } from '../dto/request/party-function-assignment-input.dto';
import { PartyFunctionsDomainRepository } from '../repositories/party-functions.repository';

export interface SyncEntityFunctionsInput {
  partyId: string;
  target: { addressId?: string; relationshipId?: string };
  functions: PartyFunctionAssignmentInput[];
}

const ADDRESS_FUNCTIONS = new Set<PartyFunctionType>([
  PartyFunctionTypeValues.REGISTERED,
  PartyFunctionTypeValues.BILLING,
  PartyFunctionTypeValues.SHIPPING,
  PartyFunctionTypeValues.ORDERING,
]);

const CONTACT_FUNCTIONS = new Set<PartyFunctionType>([
  PartyFunctionTypeValues.ORDER,
  PartyFunctionTypeValues.ACCOUNTS,
  PartyFunctionTypeValues.LOGISTICS,
  PartyFunctionTypeValues.ESCALATION,
]);

@Injectable()
export class PartyFunctionsDomainService {
  private readonly logger = new Logger(PartyFunctionsDomainService.name);

  constructor(private readonly repository: PartyFunctionsDomainRepository) {}

  // Returns the relationship that holds a party's primary row for a contact-function, if one is set
  findPrimaryRelationship(partyId: string, functionCode: PartyFunctionType): Promise<PartyRelationship | undefined> {
    return this.repository.findPrimaryRelationship(partyId, functionCode);
  }

  // Returns true when the relationship already holds the given function
  relationshipHasFunction(relationshipId: string, functionCode: PartyFunctionType): Promise<boolean> {
    return this.repository.relationshipHasFunction(relationshipId, functionCode);
  }

  // Upserts the function rows of one address or relationship: inserts new, deletes removed, and applies
  // single-primary-per-function via clear-then-set. Runs inside the caller's transaction.
  async syncEntityFunctions(input: SyncEntityFunctionsInput): Promise<void> {
    const { partyId, target, functions } = input;
    const addressId = target.addressId;
    const relationshipId = target.relationshipId;
    const isAddress = addressId != null;
    const isRelationship = relationshipId != null;
    if (isAddress === isRelationship) {
      throw new BadRequestException({
        label: 'Invalid Target',
        detail: 'A function assignment must target exactly one address or one relationship.',
      });
    }

    const allowed = isAddress ? ADDRESS_FUNCTIONS : CONTACT_FUNCTIONS;
    for (const assignment of functions) {
      if (!allowed.has(assignment.function)) {
        throw new BadRequestException({
          label: 'Invalid Function',
          detail: `"${assignment.function}" cannot be assigned to a ${isAddress ? 'address' : 'contact'}.`,
          errors: [{ field: 'function', message: 'Function not valid for this target' }],
        });
      }
    }

    const existing = isAddress
      ? await this.repository.findByAddress(addressId as string)
      : await this.repository.findByRelationship(relationshipId as string);
    const desired = new Set(functions.map((assignment) => assignment.function));

    for (const row of existing) {
      if (!desired.has(row.function)) await this.repository.delete(row.id);
    }

    for (const assignment of functions) {
      const current = existing.find((row) => row.function === assignment.function);
      const isPrimary = assignment.isPrimary ?? false;
      if (current) {
        if (isPrimary) await this.repository.clearPrimary(partyId, assignment.function, current.id);
        await this.repository.update(current.id, { isPrimary });
      } else {
        if (isPrimary) await this.repository.clearPrimary(partyId, assignment.function);
        await this.repository.create({
          partyId,
          function: assignment.function,
          partyAddressId: isAddress ? (addressId as string) : null,
          partyRelationshipId: isRelationship ? (relationshipId as string) : null,
          isPrimary,
        });
      }
    }
    this.logger.log(`Synced functions for party ${partyId} ${isAddress ? 'address' : 'relationship'}`);
  }
}
