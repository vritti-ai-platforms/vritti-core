import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseOrderItemDefaultsQueryDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  inventoryItemId: string;

  // The unit the line orders in; the supplier's unit at the site when omitted
  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
