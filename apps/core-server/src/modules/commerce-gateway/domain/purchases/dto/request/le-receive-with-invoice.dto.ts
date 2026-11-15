import { ApiProperty } from '@nestjs/swagger';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { FieldPermission } from '@/rbac/decorators';
import { anyLineSetsMrp, ReceiveWithInvoiceDto, ReceiveWithInvoiceLineDto } from './receive-with-invoice.dto';

export class LeReceiveWithInvoiceDto extends ReceiveWithInvoiceDto {
  @FieldPermission([LE_INVENTORY_ITEMS.mrp.edit], anyLineSetsMrp)
  @ApiProperty({
    type: [ReceiveWithInvoiceLineDto],
    description: "Invoiced lines, one receipt lot (or item) each; a line's MRP needs the MRP edit permission",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveWithInvoiceLineDto)
  declare lines: ReceiveWithInvoiceLineDto[];
}
