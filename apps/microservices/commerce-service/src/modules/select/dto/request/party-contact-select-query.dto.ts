import { IsEnum, IsOptional } from 'class-validator';
import { type PartyContactPurpose, PartyContactPurposeValues } from '@/db/schema';
import { PartySelectQueryDto } from './party-select-query.dto';

export class PartyContactSelectQueryDto extends PartySelectQueryDto {
  @IsOptional()
  @IsEnum(PartyContactPurposeValues)
  purpose?: PartyContactPurpose;
}
