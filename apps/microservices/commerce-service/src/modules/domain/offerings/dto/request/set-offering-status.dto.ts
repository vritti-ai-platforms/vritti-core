import { IsBoolean, IsUUID } from 'class-validator';

export class SetOfferingStatusDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isActive: boolean;
}
