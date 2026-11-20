import { AddSupplierItemDto } from '@commerce/suppliers/dto/request/add-supplier-item.dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// The supplier to set the item up for, with the same terms as adding the item from the supplier
export class AddInventoryItemSupplierDto extends OmitType(AddSupplierItemDto, ['inventoryItemId'] as const) {
  @ApiProperty({ description: "ID of one of the legal entity's suppliers" })
  @IsUUID('7')
  supplierId: string;
}
