import { IsBoolean, IsUUID } from 'class-validator';

export class UpdateInventoryItemLocationDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isBlocked: boolean;
}
