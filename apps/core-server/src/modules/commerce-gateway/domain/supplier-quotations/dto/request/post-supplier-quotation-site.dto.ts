import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PostSupplierQuotationSiteDto {
  @ApiProperty({ description: 'Site of the legal entity to post the quotation to' })
  @IsUUID('7')
  siteId: string;
}
