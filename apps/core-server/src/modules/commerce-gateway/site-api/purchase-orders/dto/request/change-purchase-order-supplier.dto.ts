import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangePurchaseOrderSupplierDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  supplierId: string;
}
