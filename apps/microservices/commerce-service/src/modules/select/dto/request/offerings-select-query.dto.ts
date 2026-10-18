import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class OfferingsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID('7')
  catalogId?: string;
}
