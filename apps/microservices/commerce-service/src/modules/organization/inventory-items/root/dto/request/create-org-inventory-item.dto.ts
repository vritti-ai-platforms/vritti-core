import { CreateInventoryItemDto } from '@domain/inventory-items/dto/request/create-inventory-item.dto';
import { IsBoolean } from 'class-validator';

export class CreateOrgInventoryItemDto extends CreateInventoryItemDto {
  @IsBoolean()
  createOffering: boolean;
}
