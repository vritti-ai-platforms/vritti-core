import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsUUID } from 'class-validator';

// Variants are only meaningful within their offering, so the parent is required rather than optional
export class OfferingVariantsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID()
  offeringId: string;
}
