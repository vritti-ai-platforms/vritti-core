import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreatePurchaseDto } from './create-purchase.dto';

export class LeCreatePurchaseDto extends CreatePurchaseDto {
  @ApiProperty({ description: "The legal entity's site the purchase is raised for" })
  @IsUUID('7')
  siteId: string;
}
