import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class OfferingVariantsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID('7')
  offeringId?: string;

  @IsOptional()
  @IsUUID('7')
  catalogId?: string;
}
