import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type PartyFunctionType, PartyFunctionTypeValues, type PartyRelationship } from '@/db/schema';
import type { PartyFunctionAssignmentInput } from '../dto/request/party-function-assignment-input.dto';
import { PartyFunctionsDomainRepository } from '../repositories/party-functions.repository';

export interface SyncEntityFunctionsInput {
  partyId: string;
  target: { addressId?: string; relationshipId?: string; communicationId?: string };
  functions: PartyFunctionAssignmentInput[];
}

const ADDRESS_FUNCTIONS = new Set<PartyFunctionType>([
  PartyFunctionTypeValues.REGISTERED,
  PartyFunctionTypeValues.BILLING,
  PartyFunctionTypeValues.SHIPPING,
  PartyFunctionTypeValues.ORDERING,
]);

const COMMUNICATION_FUNCTIONS = new Set<PartyFunctionType>([PartyFunctionTypeValues.ORDERING]);

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

  // Upserts the function rows of one address, relationship or communication: inserts new, deletes removed, and
  // applies single-primary-per-function via clear-then-set (communication functions are never primary)
  async syncEntityFunctions(input: SyncEntityFunctionsInput): Promise<void> {
    const { partyId, target, functions } = input;
    const { addressId, relationshipId, communicationId } = target;
    const targets = [addressId, relationshipId, communicationId].filter((id) => id != null);
    if (targets.length !== 1) {
      throw new BadRequestException({
        label: 'Invalid Target',
        detail: 'A function assignment must target exactly one address, relationship or communication.',
      });
    }

    const kind = addressId ? 'address' : relationshipId ? 'contact' : 'communication';
    const allowed = addressId ? ADDRESS_FUNCTIONS : relationshipId ? CONTACT_FUNCTIONS : COMMUNICATION_FUNCTIONS;
    const field = communicationId ? 'functions' : 'function';
    for (const assignment of functions) {
      if (!allowed.has(assignment.function)) {
        throw new BadRequestException({
          label: 'Invalid Function',
          detail: `"${assignment.function}" cannot be assigned to a ${kind}.`,
          errors: [{ field, message: 'Function not valid for this target' }],
        });
      }
    }

    const existing = addressId
      ? await this.repository.findByAddress(addressId)
      : relationshipId
        ? await this.repository.findByRelationship(relationshipId)
        : await this.repository.findByCommunication(communicationId as string);
    const desired = new Set(functions.map((assignment) => assignment.function));

    for (const row of existing) {
      if (!desired.has(row.function)) await this.repository.delete(row.id);
    }

    for (const assignment of functions) {
      const current = existing.find((row) => row.function === assignment.function);
      const isPrimary = communicationId ? false : (assignment.isPrimary ?? false);
      if (current) {
        if (isPrimary) await this.repository.clearPrimary(partyId, assignment.function, current.id);
        await this.repository.update(current.id, { isPrimary });
      } else {
        if (isPrimary) await this.repository.clearPrimary(partyId, assignment.function);
        await this.repository.create({
          partyId,
          function: assignment.function,
          partyAddressId: addressId ?? null,
          partyRelationshipId: relationshipId ?? null,
          partyCommunicationId: communicationId ?? null,
          isPrimary,
        });
      }
    }
    this.logger.log(`Synced functions for party ${partyId} ${kind}`);
  }

  // Returns the relationship that holds a party's primary row for a contact-function, if one is set
  findPrimaryRelationship(partyId: string, functionCode: PartyFunctionType): Promise<PartyRelationship | undefined> {
    return this.repository.findPrimaryRelationship(partyId, functionCode);
  }

  // Returns true when the relationship already holds the given function
  relationshipHasFunction(relationshipId: string, functionCode: PartyFunctionType): Promise<boolean> {
    return this.repository.relationshipHasFunction(relationshipId, functionCode);
  }
}
