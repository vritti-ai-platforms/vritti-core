import { IsEnum, IsOptional } from 'class-validator';
import { type PartyFunctionType, PartyFunctionTypeValues } from '@/db/schema';
import { PartySelectQueryDto } from './party-select-query.dto';

export class PartyContactSelectQueryDto extends PartySelectQueryDto {
  @IsOptional()
  @IsEnum(PartyFunctionTypeValues)
  function?: PartyFunctionType;
}
