import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetVariantsStatusDto {
  @IsUUID()
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  @IsBoolean()
  isActive: boolean;
}
