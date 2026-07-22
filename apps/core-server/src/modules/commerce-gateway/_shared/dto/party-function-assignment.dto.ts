import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export const PARTY_FUNCTION_TYPES = {
  REGISTERED: 'REGISTERED',
  BILLING: 'BILLING',
  SHIPPING: 'SHIPPING',
  ORDERING: 'ORDERING',
  ORDER: 'ORDER',
  ACCOUNTS: 'ACCOUNTS',
  LOGISTICS: 'LOGISTICS',
  ESCALATION: 'ESCALATION',
} as const;

export type PartyFunctionType = (typeof PARTY_FUNCTION_TYPES)[keyof typeof PARTY_FUNCTION_TYPES];

export class PartyFunctionAssignmentDto {
  @ApiProperty({ description: 'Party function assigned to this contact or address', enum: PARTY_FUNCTION_TYPES })
  @IsEnum(PARTY_FUNCTION_TYPES)
  function: PartyFunctionType;

  @ApiPropertyOptional({ description: 'Whether this record is the primary target for the function' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class PartyFunctionResponseDto {
  @ApiProperty({ description: 'Party function assigned to this contact or address', enum: PARTY_FUNCTION_TYPES })
  function: PartyFunctionType;

  @ApiProperty({ description: 'Whether this record is the primary target for the function' })
  isPrimary: boolean;
}
