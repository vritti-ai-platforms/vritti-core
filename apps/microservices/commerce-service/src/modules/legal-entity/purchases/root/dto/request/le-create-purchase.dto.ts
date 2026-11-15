import { CreatePurchaseDto } from '@domain/purchases/dto/request/create-purchase.dto';
import { IsTimeZone, IsUUID } from 'class-validator';

export class LeCreatePurchaseDto extends CreatePurchaseDto {
  @IsUUID('7')
  siteId: string;

  @IsTimeZone()
  timezone: string;
}
