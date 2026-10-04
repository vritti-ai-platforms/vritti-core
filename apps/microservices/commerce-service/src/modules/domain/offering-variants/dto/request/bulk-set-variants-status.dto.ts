import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetVariantsStatusDto {
  @IsUUID('7')
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @IsBoolean()
  isActive: boolean;
}
