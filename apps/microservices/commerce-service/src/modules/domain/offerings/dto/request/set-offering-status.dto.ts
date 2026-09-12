import { IsBoolean, IsUUID } from 'class-validator';

export class SetOfferingStatusDto {
  @IsUUID()
  id: string;

  @IsBoolean()
  isActive: boolean;
}
