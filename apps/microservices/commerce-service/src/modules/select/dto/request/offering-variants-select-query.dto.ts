import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsUUID } from 'class-validator';

// Variants are only meaningful within their offering, so the parent is required rather than optional
export class OfferingVariantsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID('7')
  offeringId: string;
}
