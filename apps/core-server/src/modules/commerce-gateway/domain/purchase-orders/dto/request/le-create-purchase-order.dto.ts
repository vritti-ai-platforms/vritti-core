import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';

export class LeCreatePurchaseOrderDto extends CreatePurchaseOrderDto {
  @ApiProperty({ description: "The legal entity's site the purchase order is raised for" })
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
