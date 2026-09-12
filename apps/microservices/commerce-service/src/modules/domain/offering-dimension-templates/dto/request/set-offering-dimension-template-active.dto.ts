import { IsBoolean, IsUUID } from 'class-validator';

export class SetOfferingDimensionTemplateActiveDto {
  @IsUUID()
  id: string;

  @IsBoolean()
  isActive: boolean;
}
