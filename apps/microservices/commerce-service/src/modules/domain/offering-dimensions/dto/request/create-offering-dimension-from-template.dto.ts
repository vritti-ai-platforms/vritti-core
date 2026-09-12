import { IsUUID } from 'class-validator';

export class CreateOfferingDimensionFromTemplateDto {
  @IsUUID()
  offeringId: string;

  @IsUUID()
  templateId: string;
}
