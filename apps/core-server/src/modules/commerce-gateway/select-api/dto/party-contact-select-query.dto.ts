import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  PARTY_FUNCTION_TYPES,
  type PartyFunctionType,
} from '@/modules/commerce-gateway/_shared/dto/party-function-assignment.dto';
import { PartySelectQueryDto } from './party-select-query.dto';

export class PartyContactSelectQueryDto extends PartySelectQueryDto {
  @ApiPropertyOptional({ description: 'Filter contacts by assigned function', enum: PARTY_FUNCTION_TYPES })
  @IsOptional()
  @IsEnum(PARTY_FUNCTION_TYPES)
  function?: PartyFunctionType;
}
