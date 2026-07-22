import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { type PartyFunctionType, PartyFunctionTypeValues } from '@/db/schema';

export class PartyFunctionAssignmentInput {
  @IsEnum(PartyFunctionTypeValues)
  function: PartyFunctionType;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
