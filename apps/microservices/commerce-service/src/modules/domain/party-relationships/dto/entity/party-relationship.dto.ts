import type { PartyFunctionType, PartyRelationship } from '@/db/schema';

export interface RelationshipFunction {
  function: PartyFunctionType;
  isPrimary: boolean;
}

export interface PartyRelationshipRow extends PartyRelationship {
  childName: string | null;
  childEmail: string | null;
  childPhone: string | null;
  functions: RelationshipFunction[];
}

export class PartyRelationshipDto {
  id: string;
  parentPartyId: string;
  childPartyId: string;
  childName: string | null;
  childEmail: string | null;
  childPhone: string | null;
  jobTitle: string | null;
  isActive: boolean;
  functions: RelationshipFunction[];
  createdAt: string;
  updatedAt: string;

  // Maps a PartyRelationship row (with the child's name, main lines, and functions) to a PartyRelationshipDto
  static from(entity: PartyRelationship, childName: string | null = null): PartyRelationshipDto {
    const row = entity as Partial<PartyRelationshipRow> & PartyRelationship;
    const dto = new PartyRelationshipDto();
    dto.id = entity.id;
    dto.parentPartyId = entity.parentPartyId;
    dto.childPartyId = entity.childPartyId;
    dto.childName = row.childName ?? childName;
    dto.childEmail = row.childEmail ?? null;
    dto.childPhone = row.childPhone ?? null;
    dto.jobTitle = entity.jobTitle ?? null;
    dto.isActive = entity.isActive;
    dto.functions = row.functions ?? [];
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
